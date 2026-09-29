import { MILLISECONDS_PER_DAY } from '../constants/time';
import { isoDateOfMonthStart, toIsoDate } from './date-helpers';
import { isIsoMonth } from './patterns';

export type BudgetPeriod = {
  days: number;
  from: string;
  key: string;
  to: string;
};

export type PeriodProgress = {
  daysElapsed: number;
  daysLeft: number;
};

const UtcMidnight = 'T00:00:00Z';

const dayNumber = (isoDate: string): number =>
  Math.round(new Date(`${isoDate}${UtcMidnight}`).getTime() / MILLISECONDS_PER_DAY);

/**
 * Counts the days from one date to another, both in `YYYY-MM-DD` form.
 *
 * @remarks
 * Works in UTC, so daylight-saving changes never add or lose a day. The start day is not counted:
 * the result is negative when `to` comes before `from`.
 *
 * @param from - The first date.
 * @param to - The second date.
 * @returns Whole days from `from` to `to`.
 *
 * @example
 * ```ts
 * daysBetween('2026-09-01', '2026-09-30'); // 29
 * daysBetween('2026-12-31', '2027-01-01'); // 1
 * ```
 */
export const daysBetween = (from: string, to: string): number => dayNumber(to) - dayNumber(from);

/**
 * Returns the budget period of a calendar month.
 *
 * @remarks
 * Every budget and report range goes through a period, so that periods which follow payday can
 * replace the calendar rule later without rewriting the callers
 * (`docs/research/feature-opportunities.md` › Pay-cycle periods).
 *
 * @param isoMonth - Month in `YYYY-MM` form, which is also the period key.
 * @returns The key, the first and the last day (inclusive) and the number of days.
 * @throws `RangeError` when `isoMonth` is not in `YYYY-MM` form.
 *
 * @example
 * ```ts
 * calendarPeriod('2026-02'); // { days: 28, from: '2026-02-01', key: '2026-02', to: '2026-02-28' }
 * ```
 */
export const calendarPeriod = (isoMonth: string): BudgetPeriod => {
  if (!isIsoMonth(isoMonth)) throw new RangeError(`Month must be YYYY-MM, got ${isoMonth}`);

  const from = isoDateOfMonthStart(isoMonth);
  const next = isoDateOfMonthStart(isoMonth, 1);
  const days = daysBetween(from, next);

  return {
    days,
    from,
    key: isoMonth,
    to: toIsoDate(new Date((dayNumber(next) - 1) * MILLISECONDS_PER_DAY)),
  };
};

/**
 * Says how far into a period a given day is.
 *
 * @remarks
 * Today counts as elapsed and as left, because spending can still happen today. A period that
 * has ended reports every day elapsed and none left; one that has not started reports none
 * elapsed and every day left.
 *
 * @param period - The period, for example from {@link calendarPeriod}.
 * @param today - The user's current day in `YYYY-MM-DD` form.
 * @returns Days elapsed (including today) and days left (including today).
 *
 * @example
 * ```ts
 * periodProgress(calendarPeriod('2026-09'), '2026-09-18'); // { daysElapsed: 18, daysLeft: 13 }
 * periodProgress(calendarPeriod('2026-08'), '2026-09-18'); // { daysElapsed: 31, daysLeft: 0 }
 * ```
 */
export const periodProgress = (period: BudgetPeriod, today: string): PeriodProgress => {
  if (today > period.to) return { daysElapsed: period.days, daysLeft: 0 };
  if (today < period.from) return { daysElapsed: 0, daysLeft: period.days };

  const daysElapsed = daysBetween(period.from, today) + 1;

  return { daysElapsed, daysLeft: period.days - daysElapsed + 1 };
};
