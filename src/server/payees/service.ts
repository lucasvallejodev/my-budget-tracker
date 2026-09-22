import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';
import { categories, payees, transactions } from '@/db/schema';
import { Db, notFound } from '../db';

export function createPayeeService(db: Db) {
  return {
    async list(userId: string) {
      return db
        .select({
          id: payees.id,
          name: payees.name,
          defaultCategoryId: payees.defaultCategoryId,
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
    async create(userId: string, data: { name: string; defaultCategoryId?: string | null }) {
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
          userId,
          name: data.name.trim(),
          defaultCategoryId: data.defaultCategoryId || null,
        })
        .returning();
      return payee;
    },
    /** Finds a payee by name (case-insensitive) or creates it. Used by import. */
    async findOrCreate(userId: string, name: string) {
      const trimmed = name.trim();
      const [existing] = await db
        .select()
        .from(payees)
        .where(and(eq(payees.userId, userId), sql`lower(${payees.name}) = lower(${trimmed})`))
        .limit(1);
      if (existing) return existing;
      const [payee] = await db.insert(payees).values({ userId, name: trimmed }).returning();
      return payee;
    },
    async update(
      userId: string,
      id: string,
      data: { name?: string; defaultCategoryId?: string | null }
    ) {
      await this.owned(userId, id);
      const [updated] = await db.update(payees).set(data).where(eq(payees.id, id)).returning();
      return updated;
    },
    async archive(userId: string, id: string) {
      await this.owned(userId, id);
      await db.update(payees).set({ archivedAt: new Date() }).where(eq(payees.id, id));
    },
    /**
     * Payee → category memory (YNAB's "2 of the last 3" rule): after a categorised transaction is
     * saved, the payee default becomes the category used by at least two of its three most recent
     * standard transactions.
     */
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
        .limit(3);
      const tally = new Map<string, number>();
      for (const row of recent)
        if (row.categoryId) tally.set(row.categoryId, (tally.get(row.categoryId) ?? 0) + 1);
      const winner = [...tally.entries()].find(([, count]) => count >= 2)?.[0];
      const fallback = recent.length < 2 ? recent[0]?.categoryId : undefined;
      const next = winner ?? fallback;
      if (next)
        await db
          .update(payees)
          .set({ defaultCategoryId: next })
          .where(and(eq(payees.id, payeeId), eq(payees.userId, userId)));
    },
  };
}
