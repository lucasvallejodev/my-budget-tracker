import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { accounts, currencies, transactions } from '@/db/schema';
import { Db, ServiceError, notFound } from '../db';

export type AccountType = (typeof accounts.$inferSelect)['type'];
export type Classification = (typeof accounts.$inferSelect)['classification'];

export function classificationFor(type: AccountType): Classification {
  return type === 'credit_card' || type === 'loan' ? 'liability' : 'asset';
}

export type AccountSummary = {
  id: string;
  name: string;
  type: AccountType;
  classification: Classification;
  currency: string;
  institution: string | null;
  accountNumber: string | null;
  color: string | null;
  icon: string | null;
  notes: string | null;
  countsInSpending: boolean;
  archivedAt: string | null;
  balanceMinor: number;
  transactionCount: number;
};

export function createAccountService(db: Db) {
  async function owned(userId: string, id: string) {
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId), isNull(accounts.deletedAt)))
      .limit(1);
    return account ?? notFound('Account');
  }
  return {
    owned,
    async list(userId: string, { includeArchived = false } = {}): Promise<AccountSummary[]> {
      const rows = await db
        .select({
          id: accounts.id,
          name: accounts.name,
          type: accounts.type,
          classification: accounts.classification,
          currency: accounts.currency,
          institution: accounts.institution,
          accountNumber: accounts.accountNumber,
          color: accounts.color,
          icon: accounts.icon,
          notes: accounts.notes,
          countsInSpending: accounts.countsInSpending,
          archivedAt: accounts.archivedAt,
          balanceMinor: sql<string>`COALESCE((SELECT sum(t.amount_minor) FROM ${transactions} t WHERE t.account_id = "accounts"."id" AND t.deleted_at IS NULL), 0)`,
          transactionCount: sql<number>`(SELECT count(*)::int FROM ${transactions} t WHERE t.account_id = "accounts"."id" AND t.deleted_at IS NULL)`,
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
    async get(userId: string, id: string) {
      const [summary] = (await this.list(userId, { includeArchived: true })).filter(
        row => row.id === id
      );
      return summary ?? notFound('Account');
    },
    async create(
      userId: string,
      data: {
        name: string;
        type: AccountType;
        currency: string;
        institution?: string;
        accountNumber?: string;
        color?: string;
        icon?: string;
        notes?: string;
        countsInSpending?: boolean;
        openingBalanceMinor?: number;
        openingDate?: string;
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
            userId,
            name: data.name,
            type: data.type,
            classification: classificationFor(data.type),
            currency,
            institution: data.institution || null,
            accountNumber: data.accountNumber || null,
            color: data.color || null,
            icon: data.icon || null,
            notes: data.notes || null,
            countsInSpending: data.countsInSpending ?? data.type !== 'investment',
          })
          .returning();
        if (data.openingBalanceMinor) {
          await tx.insert(transactions).values({
            userId,
            accountId: account.id,
            amountMinor: data.openingBalanceMinor,
            currency,
            date: data.openingDate ?? new Date().toISOString().slice(0, 10),
            kind: 'opening',
            memo: 'Opening balance',
          });
        }
        return account;
      });
    },
    async update(
      userId: string,
      id: string,
      data: {
        name?: string;
        type?: AccountType;
        currency?: string;
        institution?: string | null;
        accountNumber?: string | null;
        color?: string | null;
        icon?: string | null;
        notes?: string | null;
        countsInSpending?: boolean;
      }
    ) {
      const account = await owned(userId, id);
      const patch: Partial<typeof accounts.$inferInsert> = { ...data };
      if (data.currency && data.currency.toUpperCase() !== account.currency) {
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(transactions)
          .where(and(eq(transactions.accountId, id), isNull(transactions.deletedAt)));
        if (Number(count) > 0)
          throw new ServiceError('The currency of an account with transactions cannot change');
        patch.currency = data.currency.toUpperCase();
      } else {
        delete patch.currency;
      }
      if (data.type) patch.classification = classificationFor(data.type);
      const [updated] = await db.update(accounts).set(patch).where(eq(accounts.id, id)).returning();
      return updated;
    },
    async archive(userId: string, id: string, archived = true) {
      await owned(userId, id);
      await db
        .update(accounts)
        .set({ archivedAt: archived ? new Date() : null })
        .where(eq(accounts.id, id));
    },
    async remove(userId: string, id: string) {
      await owned(userId, id);
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(transactions)
        .where(and(eq(transactions.accountId, id), isNull(transactions.deletedAt)));
      if (Number(count) > 0)
        throw new ServiceError('Archive accounts that have transactions instead of deleting them');
      await db.update(accounts).set({ deletedAt: new Date() }).where(eq(accounts.id, id));
    },
  };
}
