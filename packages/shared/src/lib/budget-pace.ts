import { type BudgetPeriod, periodProgress } from './periods';

export const MIN_DAYS_FOR_PROJECTION = 5;

export type BudgetPace = {
  aheadMinor: number;
  daysLeft: number;
  expectedMinor: number;
  isCurrent: boolean;
  perDayLeftMinor: number;
  projectedMinor: number;
  tooFast: boolean;
};

export type BudgetPaceInput = {
  limitMinor: number;
  period: BudgetPeriod;
  spentMinor: number;
  today: string;
};

/**
 * Compares what a budget has spent with an even pace through its period, and projects the end.
 *
 * @remarks
 * All amounts are integer minor units of the budget's currency.
 * - `expectedMinor` is the limit spread evenly over the days elapsed (today included), rounded
 *   down; `aheadMinor` is `spent − expected`, positive when spending runs ahead of plan.
 * - `projectedMinor` extends today's daily rate to the end of the period; it equals the amount
 *   spent once the period has ended or before it starts.
 * - `perDayLeftMinor` spreads what is left of the limit over the days left (today included),
 *   rounded down so it never promises money that is not there; 0 once the limit is used.
 * - `tooFast` is set only in the current period, after {@link MIN_DAYS_FOR_PROJECTION} days, while
 *   the limit is not yet exceeded but the projection passes it.
 *
 * @param input - `limitMinor`, `spentMinor`, the budget `period` and the user's `today`.
 * @returns The pace figures described above.
 *
 * @example
 * ```ts
 * budgetPace({ limitMinor: 40000, period: calendarPeriod('2026-09'), spentMinor: 30000, today: '2026-09-18' });
 * // { aheadMinor: 6000, daysLeft: 13, expectedMinor: 24000, isCurrent: true, perDayLeftMinor: 769, projectedMinor: 50000, tooFast: true }
 * ```
 */
export const budgetPace = ({
  limitMinor,
  period,
  spentMinor,
  today,
}: BudgetPaceInput): BudgetPace => {
  const { daysElapsed, daysLeft } = periodProgress(period, today);
  const isCurrent = today >= period.from && today <= period.to;
  const expectedMinor = Math.floor((limitMinor * daysElapsed) / period.days);

  const projectedMinor =
    isCurrent && daysElapsed > 0
      ? Math.round((spentMinor * period.days) / daysElapsed)
      : spentMinor;

  return {
    aheadMinor: spentMinor - expectedMinor,
    daysLeft,
    expectedMinor,
    isCurrent,
    perDayLeftMinor: daysLeft > 0 ? Math.floor(Math.max(0, limitMinor - spentMinor) / daysLeft) : 0,
    projectedMinor,
    tooFast:
      isCurrent &&
      daysElapsed >= MIN_DAYS_FOR_PROJECTION &&
      spentMinor < limitMinor &&
      projectedMinor > limitMinor,
  };
};
