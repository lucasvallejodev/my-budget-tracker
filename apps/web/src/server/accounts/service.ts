import { and, asc, eq, isNull, sql } from 'drizzle-orm';

import { accounts, currencies, transactions } from '@/db/schema';
import { toIsoDate } from '@coinkeeper/shared/lib/date-helpers';
import type { AccountSummary } from '@coinkeeper/shared/schema/accounts';
import type { AccountClassification, AccountType } from '@coinkeeper/shared/schema/enums';

import { Db, notFound, ServiceError } from '../db';

const classificationFor = (type: AccountType): AccountClassification =>
  type === 'credit_card' || type === 'loan' ? 'liability' : 'asset';

export const createAccountService = (db: Db) => {
  const owned = async (userId: string, id: string) => {
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId), isNull(accounts.deletedAt)))
      .limit(1);

    return account ?? notFound('Account');
  };

  return {
    async archive(userId: string, id: string, archived = true) {
      await owned(userId, id);
      await db
        .update(accounts)
        .set({ archivedAt: archived ? new Date() : null })
        .where(eq(accounts.id, id));
    },
    async create(
      userId: string,
      data: {
        accountNumber?: string;
        color?: string;
        countsInSpending?: boolean;
        currency: string;
        icon?: string;
        institution?: string;
        name: string;
        notes?: string;
        openingBalanceMinor?: number;
        openingDate?: string;
        type: AccountType;
      }
    ) {
      const currency = data.currency.toUpperCase();

      const [known] = await db
        .select({ code: currencies.code })
        .from(currencies)
        .where(eq(currencies.code, currency))
        .limit(1);

      if (!known) throw new ServiceError(`Unknown currency ${currency}`);

      return db.transaction(async tx => {
        const [account] = await tx
          .insert(accounts)
          .values({
            accountNumber: data.accountNumber || null,
            classification: classificationFor(data.type),
            color: data.color || null,
            countsInSpending: data.countsInSpending ?? data.type !== 'investment',
            currency,
            icon: data.icon || null,
            institution: data.institution || null,
            name: data.name,
            notes: data.notes || null,
            type: data.type,
            userId,
          })
          .returning();

        if (data.openingBalanceMinor) {
          await tx.insert(transactions).values({
            accountId: account.id,
            amountMinor: data.openingBalanceMinor,
            currency,
            date: data.openingDate ?? toIsoDate(new Date()),
            kind: 'opening',
            memo: 'Opening balance',
            userId,
          });
        }

        return account;
      });
    },
    async get(userId: string, id: string) {
      const [summary] = (await this.list(userId, { includeArchived: true })).filter(
        row => row.id === id
      );

      return summary ?? notFound('Account');
    },
    async list(userId: string, { includeArchived = false } = {}): Promise<AccountSummary[]> {
      const rows = await db
        .select({
          accountNumber: accounts.accountNumber,
          archivedAt: accounts.archivedAt,
          balanceMinor: sql<string>`COALESCE((SELECT sum(t.amount_minor) FROM ${transactions} t WHERE t.account_id = "accounts"."id" AND t.deleted_at IS NULL), 0)`,
          classification: accounts.classification,
          color: accounts.color,
          countsInSpending: accounts.countsInSpending,
          currency: accounts.currency,
          icon: accounts.icon,
          id: accounts.id,
          institution: accounts.institution,
          name: accounts.name,
          notes: accounts.notes,
          transactionCount: sql<number>`(SELECT count(*)::int FROM ${transactions} t WHERE t.account_id = "accounts"."id" AND t.deleted_at IS NULL)`,
          type: accounts.type,
        })
        .from(accounts)
        .where(
          and(
            eq(accounts.userId, userId),
            isNull(accounts.deletedAt),
            includeArchived ? undefined : isNull(accounts.archivedAt)
          )
        )
        .orderBy(asc(accounts.createdAt));

      return rows.map(row => ({
        ...row,
        archivedAt: row.archivedAt?.toISOString() ?? null,
        balanceMinor: Number(row.balanceMinor),
        transactionCount: Number(row.transactionCount),
      }));
    },
    owned,
    async remove(userId: string, id: string) {
      await owned(userId, id);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(transactions)
        .where(and(eq(transactions.accountId, id), isNull(transactions.deletedAt)));

      if (Number(count) > 0) {
        throw new ServiceError('Archive accounts that have transactions instead of deleting them');
      }

      await db.update(accounts).set({ deletedAt: new Date() }).where(eq(accounts.id, id));
    },
    async update(
      userId: string,
      id: string,
      data: {
        accountNumber?: string | null;
        color?: string | null;
        countsInSpending?: boolean;
        currency?: string;
        icon?: string | null;
        institution?: string | null;
        name?: string;
        notes?: string | null;
        type?: AccountType;
      }
    ) {
      const account = await owned(userId, id);
      const patch: Partial<typeof accounts.$inferInsert> = { ...data };

      if (data.currency && data.currency.toUpperCase() !== account.currency) {
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(transactions)
          .where(and(eq(transactions.accountId, id), isNull(transactions.deletedAt)));

        if (Number(count) > 0) {
          throw new ServiceError('The currency of an account with transactions cannot change');
        }

        patch.currency = data.currency.toUpperCase();
      } else {
        delete patch.currency;
      }

      if (data.type) patch.classification = classificationFor(data.type);
      const [updated] = await db.update(accounts).set(patch).where(eq(accounts.id, id)).returning();

      return updated;
    },
  };
};
