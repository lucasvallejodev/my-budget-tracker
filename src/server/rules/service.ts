import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { categories, rules, transactions } from '@/db/schema';
import { Db, ServiceError, notFound } from '../db';

export type RuleRow = {
  id: string;
  name: string;
  pattern: string;
  categoryId: string;
  categoryName: string | null;
  priority: number;
};

/** Rules are the simplest useful shape: "text contains X → category Y", highest priority first. */
export const createRuleService = (db: Db) => {
  const owned = async (userId: string, id: string) => {
    const [rule] = await db
      .select()
      .from(rules)
      .where(and(eq(rules.id, id), eq(rules.userId, userId)))
      .limit(1);

    return rule ?? notFound('Rule');
  };

  return {
    async list(userId: string): Promise<RuleRow[]> {
      return db
        .select({
          id: rules.id,
          name: rules.name,
          pattern: rules.pattern,
          categoryId: rules.categoryId,
          categoryName: categories.name,
          priority: rules.priority,
        })
        .from(rules)
        .leftJoin(categories, eq(categories.id, rules.categoryId))
        .where(eq(rules.userId, userId))
        .orderBy(asc(rules.priority), asc(rules.createdAt));
    },
    async create(
      userId: string,
      data: {
        name?: string;
        pattern: string;
        categoryId: string;
      }
    ) {
      const pattern = data.pattern.trim();

      if (!pattern) throw new ServiceError('Pattern is required');

      const [category] = await db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .where(
          and(
            eq(categories.id, data.categoryId),
            eq(categories.userId, userId),
            isNull(categories.archivedAt)
          )
        );

      if (!category) notFound('Category');

      const [{ next }] = await db
        .select({ next: sql<number>`COALESCE(max(${rules.priority}), -1) + 1` })
        .from(rules)
        .where(eq(rules.userId, userId));

      const [rule] = await db
        .insert(rules)
        .values({
          userId,
          name: data.name?.trim() || `${pattern} → ${category.name}`,
          pattern,
          categoryId: category.id,
          priority: Number(next),
        })
        .returning();

      return rule;
    },
    async remove(userId: string, id: string) {
      await owned(userId, id);
      await db.delete(rules).where(eq(rules.id, id));
    },
    /** First rule whose pattern appears (case-insensitively) in any of the texts. */
    async match(userId: string, texts: (string | null | undefined)[]) {
      const haystack = texts
        .filter((t): t is string => !!t)
        .join('\n')
        .toLowerCase();

      if (!haystack) return null;

      for (const rule of await this.list(userId)) {
        if (haystack.includes(rule.pattern.toLowerCase())) return rule;
      }

      return null;
    },
    /** Applies rules to every uncategorised standard transaction; returns how many were set. */
    async applyToUncategorized(userId: string) {
      const list = await this.list(userId);

      if (!list.length) return 0;

      const rows = await db
        .select({
          id: transactions.id,
          memo: transactions.memo,
          originalPayee: transactions.originalPayee,
          payeeName: sql<
            string | null
          >`(SELECT p.name FROM payees p WHERE p.id = ${transactions.payeeId})`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.kind, 'standard'),
            isNull(transactions.categoryId),
            isNull(transactions.deletedAt)
          )
        );

      let updated = 0;

      for (const row of rows) {
        const haystack = [row.payeeName, row.originalPayee, row.memo]
          .filter(Boolean)
          .join('\n')
          .toLowerCase();

        const rule = list.find(r => haystack.includes(r.pattern.toLowerCase()));

        if (!rule) continue;
        await db
          .update(transactions)
          .set({ categoryId: rule.categoryId, needsReview: false })
          .where(eq(transactions.id, row.id));
        updated++;
      }

      return updated;
    },
  };
};
