import { and, asc, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm';

import { accounts, currencies, transactions } from '@/db/schema';
import { toIsoDate } from '@coinkeeper/shared/lib/date-helpers';
import type { AccountSummary } from '@coinkeeper/shared/schema/accounts';
import type { AccountClassification, AccountType } from '@coinkeeper/shared/schema/enums';

import { conflict, Db, notFound, ServiceError, toIsoTimestamp } from '../db';

type ListOptions = {
  deleted?: boolean;
  ids?: string[];
  includeArchived?: boolean;
};

type AccountInput = {
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
};

type AccountPatch = {
  accountNumber?: string | null;
  color?: string | null;
  countsInSpending?: boolean;
  currency?: string;
  icon?: string | null;
  institution?: string | null;
  name?: string;
  notes?: string | null;
  type?: AccountType;
};

const classificationFor = (type: AccountType): AccountClassification =>
  type === 'credit_card' || type === 'loan' ? 'liability' : 'asset';

const liveTransactionCount = async (db: Db, accountId: string): Promise<number> => {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transactions)
    .where(and(eq(transactions.accountId, accountId), isNull(transactions.deletedAt)));

  return Number(count);
};

const listWhere = (userId: string, options: ListOptions) =>
  and(
    eq(accounts.userId, userId),
    options.deleted ? isNotNull(accounts.deletedAt) : isNull(accounts.deletedAt),
    options.includeArchived || options.deleted ? undefined : isNull(accounts.archivedAt),
    options.ids ? inArray(accounts.id, options.ids) : undefined
  );

export const createAccountService = (db: Db) => {
  const owned = async (userId: string, id: string) => {
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId), isNull(accounts.deletedAt)))
      .limit(1);

    return account ?? notFound('Account');
  };

  const list = async (userId: string, options: ListOptions = {}): Promise<AccountSummary[]> => {
    const rows = await db
      .select({
        accountNumber: accounts.accountNumber,
        archivedAt: accounts.archivedAt,
        balanceMinor: sql<string>`COALESCE((SELECT sum(t.amount_minor) FROM ${transactions} t WHERE t.account_id = "accounts"."id" AND t.deleted_at IS NULL), 0)`,
        classification: accounts.classification,
        color: accounts.color,
        countsInSpending: accounts.countsInSpending,
        currency: accounts.currency,
        deletedAt: accounts.deletedAt,
        icon: accounts.icon,
        id: accounts.id,
        institution: accounts.institution,
        name: accounts.name,
        notes: accounts.notes,
        transactionCount: sql<number>`(SELECT count(*)::int FROM ${transactions} t WHERE t.account_id = "accounts"."id" AND t.deleted_at IS NULL)`,
        type: accounts.type,
      })
      .from(accounts)
      .where(listWhere(userId, options))
      .orderBy(asc(accounts.createdAt));

    return rows.map(row => ({
      ...row,
      archivedAt: toIsoTimestamp(row.archivedAt),
      balanceMinor: Number(row.balanceMinor),
      deletedAt: toIsoTimestamp(row.deletedAt),
      transactionCount: Number(row.transactionCount),
    }));
  };

  const get = async (userId: string, id: string): Promise<AccountSummary> => {
    const [summary] = await list(userId, { ids: [id], includeArchived: true });

    return summary ?? notFound('Account');
  };

  return {
    async archive(userId: string, id: string, archived = true): Promise<AccountSummary> {
      await owned(userId, id);
      await db
        .update(accounts)
        .set({ archivedAt: archived ? new Date() : null })
        .where(eq(accounts.id, id));

      return get(userId, id);
    },
    async create(userId: string, data: AccountInput): Promise<AccountSummary> {
      const currency = data.currency.toUpperCase();

      const [known] = await db
        .select({ code: currencies.code })
        .from(currencies)
        .where(eq(currencies.code, currency))
        .limit(1);

      if (!known) throw new ServiceError(`Unknown currency ${currency}`);

      const account = await db.transaction(async tx => {
        const [created] = await tx
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
            accountId: created.id,
            amountMinor: data.openingBalanceMinor,
            currency,
            date: data.openingDate ?? toIsoDate(new Date()),
            kind: 'opening',
            memo: 'Opening balance',
            userId,
          });
        }

        return created;
      });

      return get(userId, account.id);
    },
    get,
    list,
    owned,
    async remove(userId: string, id: string): Promise<void> {
      await owned(userId, id);

      if ((await liveTransactionCount(db, id)) > 0) {
        conflict('Archive accounts that have transactions instead of deleting them');
      }

      await db.update(accounts).set({ deletedAt: new Date() }).where(eq(accounts.id, id));
    },
    async restore(userId: string, id: string): Promise<AccountSummary> {
      const updated = await db
        .update(accounts)
        .set({ deletedAt: null })
        .where(and(eq(accounts.id, id), eq(accounts.userId, userId), isNotNull(accounts.deletedAt)))
        .returning({ id: accounts.id });

      if (!updated.length) await owned(userId, id);

      return get(userId, id);
    },
    async update(userId: string, id: string, data: AccountPatch): Promise<AccountSummary> {
      const account = await owned(userId, id);
      const patch: Partial<typeof accounts.$inferInsert> = { ...data };

      if (data.currency && data.currency.toUpperCase() !== account.currency) {
        if ((await liveTransactionCount(db, id)) > 0) {
          conflict('The currency of an account with transactions cannot change');
        }

        patch.currency = data.currency.toUpperCase();
      } else {
        delete patch.currency;
      }

      if (data.type) patch.classification = classificationFor(data.type);
      await db.update(accounts).set(patch).where(eq(accounts.id, id));

      return get(userId, id);
    },
  };
};
