import { and, eq, isNull } from 'drizzle-orm';
import { budgets, categories, categoryGroups } from '@/db/schema';
import { Db, ServiceError, notFound } from '../db';
import { createReportService } from '../reports/service';
import { monthRange } from '../ledger/service';

export type BudgetRow = {
  id: string;
  categoryId: string;
  categoryName: string;
  icon: string;
  groupId: string;
  groupName: string;
  color: string;
  month: string;
  currency: string;
  amountMinor: number;
  spentMinor: number;
};

/** Monthly spending limits per category and currency, compared against the ledger. */
export function createBudgetService(db: Db) {
  const reports = createReportService(db);
  return {
    async list(userId: string, month: string): Promise<BudgetRow[]> {
      const { start } = monthRange(month);
      const rows = await db
        .select({
          id: budgets.id,
          categoryId: budgets.categoryId,
          categoryName: categories.name,
          icon: categories.icon,
          groupId: categoryGroups.id,
          groupName: categoryGroups.name,
          color: categoryGroups.color,
          month: budgets.month,
          currency: budgets.currency,
          amountMinor: budgets.amountMinor,
        })
        .from(budgets)
        .innerJoin(categories, eq(categories.id, budgets.categoryId))
        .innerJoin(categoryGroups, eq(categoryGroups.id, categories.groupId))
        .where(and(eq(budgets.userId, userId), eq(budgets.month, start)));
      const currencies = [...new Set(rows.map(row => row.currency))];
      const spent = new Map<string, number>();
      for (const currency of currencies)
        for (const slice of await reports.breakdownByCategory(userId, month, currency))
          if (slice.categoryId) spent.set(`${currency}:${slice.categoryId}`, slice.spentMinor);
      return rows
        .map(row => ({
          ...row,
          amountMinor: Number(row.amountMinor),
          spentMinor: spent.get(`${row.currency}:${row.categoryId}`) ?? 0,
        }))
        .sort(
          (a, b) =>
            a.groupName.localeCompare(b.groupName) || a.categoryName.localeCompare(b.categoryName)
        );
    },
    async upsert(
      userId: string,
      data: { categoryId: string; month: string; currency: string; amountMinor: number }
    ) {
      if (!Number.isInteger(data.amountMinor) || data.amountMinor <= 0)
        throw new ServiceError('The limit must be a positive amount');
      const { start } = monthRange(data.month);
      const [category] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(
          and(
            eq(categories.id, data.categoryId),
            eq(categories.userId, userId),
            isNull(categories.archivedAt)
          )
        );
      if (!category) notFound('Category');
      const [row] = await db
        .insert(budgets)
        .values({
          userId,
          categoryId: data.categoryId,
          month: start,
          currency: data.currency.toUpperCase(),
          amountMinor: data.amountMinor,
        })
        .onConflictDoUpdate({
          target: [budgets.categoryId, budgets.month, budgets.currency],
          set: { amountMinor: data.amountMinor },
        })
        .returning();
      return { ...row, amountMinor: Number(row.amountMinor) };
    },
    async remove(userId: string, id: string) {
      const deleted = await db
        .delete(budgets)
        .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
        .returning({ id: budgets.id });
      if (!deleted.length) notFound('Budget');
    },
    /** Copies last month's limits into `month` for categories that have none yet. */
    async copyFromPreviousMonth(userId: string, month: string) {
      const { start } = monthRange(month);
      const [year, monthIndex] = month.split('-').map(Number);
      const previous = new Date(Date.UTC(year, monthIndex - 2, 1)).toISOString().slice(0, 10);
      const rows = await db
        .select()
        .from(budgets)
        .where(and(eq(budgets.userId, userId), eq(budgets.month, previous)));
      let copied = 0;
      for (const row of rows) {
        const inserted = await db
          .insert(budgets)
          .values({
            userId,
            categoryId: row.categoryId,
            month: start,
            currency: row.currency,
            amountMinor: row.amountMinor,
          })
          .onConflictDoNothing()
          .returning({ id: budgets.id });
        copied += inserted.length;
      }
      return copied;
    },
  };
}
