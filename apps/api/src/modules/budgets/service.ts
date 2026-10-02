import { and, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm';

import { budgets, categories, categoryGroups } from '@/db/schema';
import { ISO_MONTH_LENGTH } from '@coinkeeper/shared/constants/time';
import { isoDateOfMonthStart, toIsoDate } from '@coinkeeper/shared/lib/date-helpers';
import { roundUpToWholeUnits } from '@coinkeeper/shared/lib/money';
import { calendarPeriod } from '@coinkeeper/shared/lib/periods';
import type { BudgetRow, BudgetSuggestion } from '@coinkeeper/shared/schema/budgets';

import { ownedActiveCategory } from '../categories/service';
import { Db, notFound, ServiceError, toIsoTimestamp } from '../db';
import { monthRange } from '../ledger/service';
import { unpaidSpendingBetween } from '../recurring/occurrences';
import { createReportService } from '../reports/service';

type BudgetInput = {
  amountMinor: number;
  categoryId: string;
  currency: string;
  month: string;
};

const SUGGESTION_MONTHS = 3;

type ListOptions = {
  deleted?: boolean;
  ids?: string[];
};

const byGroupThenCategory = (left: BudgetRow, right: BudgetRow): number =>
  left.groupName.localeCompare(right.groupName) ||
  left.categoryName.localeCompare(right.categoryName);

const spentKey = (currency: string, categoryId: string): string => `${currency}:${categoryId}`;

export const createBudgetService = (db: Db) => {
  const reports = createReportService(db);

  const spentByCategory = async (userId: string, month: string, currencies: string[]) => {
    const rows = await reports.categorySpending(userId, month, currencies);

    return new Map(rows.map(row => [spentKey(row.currency, row.categoryId), row]));
  };

  const billsDueByCategory = async (userId: string, month: string) => {
    const period = calendarPeriod(month);

    const due = await unpaidSpendingBetween(db, userId, {
      from: period.from,
      to: period.to,
      today: toIsoDate(new Date()),
    });

    const totals = new Map<string, number>();

    for (const occurrence of due) {
      if (!occurrence.categoryId) continue;

      const key = spentKey(occurrence.currency, occurrence.categoryId);

      totals.set(key, (totals.get(key) ?? 0) - occurrence.amountMinor);
    }

    return totals;
  };

  const list = async (
    userId: string,
    month: string,
    options: ListOptions = {}
  ): Promise<BudgetRow[]> => {
    const { start } = monthRange(month);

    const rows = await db
      .select({
        amountMinor: budgets.amountMinor,
        categoryId: budgets.categoryId,
        categoryName: categories.name,
        color: categoryGroups.color,
        currency: budgets.currency,
        deletedAt: budgets.deletedAt,
        groupId: categoryGroups.id,
        groupName: categoryGroups.name,
        icon: categories.icon,
        id: budgets.id,
        month: budgets.month,
      })
      .from(budgets)
      .innerJoin(categories, eq(categories.id, budgets.categoryId))
      .innerJoin(categoryGroups, eq(categoryGroups.id, categories.groupId))
      .where(
        and(
          eq(budgets.userId, userId),
          eq(budgets.month, start),
          options.deleted ? isNotNull(budgets.deletedAt) : isNull(budgets.deletedAt),
          options.ids ? inArray(budgets.id, options.ids) : undefined
        )
      );

    const spent = await spentByCategory(userId, month, [...new Set(rows.map(row => row.currency))]);
    const bills = await billsDueByCategory(userId, month);

    return rows
      .map(row => {
        const key = spentKey(row.currency, row.categoryId);

        return {
          ...row,
          amountMinor: Number(row.amountMinor),
          billsDueMinor: bills.get(key) ?? 0,
          deletedAt: toIsoTimestamp(row.deletedAt),
          fixedSpentMinor: spent.get(key)?.fixedMinor ?? 0,
          spentMinor: spent.get(key)?.spentMinor ?? 0,
        };
      })
      .sort(byGroupThenCategory);
  };

  const find = async (userId: string, id: string) => {
    const [row] = await db
      .select({ deletedAt: budgets.deletedAt, month: budgets.month })
      .from(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
      .limit(1);

    return row ?? notFound('Budget');
  };

  const get = async (userId: string, id: string): Promise<BudgetRow> => {
    const { deletedAt, month } = await find(userId, id);

    const [row] = await list(userId, month.slice(0, ISO_MONTH_LENGTH), {
      deleted: !!deletedAt,
      ids: [id],
    });

    return row ?? notFound('Budget');
  };

  const suggestions = async (userId: string, month: string): Promise<BudgetSuggestion[]> => {
    const { start } = monthRange(month);

    const rows = await reports.categorySpendingBetween(
      userId,
      isoDateOfMonthStart(month, -SUGGESTION_MONTHS),
      start
    );

    return rows
      .filter(row => row.spentMinor > 0)
      .map(row => ({
        amountMinor: roundUpToWholeUnits(Math.ceil(row.spentMinor / row.months), row.currency),
        categoryId: row.categoryId,
        currency: row.currency,
        months: row.months,
      }));
  };

  return {
    async copyFromPreviousMonth(userId: string, month: string): Promise<number> {
      const { start } = monthRange(month);
      const previous = isoDateOfMonthStart(month, -1);

      return db.transaction(async tx => {
        const rows = await tx
          .select({
            amountMinor: budgets.amountMinor,
            categoryId: budgets.categoryId,
            currency: budgets.currency,
          })
          .from(budgets)
          .innerJoin(categories, eq(categories.id, budgets.categoryId))
          .where(
            and(
              eq(budgets.userId, userId),
              eq(budgets.month, previous),
              isNull(budgets.deletedAt),
              isNull(categories.archivedAt)
            )
          );

        if (!rows.length) return 0;

        const inserted = await tx
          .insert(budgets)
          .values(
            rows.map(row => ({
              ...row,
              month: start,
              userId,
            }))
          )
          .onConflictDoUpdate({
            set: { amountMinor: sql`excluded.amount_minor`, deletedAt: null },
            setWhere: isNotNull(budgets.deletedAt),
            target: [budgets.categoryId, budgets.month, budgets.currency],
          })
          .returning({ id: budgets.id });

        return inserted.length;
      });
    },
    get,
    list,
    async remove(userId: string, id: string): Promise<void> {
      const deleted = await db
        .update(budgets)
        .set({ deletedAt: new Date() })
        .where(and(eq(budgets.id, id), eq(budgets.userId, userId), isNull(budgets.deletedAt)))
        .returning({ id: budgets.id });

      if (!deleted.length) notFound('Budget');
    },
    async restore(userId: string, id: string): Promise<BudgetRow> {
      const restored = await db
        .update(budgets)
        .set({ deletedAt: null })
        .where(and(eq(budgets.id, id), eq(budgets.userId, userId), isNotNull(budgets.deletedAt)))
        .returning({ id: budgets.id });

      if (!restored.length) notFound('Deleted budget');

      return get(userId, id);
    },
    suggestions,
    async upsert(
      userId: string,
      data: BudgetInput
    ): Promise<{ budget: BudgetRow; created: boolean }> {
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
          set: {
            amountMinor: data.amountMinor,
            deletedAt: null,
            updatedAt: new Date(),
          },
          target: [budgets.categoryId, budgets.month, budgets.currency],
        })
        .returning({ id: budgets.id, inserted: sql<boolean>`(xmax = 0)` });

      return { budget: await get(userId, row.id), created: row.inserted };
    },
  };
};
