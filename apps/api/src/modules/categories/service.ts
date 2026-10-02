import { and, asc, eq, isNull, sql } from 'drizzle-orm';

import { categories, categoryGroups, payees, transactions, transactionSplits } from '@/db/schema';
import type { Category, CategoryGroup, CategoryTree } from '@coinkeeper/shared/schema/categories';

import { assertAllFound, assertDistinctIds, positionedIds, rowsOf } from '../batch';
import { conflict, Db, DbOrTx, notFound, ServiceError, toIsoTimestamp } from '../db';

const toGroup = (row: typeof categoryGroups.$inferSelect): CategoryGroup => ({
  archivedAt: toIsoTimestamp(row.archivedAt),
  color: row.color,
  id: row.id,
  isSystem: row.isSystem,
  kind: row.kind,
  name: row.name,
  sortOrder: row.sortOrder,
});

const toCategory = (row: typeof categories.$inferSelect): Category => ({
  archivedAt: toIsoTimestamp(row.archivedAt),
  groupId: row.groupId,
  icon: row.icon,
  id: row.id,
  name: row.name,
  sortOrder: row.sortOrder,
});

export const ownedActiveCategory = async (db: Db, userId: string, id: string) => {
  const [category] = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId), isNull(categories.archivedAt)))
    .limit(1);

  return category ?? notFound('Category');
};

const flagSplitLinesForReview = async (
  tx: DbOrTx,
  userId: string,
  categoryId: string
): Promise<void> => {
  await tx.execute(sql`
    UPDATE transactions AS parent
    SET needs_review = true, updated_at = now()
    WHERE parent.user_id = ${userId} AND parent.id IN (
      SELECT line.transaction_id FROM transaction_splits line
      WHERE line.category_id = ${categoryId} AND line.user_id = ${userId} AND line.deleted_at IS NULL)`);
  await tx
    .update(transactionSplits)
    .set({ categoryId: null })
    .where(and(eq(transactionSplits.categoryId, categoryId), eq(transactionSplits.userId, userId)));
};

const moveCategories = (tx: DbOrTx, userId: string, groupId: string, orderedIds: string[]) =>
  rowsOf<{ id: string }>(
    tx,
    sql`
    UPDATE categories AS category
    SET group_id = ${groupId}, sort_order = ordered.position, updated_at = now()
    FROM (VALUES ${positionedIds(orderedIds)}) AS ordered(id, position)
    WHERE category.id = ordered.id AND category.user_id = ${userId}
    RETURNING category.id`
  );

const sortGroups = (tx: DbOrTx, userId: string, orderedIds: string[]) =>
  rowsOf<{ id: string }>(
    tx,
    sql`
    UPDATE category_groups AS category_group
    SET sort_order = ordered.position, updated_at = now()
    FROM (VALUES ${positionedIds(orderedIds)}) AS ordered(id, position)
    WHERE category_group.id = ordered.id AND category_group.user_id = ${userId}
    RETURNING category_group.id`
  );

