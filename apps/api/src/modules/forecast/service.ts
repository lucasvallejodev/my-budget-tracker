import { toIsoDate } from '@coinkeeper/shared/lib/date-helpers';
import { addDays, periodProgress } from '@coinkeeper/shared/lib/periods';
import {
  type AccountProjection,
  DEFAULT_PROJECTION_DAYS,
} from '@coinkeeper/shared/schema/accounts';
import type { BudgetRow } from '@coinkeeper/shared/schema/budgets';
import type { Occurrence } from '@coinkeeper/shared/schema/recurring';
import type { LeftToSpend } from '@coinkeeper/shared/schema/reports';

import { createAccountService } from '../accounts/service';
import { createBudgetService } from '../budgets/service';
import type { Db } from '../db';
import { periodOf, spanOf, userPeriods } from '../periods/service';
import { occurrencesInRange, unpaidSpendingBetween } from '../recurring/occurrences';
import { OVERDUE_LOOKBACK_DAYS } from '../recurring/rules';
import { createReportService } from '../reports/service';

type LeftToSpendOptions = {
  currency: string;
  month: string;
  today?: string;
};

type ProjectionOptions = {
  days?: number;
  today?: string;
};

const todayOf = (today?: string): string => today ?? toIsoDate(new Date());

const sum = (amounts: number[]): number => amounts.reduce((total, amount) => total + amount, 0);

const budgetedMinor = (budgets: BudgetRow[]): number =>
  sum(budgets.map(budget => Math.max(budget.amountMinor, budget.spentMinor)));

const projectionOf = (
  account: { balanceMinor: number; currency: string; id: string },
  occurrences: Occurrence[],
  { today, until }: { today: string; until: string }
): AccountProjection => {
  const scheduled = occurrences
    .filter(
      occurrence => occurrence.accountId === account.id && occurrence.currency === account.currency
    )
    .toSorted((left, right) => left.dueOn.localeCompare(right.dueOn));

  let running = account.balanceMinor;
  let lowestMinor = account.balanceMinor;
  let lowestOn: null | string = null;

  for (const occurrence of scheduled) {
    running += occurrence.amountMinor;

    if (running < lowestMinor) {
      lowestMinor = running;
      lowestOn = occurrence.dueOn > today ? occurrence.dueOn : today;
    }
  }

  return {
    accountId: account.id,
    balanceMinor: account.balanceMinor,
    currency: account.currency,
    lowestMinor,
    lowestOn,
    projectedMinor: running,
    scheduledCount: scheduled.length,
    until,
  };
};

export const createForecastService = (db: Db) => {
  const accounts = createAccountService(db);
  const budgets = createBudgetService(db);
  const reports = createReportService(db);

  return {
    async leftToSpend(userId: string, options: LeftToSpendOptions): Promise<LeftToSpend> {
      const { currency, month } = options;
      const today = todayOf(options.today);
      const period = periodOf(await userPeriods(db, userId), month);
      const span = spanOf(period);
      const totals = await reports.monthlyTotals(userId, month, span);

      const monthBudgets = (await budgets.list(userId, month)).filter(
        budget => budget.currency === currency
      );

      const budgeted = new Set(monthBudgets.map(budget => budget.categoryId));
      const spending = await reports.breakdownByCategory(userId, month, currency, { span });

      const due = await unpaidSpendingBetween(db, userId, {
        from: period.from,
        to: period.to,
        today,
      });

      const billsDueMinor = -sum(
        due
          .filter(
            item =>
              item.currency === currency && !(item.categoryId && budgeted.has(item.categoryId))
          )
          .map(item => item.amountMinor)
      );

      const unbudgetedSpentMinor = sum(
        spending
          .filter(slice => !(slice.categoryId && budgeted.has(slice.categoryId)))
          .map(slice => slice.spentMinor)
      );

      const incomeMinor = totals.find(total => total.currency === currency)?.incomeMinor ?? 0;
      const budgetedTotal = budgetedMinor(monthBudgets);
      const leftMinor = incomeMinor - billsDueMinor - budgetedTotal - unbudgetedSpentMinor;
      const { daysLeft } = periodProgress(period, today);

      return {
        billsDueMinor,
        budgetedMinor: budgetedTotal,
        currency,
        daysLeft,
        incomeMinor,
        leftMinor,
        month,
        perDayMinor: daysLeft > 0 ? Math.floor(Math.max(0, leftMinor) / daysLeft) : 0,
        unbudgetedSpentMinor,
      };
    },

    async projections(
      userId: string,
      options: ProjectionOptions = {}
    ): Promise<AccountProjection[]> {
      const today = todayOf(options.today);
      const until = addDays(today, options.days ?? DEFAULT_PROJECTION_DAYS);

      const occurrences = (
        await occurrencesInRange(db, userId, {
          from: addDays(today, -OVERDUE_LOOKBACK_DAYS),
          to: until,
          today,
        })
      ).filter(occurrence => occurrence.status !== 'paid');

      return (await accounts.list(userId)).map(account =>
        projectionOf(account, occurrences, { today, until })
      );
    },
  };
};
