import { and, eq } from 'drizzle-orm';

import { budgets, categories, categoryGroups } from '@/db/schema';
import { isoDateOfMonthStart } from '@/lib/date-helpers';

import { ownedActiveCategory } from '../categories/service';
import { Db, notFound, ServiceError } from '../db';
import { monthRange } from '../ledger/service';
import { createReportService } from '../reports/service';

export type BudgetRow = {
  amountMinor: number;
  categoryId: string;
  categoryName: string;
  color: string;
  currency: string;
  groupId: string;
  groupName: string;
  icon: string;
  id: string;
  month: string;
  spentMinor: number;
};

export const createBudgetService = (db: Db) => {
  const reports = createReportService(db);

  return {
    async copyFromPreviousMonth(userId: string, month: string) {
      const { start } = monthRange(month);
      const previous = isoDateOfMonthStart(month, -1);

      const rows = await db
        .select()
        .from(budgets)
        .where(and(eq(budgets.userId, userId), eq(budgets.month, previous)));

      let copied = 0;

      for (const row of rows) {
        const inserted = await db
          .insert(budgets)
          .values({
            amountMinor: row.amountMinor,
            categoryId: row.categoryId,
            currency: row.currency,
            month: start,
            userId,
          })
          .onConflictDoNothing()
          .returning({ id: budgets.id });

        copied += inserted.length;
      }

      return copied;
    },
    async list(userId: string, month: string): Promise<BudgetRow[]> {
      const { start } = monthRange(month);

      const rows = await db
        .select({
          amountMinor: budgets.amountMinor,
          categoryId: budgets.categoryId,
          categoryName: categories.name,
          color: categoryGroups.color,
          currency: budgets.currency,
          groupId: categoryGroups.id,
          groupName: categoryGroups.name,
          icon: categories.icon,
          id: budgets.id,
          month: budgets.month,
        })
        .from(budgets)
        .innerJoin(categories, eq(categories.id, budgets.categoryId))
        .innerJoin(categoryGroups, eq(categoryGroups.id, categories.groupId))
        .where(and(eq(budgets.userId, userId), eq(budgets.month, start)));

      const currencies = [...new Set(rows.map(row => row.currency))];
      const spent = new Map<string, number>();

      for (const currency of currencies) {
        for (const slice of await reports.breakdownByCategory(userId, month, currency)) {
          if (slice.categoryId) spent.set(`${currency}:${slice.categoryId}`, slice.spentMinor);
        }
      }

      return rows
        .map(row => ({
          ...row,
          amountMinor: Number(row.amountMinor),
          spentMinor: spent.get(`${row.currency}:${row.categoryId}`) ?? 0,
        }))
        .sort(
          (left, right) =>
            left.groupName.localeCompare(right.groupName) ||
            left.categoryName.localeCompare(right.categoryName)
        );
    },
    async remove(userId: string, id: string) {
      const deleted = await db
        .delete(budgets)
        .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
        .returning({ id: budgets.id });

      if (!deleted.length) notFound('Budget');
    },
    async upsert(
      userId: string,
      data: {
        amountMinor: number;
        categoryId: string;
        currency: string;
        month: string;
      }
    ) {
      if (!Number.isInteger(data.amountMinor) || data.amountMinor <= 0) {
        throw new ServiceError('The limit must be a positive amount');
      }

      const { start } = monthRange(data.month);

      await ownedActiveCategory(db, userId, data.categoryId);

      const [row] = await db
        .insert(budgets)
        .values({
          amountMinor: data.amountMinor,
          categoryId: data.categoryId,
          currency: data.currency.toUpperCase(),
          month: start,
          userId,
        })
        .onConflictDoUpdate({
          set: { amountMinor: data.amountMinor },
          target: [budgets.categoryId, budgets.month, budgets.currency],
        })
        .returning();

      return { ...row, amountMinor: Number(row.amountMinor) };
    },
  };
};
