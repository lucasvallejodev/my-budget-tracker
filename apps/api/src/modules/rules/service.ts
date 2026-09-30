import { and, asc, eq, isNotNull, isNull, sql, type SQL } from 'drizzle-orm';

import { categories, rules, transactions } from '@/db/schema';
import { chunk } from '@coinkeeper/shared/lib/arrays';
import type { CategoryKind } from '@coinkeeper/shared/schema/enums';
import type { RuleRow } from '@coinkeeper/shared/schema/rules';
import type { ReviewSuggestion } from '@coinkeeper/shared/schema/transaction';

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

type ReviewCandidate = {
  amount_minor: string;
  default_category_id: null | string;
  id: string;
  memo: string;
  original_payee: null | string;
  payee_name: null | string;
};

type RuleMatcher = (texts: (string | null | undefined)[]) => RuleRow | null;

const reviewCandidates = (db: DbOrTx, userId: string) =>
  rowsOf<ReviewCandidate>(
    db,
    sql`
    SELECT t.id, t.amount_minor, t.memo, t.original_payee, p.name AS payee_name, p.default_category_id
    FROM transactions t
    LEFT JOIN payees p ON p.id = t.payee_id AND p.user_id = t.user_id AND p.archived_at IS NULL
    WHERE t.user_id = ${userId} AND t.needs_review AND t.deleted_at IS NULL
      AND t.kind = 'standard' AND t.category_id IS NULL
    ORDER BY t.date DESC, t.id`
  );

const activeCategoryKinds = async (
  db: DbOrTx,
  userId: string
): Promise<Map<string, CategoryKind>> => {
  const rows = await rowsOf<{ id: string; kind: CategoryKind }>(
    db,
    sql`
    SELECT c.id, g.kind
    FROM categories c
    JOIN category_groups g ON g.id = c.group_id
    WHERE c.user_id = ${userId} AND c.archived_at IS NULL AND g.archived_at IS NULL`
  );

  return new Map(rows.map(row => [row.id, row.kind]));
};

const kindOfAmount = (amountMinor: number): CategoryKind =>
  amountMinor < 0 ? 'expense' : 'income';

const suggestionFor = (
  candidate: ReviewCandidate,
  matchRule: RuleMatcher,
  kinds: Map<string, CategoryKind>
): null | ReviewSuggestion => {
  const kind = kindOfAmount(Number(candidate.amount_minor));

  const fits = (categoryId: null | string | undefined): categoryId is string =>
    !!categoryId && kinds.get(categoryId) === kind;

  const ruleCategoryId = matchRule([
    candidate.payee_name,
    candidate.original_payee,
    candidate.memo,
  ])?.categoryId;

  if (fits(ruleCategoryId)) {
    return {
      categoryId: ruleCategoryId,
      source: 'rule',
      transactionId: candidate.id,
    };
  }

  if (fits(candidate.default_category_id)) {
    return {
      categoryId: candidate.default_category_id,
      source: 'payee',
      transactionId: candidate.id,
    };
  }

  return null;
};

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

  const matcher = async (userId: string): Promise<RuleMatcher> => {
    const active = await list(userId);

    return texts => {
      const haystack = haystackOf(texts);

      return haystack ? firstMatch(active, haystack) : null;
    };
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
    matcher,
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
    async reviewSuggestions(userId: string): Promise<ReviewSuggestion[]> {
      const candidates = await reviewCandidates(db, userId);

      if (!candidates.length) return [];

      const kinds = await activeCategoryKinds(db, userId);
      const matchRule = await matcher(userId);

      return candidates.flatMap(candidate => suggestionFor(candidate, matchRule, kinds) ?? []);
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
