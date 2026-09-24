import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';

import { categories, payees, transactions } from '@/db/schema';
import type { PayeeRow } from '@coinkeeper/shared/schema/payees';

import { conflict, Db, notFound, toIsoTimestamp } from '../db';
import { isUniqueViolation } from '../errors';

const RECENT_TRANSACTIONS_SAMPLE = 3;
const MAJORITY_OF_SAMPLE = 2;

type PayeeRecord = typeof payees.$inferSelect;

const toPayee = (row: PayeeRecord): PayeeRow => ({
  archivedAt: toIsoTimestamp(row.archivedAt),
  defaultCategoryId: row.defaultCategoryId,
  id: row.id,
  name: row.name,
});

const nameTaken = (): never => conflict('A payee with that name already exists');

export const createPayeeService = (db: Db) => {
  const find = async (userId: string, id: string) => {
    const [payee] = await db
      .select()
      .from(payees)
      .where(and(eq(payees.id, id), eq(payees.userId, userId)))
      .limit(1);

    return payee ?? notFound('Payee');
  };

  const owned = async (userId: string, id: string) => {
    const payee = await find(userId, id);

    return payee.archivedAt ? notFound('Payee') : payee;
  };

  const assertCategory = async (userId: string, categoryId: string) => {
    const [category] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)));

    if (!category) notFound('Category');
  };

  const setArchived = async (userId: string, id: string, archived: boolean) => {
    await find(userId, id);

    const [updated] = await db
      .update(payees)
      .set({ archivedAt: archived ? new Date() : null })
      .where(eq(payees.id, id))
      .returning();

    return toPayee(updated);
  };

  return {
    archive: (userId: string, id: string) => setArchived(userId, id, true),
    async create(
      userId: string,
      data: { defaultCategoryId?: string | null; name: string }
    ): Promise<PayeeRow> {
      if (data.defaultCategoryId) await assertCategory(userId, data.defaultCategoryId);

      try {
        const [payee] = await db
          .insert(payees)
          .values({
            defaultCategoryId: data.defaultCategoryId || null,
            name: data.name.trim(),
            userId,
          })
          .returning();

        return toPayee(payee);
      } catch (error) {
        if (isUniqueViolation(error)) return nameTaken();
        throw error;
      }
    },
    async findOrCreate(userId: string, name: string) {
      const trimmed = name.trim();

      const [existing] = await db
        .select()
        .from(payees)
        .where(and(eq(payees.userId, userId), sql`lower(${payees.name}) = lower(${trimmed})`))
        .limit(1);

      if (existing) return existing;
      const [payee] = await db.insert(payees).values({ name: trimmed, userId }).returning();

      return payee;
    },
    async learnDefaultCategory(userId: string, payeeId: string) {
      const recent = await db
        .select({ categoryId: transactions.categoryId })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.payeeId, payeeId),
            eq(transactions.kind, 'standard'),
            isNull(transactions.deletedAt)
          )
        )
        .orderBy(desc(transactions.date), desc(transactions.createdAt))
        .limit(RECENT_TRANSACTIONS_SAMPLE);

      const tally = new Map<string, number>();

      for (const row of recent) {
        if (row.categoryId) tally.set(row.categoryId, (tally.get(row.categoryId) ?? 0) + 1);
      }

      const winner = [...tally.entries()].find(([, count]) => count >= MAJORITY_OF_SAMPLE)?.[0];
      const fallback = recent.length < MAJORITY_OF_SAMPLE ? recent[0]?.categoryId : undefined;
      const next = winner ?? fallback;

      if (next) {
        await db
          .update(payees)
          .set({ defaultCategoryId: next })
          .where(and(eq(payees.id, payeeId), eq(payees.userId, userId)));
      }
    },
    async list(userId: string, { includeArchived = false } = {}): Promise<PayeeRow[]> {
      const rows = await db
        .select()
        .from(payees)
        .where(
          and(eq(payees.userId, userId), includeArchived ? undefined : isNull(payees.archivedAt))
        )
        .orderBy(asc(payees.name));

      return rows.map(toPayee);
    },
    owned,
    unarchive: (userId: string, id: string) => setArchived(userId, id, false),
    async update(
      userId: string,
      id: string,
      data: { defaultCategoryId?: string | null; name?: string }
    ): Promise<PayeeRow> {
      await owned(userId, id);
      if (data.defaultCategoryId) await assertCategory(userId, data.defaultCategoryId);

      try {
        const [updated] = await db
          .update(payees)
          .set({ ...data, name: data.name?.trim() })
          .where(eq(payees.id, id))
          .returning();

        return toPayee(updated);
      } catch (error) {
        if (isUniqueViolation(error)) return nameTaken();
        throw error;
      }
    },
  };
};
