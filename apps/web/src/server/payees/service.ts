import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';

import { categories, payees, transactions } from '@/db/schema';

import { Db, notFound } from '../db';

const RECENT_TRANSACTIONS_SAMPLE = 3;
const MAJORITY_OF_SAMPLE = 2;

export const createPayeeService = (db: Db) => ({
  async archive(userId: string, id: string) {
    await this.owned(userId, id);
    await db.update(payees).set({ archivedAt: new Date() }).where(eq(payees.id, id));
  },
  async create(userId: string, data: { defaultCategoryId?: string | null; name: string }) {
    if (data.defaultCategoryId) {
      const [category] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(and(eq(categories.id, data.defaultCategoryId), eq(categories.userId, userId)));

      if (!category) notFound('Category');
    }

    const [payee] = await db
      .insert(payees)
      .values({
        defaultCategoryId: data.defaultCategoryId || null,
        name: data.name.trim(),
        userId,
      })
      .returning();

    return payee;
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
  async list(userId: string) {
    return db
      .select({
        defaultCategoryId: payees.defaultCategoryId,
        id: payees.id,
        name: payees.name,
      })
      .from(payees)
      .where(and(eq(payees.userId, userId), isNull(payees.archivedAt)))
      .orderBy(asc(payees.name));
  },
  async owned(userId: string, id: string) {
    const [payee] = await db
      .select()
      .from(payees)
      .where(and(eq(payees.id, id), eq(payees.userId, userId), isNull(payees.archivedAt)))
      .limit(1);

    return payee ?? notFound('Payee');
  },
  async update(
    userId: string,
    id: string,
    data: { defaultCategoryId?: string | null; name?: string }
  ) {
    await this.owned(userId, id);
    const [updated] = await db.update(payees).set(data).where(eq(payees.id, id)).returning();

    return updated;
  },
});
