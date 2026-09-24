import { and, asc, eq, isNull, sql } from 'drizzle-orm';

import { categories, rules, transactions } from '@/db/schema';
import type { RuleRow } from '@coinkeeper/shared/schema/rules';

import { ownedActiveCategory } from '../categories/service';
import { Db, notFound, ServiceError } from '../db';

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

        const rule = list.find(rule => haystack.includes(rule.pattern.toLowerCase()));

        if (!rule) continue;
        await db
          .update(transactions)
          .set({ categoryId: rule.categoryId, needsReview: false })
          .where(eq(transactions.id, row.id));
        updated++;
      }

      return updated;
    },
    async create(
      userId: string,
      data: {
        categoryId: string;
        name?: string;
        pattern: string;
      }
    ) {
      const pattern = data.pattern.trim();

      if (!pattern) throw new ServiceError('Pattern is required');

      const category = await ownedActiveCategory(db, userId, data.categoryId);

      const [{ next }] = await db
        .select({ next: sql<number>`COALESCE(max(${rules.priority}), -1) + 1` })
        .from(rules)
        .where(eq(rules.userId, userId));

      const [rule] = await db
        .insert(rules)
        .values({
          categoryId: category.id,
          name: data.name?.trim() || `${pattern} → ${category.name}`,
          pattern,
          priority: Number(next),
          userId,
        })
        .returning();

      return rule;
    },
    async list(userId: string): Promise<RuleRow[]> {
      return db
        .select({
          categoryId: rules.categoryId,
          categoryName: categories.name,
          id: rules.id,
          name: rules.name,
          pattern: rules.pattern,
          priority: rules.priority,
        })
        .from(rules)
        .leftJoin(categories, eq(categories.id, rules.categoryId))
        .where(eq(rules.userId, userId))
        .orderBy(asc(rules.priority), asc(rules.createdAt));
    },
    async match(userId: string, texts: (string | null | undefined)[]) {
      const haystack = texts
        .filter((text): text is string => !!text)
        .join('\n')
        .toLowerCase();

      if (!haystack) return null;

      for (const rule of await this.list(userId)) {
        if (haystack.includes(rule.pattern.toLowerCase())) return rule;
      }

      return null;
    },
    async remove(userId: string, id: string) {
      await owned(userId, id);
      await db.delete(rules).where(eq(rules.id, id));
    },
  };
};
