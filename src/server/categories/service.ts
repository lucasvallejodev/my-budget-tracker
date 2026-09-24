import { and, asc, eq, isNull, sql } from 'drizzle-orm';

import { categories, categoryGroups, payees, transactions } from '@/db/schema';
import type { CategoryTree } from '@/schema/categories';

import { Db, notFound, ServiceError } from '../db';

export const ownedActiveCategory = async (db: Db, userId: string, id: string) => {
  const [category] = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId), isNull(categories.archivedAt)))
    .limit(1);

  return category ?? notFound('Category');
};

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
            .update(payees)
            .set({ defaultCategoryId: moveToId })
            .where(and(eq(payees.defaultCategoryId, id), eq(payees.userId, userId)));
        } else {
          await tx
            .update(transactions)
            .set({ categoryId: null, needsReview: true })
            .where(and(eq(transactions.categoryId, id), eq(transactions.userId, userId)));
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

      return category;
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

      return group;
    },
    async reorderCategories(userId: string, groupId: string, orderedIds: string[]) {
      await ownedGroup(userId, groupId);
      await db.transaction(async tx => {
        for (const [index, id] of orderedIds.entries()) {
          await tx
            .update(categories)
            .set({ groupId, sortOrder: index })
            .where(and(eq(categories.id, id), eq(categories.userId, userId)));
        }
      });
    },
    async reorderGroups(userId: string, orderedIds: string[]) {
      await db.transaction(async tx => {
        for (const [index, id] of orderedIds.entries()) {
          await tx
            .update(categoryGroups)
            .set({ sortOrder: index })
            .where(and(eq(categoryGroups.id, id), eq(categoryGroups.userId, userId)));
        }
      });
    },
    async restoreCategory(userId: string, id: string) {
      await ownedCategory(userId, id);
      await db.update(categories).set({ archivedAt: null }).where(eq(categories.id, id));
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
            WHERE t.category_id = "categories"."id" AND t.deleted_at IS NULL)`,
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

      return updated;
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

      return updated;
    },
  };
};
