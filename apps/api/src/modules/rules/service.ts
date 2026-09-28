import { and, asc, eq, isNotNull, isNull, sql, type SQL } from 'drizzle-orm';

import { categories, rules, transactions } from '@/db/schema';
import { chunk } from '@coinkeeper/shared/lib/arrays';
import type { RuleRow } from '@coinkeeper/shared/schema/rules';

import {
  assertAllFound,
  assertDistinctIds,
  positionedIds,
  rowsOf,
  WRITE_CHUNK_ROWS,
} from '../batch';
import { ownedActiveCategory } from '../categories/service';
import { Db, DbOrTx, notFound, ServiceError, toIsoTimestamp } from '../db';

type RuleInput = {
  categoryId: string;
  name?: string;
  pattern: string;
};

const haystackOf = (texts: (string | null | undefined)[]): string =>
  texts
    .filter((text): text is string => !!text)
    .join('\n')
    .toLowerCase();

const firstMatch = (list: RuleRow[], haystack: string): RuleRow | null =>
  list.find(rule => haystack.includes(rule.pattern.toLowerCase())) ?? null;

const prioritize = (tx: DbOrTx, userId: string, orderedIds: string[]) =>
  rowsOf<{ id: string }>(
    tx,
    sql`
    UPDATE rules AS rule
    SET priority = ordered.position, updated_at = now()
    FROM (VALUES ${positionedIds(orderedIds)}) AS ordered(id, position)
    WHERE rule.id = ordered.id AND rule.user_id = ${userId} AND rule.deleted_at IS NULL
    RETURNING rule.id`
  );

const categorize = async (tx: DbOrTx, userId: string, matches: SQL[]): Promise<void> => {
  for (const slice of chunk(matches, WRITE_CHUNK_ROWS)) {
    await tx.execute(sql`
      UPDATE transactions AS target
      SET category_id = matched.category_id, needs_review = false, updated_at = now()
      FROM (VALUES ${sql.join(slice, sql`, `)}) AS matched(id, category_id)
      WHERE target.id = matched.id AND target.user_id = ${userId}`);
  }
};

export const createRuleService = (db: Db) => {
  const owned = async (userId: string, id: string, { deleted = false } = {}) => {
    const [rule] = await db
      .select()
      .from(rules)
      .where(
        and(
          eq(rules.id, id),
          eq(rules.userId, userId),
          deleted ? isNotNull(rules.deletedAt) : isNull(rules.deletedAt)
        )
      )
      .limit(1);

    return rule ?? notFound(deleted ? 'Deleted rule' : 'Rule');
  };

  const list = async (userId: string, { deleted = false } = {}): Promise<RuleRow[]> => {
    const rows = await db
      .select({
        categoryId: rules.categoryId,
        categoryName: categories.name,
        deletedAt: rules.deletedAt,
        id: rules.id,
        name: rules.name,
        pattern: rules.pattern,
        priority: rules.priority,
      })
      .from(rules)
      .leftJoin(categories, eq(categories.id, rules.categoryId))
      .where(
        and(
          eq(rules.userId, userId),
          deleted ? isNotNull(rules.deletedAt) : isNull(rules.deletedAt)
        )
      )
      .orderBy(asc(rules.priority), asc(rules.createdAt));

    return rows.map(row => ({ ...row, deletedAt: toIsoTimestamp(row.deletedAt) }));
  };

  const get = async (userId: string, id: string): Promise<RuleRow> => {
    const [row] = (await list(userId)).filter(rule => rule.id === id);

    return row ?? notFound('Rule');
  };

  return {
    async applyToUncategorized(userId: string): Promise<number> {
      const active = await list(userId);

      if (!active.length) return 0;

      return db.transaction(async tx => {
        const rows = await tx
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

        const matches = rows.flatMap(row => {
          const rule = firstMatch(active, haystackOf([row.payeeName, row.originalPayee, row.memo]));

          return rule ? [sql`(${row.id}, ${rule.categoryId})`] : [];
        });

        await categorize(tx, userId, matches);

        return matches.length;
      });
    },
    async create(userId: string, data: RuleInput): Promise<RuleRow> {
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
        .returning({ id: rules.id });

      return get(userId, rule.id);
    },
    list,
    async match(userId: string, texts: (string | null | undefined)[]) {
      const haystack = haystackOf(texts);

      return haystack ? firstMatch(await list(userId), haystack) : null;
    },
    matcher: async (userId: string) => {
      const active = await list(userId);

      return (texts: (string | null | undefined)[]) => {
        const haystack = haystackOf(texts);

        return haystack ? firstMatch(active, haystack) : null;
      };
    },
    async remove(userId: string, id: string): Promise<void> {
      await owned(userId, id);
      await db.update(rules).set({ deletedAt: new Date() }).where(eq(rules.id, id));
    },
    async reorder(userId: string, orderedIds: string[]): Promise<void> {
      assertDistinctIds(orderedIds);
      await db.transaction(async tx => {
        assertAllFound((await prioritize(tx, userId, orderedIds)).length, orderedIds, 'Rule');
      });
    },
    async restore(userId: string, id: string): Promise<RuleRow> {
      await owned(userId, id, { deleted: true });
      await db.update(rules).set({ deletedAt: null }).where(eq(rules.id, id));

      return get(userId, id);
    },
    async update(userId: string, id: string, data: Partial<RuleInput>): Promise<RuleRow> {
      await owned(userId, id);

      const patch: Partial<typeof rules.$inferInsert> = {};

      if (data.pattern !== undefined) {
        patch.pattern = data.pattern.trim();
        if (!patch.pattern) throw new ServiceError('Pattern is required');
      }

      if (data.name !== undefined) patch.name = data.name.trim() || undefined;

      if (data.categoryId) {
        patch.categoryId = (await ownedActiveCategory(db, userId, data.categoryId)).id;
      }

      await db.update(rules).set(patch).where(eq(rules.id, id));

      return get(userId, id);
    },
  };
};
