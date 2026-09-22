import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { categories, categoryGroups, payees, transactions } from '@/db/schema';
import { Db, ServiceError, notFound } from '../db';

export type CategoryTree = {
  id: string;
  name: string;
  kind: 'income' | 'expense';
  color: string;
  sortOrder: number;
  isSystem: boolean;
  archivedAt: string | null;
  categories: {
    id: string;
    name: string;
    icon: string;
    sortOrder: number;
    archivedAt: string | null;
    transactionCount: number;
  }[];
};

export function createCategoryService(db: Db) {
  async function ownedGroup(userId: string, id: string) {
    const [group] = await db
      .select()
      .from(categoryGroups)
      .where(and(eq(categoryGroups.id, id), eq(categoryGroups.userId, userId)))
      .limit(1);
    return group ?? notFound('Category group');
  }
  async function ownedCategory(userId: string, id: string) {
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .limit(1);
    return category ?? notFound('Category');
  }
  return {
    /** Full tree including archived rows (the UI decides what to show). */
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
          id: categories.id,
          groupId: categories.groupId,
          name: categories.name,
          icon: categories.icon,
          sortOrder: categories.sortOrder,
          archivedAt: categories.archivedAt,
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
        id: group.id,
        name: group.name,
        kind: group.kind,
        color: group.color,
        sortOrder: group.sortOrder,
        isSystem: group.isSystem,
        archivedAt: group.archivedAt?.toISOString() ?? null,
        categories: rows
          .filter(row => row.groupId === group.id)
          .map(row => ({
            id: row.id,
            name: row.name,
            icon: row.icon,
            sortOrder: row.sortOrder,
            archivedAt: row.archivedAt?.toISOString() ?? null,
            transactionCount: Number(row.transactionCount),
          })),
      }));
    },
    async createGroup(
      userId: string,
      data: { name: string; kind: 'income' | 'expense'; color: string }
    ) {
      const [{ next }] = await db
        .select({ next: sql<number>`COALESCE(max(${categoryGroups.sortOrder}), -1) + 1` })
        .from(categoryGroups)
        .where(eq(categoryGroups.userId, userId));
      const [group] = await db
        .insert(categoryGroups)
        .values({ userId, ...data, sortOrder: Number(next) })
        .returning();
      return group;
    },
    async updateGroup(
      userId: string,
      id: string,
      data: { name?: string; color?: string; kind?: 'income' | 'expense' }
    ) {
      const group = await ownedGroup(userId, id);
      if (group.isSystem && data.kind && data.kind !== group.kind)
        throw new ServiceError('The income group must stay an income group');
      const [updated] = await db
        .update(categoryGroups)
        .set(data)
        .where(eq(categoryGroups.id, id))
        .returning();
      return updated;
    },
    async archiveGroup(userId: string, id: string) {
      const group = await ownedGroup(userId, id);
      if (group.isSystem) throw new ServiceError('System groups cannot be archived');
      const [{ live }] = await db
        .select({ live: sql<number>`count(*)::int` })
        .from(categories)
        .where(and(eq(categories.groupId, id), isNull(categories.archivedAt)));
      if (Number(live) > 0)
        throw new ServiceError('Move or archive the categories in this group first');
      await db
        .update(categoryGroups)
        .set({ archivedAt: new Date() })
        .where(eq(categoryGroups.id, id));
    },
    async reorderGroups(userId: string, orderedIds: string[]) {
      await db.transaction(async tx => {
        for (const [index, id] of orderedIds.entries())
          await tx
            .update(categoryGroups)
            .set({ sortOrder: index })
            .where(and(eq(categoryGroups.id, id), eq(categoryGroups.userId, userId)));
      });
    },
    async createCategory(userId: string, data: { groupId: string; name: string; icon: string }) {
      await ownedGroup(userId, data.groupId);
      const [{ next }] = await db
        .select({ next: sql<number>`COALESCE(max(${categories.sortOrder}), -1) + 1` })
        .from(categories)
        .where(eq(categories.groupId, data.groupId));
      const [category] = await db
        .insert(categories)
        .values({ userId, ...data, sortOrder: Number(next) })
        .returning();
      return category;
    },
    async updateCategory(
      userId: string,
      id: string,
      data: { name?: string; icon?: string; groupId?: string }
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
    async reorderCategories(userId: string, groupId: string, orderedIds: string[]) {
      await ownedGroup(userId, groupId);
      await db.transaction(async tx => {
        for (const [index, id] of orderedIds.entries())
          await tx
            .update(categories)
            .set({ sortOrder: index, groupId })
            .where(and(eq(categories.id, id), eq(categories.userId, userId)));
      });
    },
    /**
     * Archives a category. With `moveToId` its transactions (and payee defaults) are re-pointed;
     * without it, they are kept but flagged for review so they resurface in the inbox.
     */
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
    async restoreCategory(userId: string, id: string) {
      await ownedCategory(userId, id);
      await db.update(categories).set({ archivedAt: null }).where(eq(categories.id, id));
    },
  };
}