export const createCategoryService = (db: Db) => {
  const ownedGroup = async (userId: string, id: string) => {
    const [group] = await db
      .select()
      .from(categoryGroups)
      .where(and(eq(categoryGroups.id, id), eq(categoryGroups.userId, userId)))
      .limit(1);

    return group ?? notFound('Category group');
  };

  const ownedCategory = async (userId: string, id: string) => {
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .limit(1);

    return category ?? notFound('Category');
  };

  return {
    async archiveCategory(userId: string, id: string, moveToId?: string) {
      await ownedCategory(userId, id);

      if (moveToId) {
        if (moveToId === id) throw new ServiceError('Choose a different destination category');
        await ownedCategory(userId, moveToId);
      }

      await db.transaction(async tx => {
        if (moveToId) {
          await tx
            .update(transactions)
            .set({ categoryId: moveToId })
            .where(and(eq(transactions.categoryId, id), eq(transactions.userId, userId)));
          await tx
            .update(transactionSplits)
            .set({ categoryId: moveToId })
            .where(and(eq(transactionSplits.categoryId, id), eq(transactionSplits.userId, userId)));
          await tx
            .update(payees)
            .set({ defaultCategoryId: moveToId })
            .where(and(eq(payees.defaultCategoryId, id), eq(payees.userId, userId)));
        } else {
          await tx
            .update(transactions)
            .set({ categoryId: null, needsReview: true })
            .where(and(eq(transactions.categoryId, id), eq(transactions.userId, userId)));
          await flagSplitLinesForReview(tx, userId, id);
          await tx
            .update(payees)
            .set({ defaultCategoryId: null })
            .where(and(eq(payees.defaultCategoryId, id), eq(payees.userId, userId)));
        }

        await tx.update(categories).set({ archivedAt: new Date() }).where(eq(categories.id, id));
      });
    },
    async archiveGroup(userId: string, id: string) {
      const group = await ownedGroup(userId, id);

      if (group.isSystem) throw new ServiceError('System groups cannot be archived');

      const [{ live }] = await db
        .select({ live: sql<number>`count(*)::int` })
        .from(categories)
        .where(and(eq(categories.groupId, id), isNull(categories.archivedAt)));

      if (Number(live) > 0) {
        throw new ServiceError('Move or archive the categories in this group first');
      }

      await db
        .update(categoryGroups)
        .set({ archivedAt: new Date() })
        .where(eq(categoryGroups.id, id));
    },
    async createCategory(
      userId: string,
      data: {
        groupId: string;
        icon: string;
        name: string;
      }
    ) {
      await ownedGroup(userId, data.groupId);

      const [{ next }] = await db
        .select({ next: sql<number>`COALESCE(max(${categories.sortOrder}), -1) + 1` })
        .from(categories)
        .where(eq(categories.groupId, data.groupId));

      const [category] = await db
        .insert(categories)
        .values({
          userId,
          ...data,
          sortOrder: Number(next),
        })
        .returning();

      return toCategory(category);
    },
    async createGroup(
      userId: string,
      data: {
        color: string;
        kind: 'income' | 'expense';
        name: string;
      }
    ) {
      const [{ next }] = await db
        .select({ next: sql<number>`COALESCE(max(${categoryGroups.sortOrder}), -1) + 1` })
        .from(categoryGroups)
        .where(eq(categoryGroups.userId, userId));

      const [group] = await db
        .insert(categoryGroups)
        .values({
          userId,
          ...data,
          sortOrder: Number(next),
        })
        .returning();

      return toGroup(group);
    },
    async reorderCategories(userId: string, groupId: string, orderedIds: string[]) {
      assertDistinctIds(orderedIds);
      await ownedGroup(userId, groupId);
      await db.transaction(async tx => {
        assertAllFound(
          (await moveCategories(tx, userId, groupId, orderedIds)).length,
          orderedIds,
          'Category'
        );
      });
    },
    async reorderGroups(userId: string, orderedIds: string[]) {
      assertDistinctIds(orderedIds);
      await db.transaction(async tx => {
        assertAllFound(
          (await sortGroups(tx, userId, orderedIds)).length,
          orderedIds,
          'Category group'
        );
      });
    },
    async tree(userId: string, { includeArchived = false } = {}): Promise<CategoryTree[]> {
      const groups = await db
        .select()
        .from(categoryGroups)
        .where(
          and(
            eq(categoryGroups.userId, userId),
            includeArchived ? undefined : isNull(categoryGroups.archivedAt)
          )
        )
        .orderBy(asc(categoryGroups.sortOrder), asc(categoryGroups.createdAt));

      const rows = await db
        .select({
          archivedAt: categories.archivedAt,
          groupId: categories.groupId,
          icon: categories.icon,
          id: categories.id,
          name: categories.name,
          sortOrder: categories.sortOrder,
          transactionCount: sql<number>`(
            SELECT count(*)::int FROM ${transactions} t
            WHERE t.category_id = "categories"."id" AND t.deleted_at IS NULL) + (
            SELECT count(DISTINCT s.transaction_id)::int FROM ${transactionSplits} s
            JOIN ${transactions} t ON t.id = s.transaction_id
            WHERE s.category_id = "categories"."id" AND s.deleted_at IS NULL AND t.deleted_at IS NULL)`,
        })
        .from(categories)
        .where(
          and(
            eq(categories.userId, userId),
            includeArchived ? undefined : isNull(categories.archivedAt)
          )
        )
        .orderBy(asc(categories.sortOrder), asc(categories.createdAt));

      return groups.map(group => ({
        archivedAt: group.archivedAt?.toISOString() ?? null,
        categories: rows
          .filter(row => row.groupId === group.id)
          .map(row => ({
            archivedAt: row.archivedAt?.toISOString() ?? null,
            icon: row.icon,
            id: row.id,
            name: row.name,
            sortOrder: row.sortOrder,
            transactionCount: Number(row.transactionCount),
          })),
        color: group.color,
        id: group.id,
        isSystem: group.isSystem,
        kind: group.kind,
        name: group.name,
        sortOrder: group.sortOrder,
      }));
    },
    async unarchiveCategory(userId: string, id: string): Promise<Category> {
      const category = await ownedCategory(userId, id);
      const group = await ownedGroup(userId, category.groupId);

      if (group.archivedAt) conflict('Unarchive the group of this category first');

      const [updated] = await db
        .update(categories)
        .set({ archivedAt: null })
        .where(eq(categories.id, id))
        .returning();

      return toCategory(updated);
    },
    async unarchiveGroup(userId: string, id: string): Promise<CategoryGroup> {
      await ownedGroup(userId, id);

      const [updated] = await db
        .update(categoryGroups)
        .set({ archivedAt: null })
        .where(eq(categoryGroups.id, id))
        .returning();

      return toGroup(updated);
    },
    async updateCategory(
      userId: string,
      id: string,
      data: {
        groupId?: string;
        icon?: string;
        name?: string;
      }
    ) {
      await ownedCategory(userId, id);
      if (data.groupId) await ownedGroup(userId, data.groupId);

      const [updated] = await db
        .update(categories)
        .set(data)
        .where(eq(categories.id, id))
        .returning();

      return toCategory(updated);
    },
    async updateGroup(
      userId: string,
      id: string,
      data: {
        color?: string;
        kind?: 'income' | 'expense';
        name?: string;
      }
    ) {
      const group = await ownedGroup(userId, id);

      if (group.isSystem && data.kind && data.kind !== group.kind) {
        throw new ServiceError('The income group must stay an income group');
      }

      const [updated] = await db
        .update(categoryGroups)
        .set(data)
        .where(eq(categoryGroups.id, id))
        .returning();

      return toGroup(updated);
    },
  };
};
