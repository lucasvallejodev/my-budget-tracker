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
 * Moves a date by a number of days.
 *
 * @remarks
 * Works in UTC on `YYYY-MM-DD` strings, so daylight-saving changes never shift the result.
 *
 * @param isoDate - The starting date.
 * @param days - Days to add; negative values go back.
 * @returns The new date in `YYYY-MM-DD` form.
 *
 * @example
 * ```ts
 * addDays('2026-09-28', 5); // '2026-10-03'
 * addDays('2026-03-01', -1); // '2026-02-28'
 * ```
 */
export const addDays = (isoDate: string, days: number): string =>
  toIsoDate(new Date((dayNumber(isoDate) + days) * MILLISECONDS_PER_DAY));

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

export type PeriodRule =
  | { day: number; kind: 'fixed_day' }
  | { kind: 'before_month_end'; workingDays: number }
  | { kind: 'calendar' };

export type PeriodSettings = {
  rule: PeriodRule;
  weekendDays: number[];
};

export type PeriodOverrides = Record<string, string>;

const FIRST_DAY = '01';
const MONTH_KEY_LENGTH = 7;

const weekdayOf = (isoDate: string): number => new Date(`${isoDate}${UtcMidnight}`).getUTCDay();

const workingDayOnOrBefore = (isoDate: string, weekendDays: number[]): string => {
  let date = isoDate;

  while (weekendDays.includes(weekdayOf(date))) date = addDays(date, -1);

  return date;
};

const lastDayOf = (isoMonth: string): string => addDays(isoDateOfMonthStart(isoMonth, 1), -1);

const candidateStart = (isoMonth: string, settings: PeriodSettings): string => {
  const { rule, weekendDays } = settings;

  if (rule.kind === 'calendar') return `${isoMonth}-${FIRST_DAY}`;

  if (rule.kind === 'fixed_day') {
    const day = String(rule.day).padStart(FIRST_DAY.length, '0');

    return workingDayOnOrBefore(`${isoMonth}-${day}`, weekendDays);
  }

  let date = workingDayOnOrBefore(lastDayOf(isoMonth), weekendDays);

  for (let step = 0; step < rule.workingDays; step += 1) {
    date = workingDayOnOrBefore(addDays(date, -1), weekendDays);
  }

  return date;
};

const shiftKey = (isoMonth: string, months: number): string =>
  isoDateOfMonthStart(isoMonth, months).slice(0, MONTH_KEY_LENGTH);

/**
 * Finds the day on which the period named by a month starts under a period rule.
 *
 * @remarks
 * A period is named after the month it ends in, so with the rule "the 25th" the October period
 * runs from 25 September to 24 October. A start that falls on a weekend day moves back to the
 * working day before it. The calendar rule always starts on the 1st.
 *
 * @param key - The period key, a month in `YYYY-MM` form.
 * @param settings - The rule and the days treated as the weekend (0 is Sunday, 6 is Saturday).
 * @returns The first day of the period, `YYYY-MM-DD`.
 * @throws `RangeError` when `key` is not in `YYYY-MM` form.
 *
 * @example
 * ```ts
 * ruleStart('2026-10', { rule: { day: 25, kind: 'fixed_day' }, weekendDays: [0, 6] }); // '2026-09-25'
 * ruleStart('2026-10', { rule: { kind: 'before_month_end', workingDays: 0 }, weekendDays: [0, 6] }); // '2026-09-30'
 * ```
 */
export const ruleStart = (key: string, settings: PeriodSettings): string => {
  if (!isIsoMonth(key)) throw new RangeError(`Month must be YYYY-MM, got ${key}`);

  const thisMonth = candidateStart(key, settings);
  const nextMonth = candidateStart(shiftKey(key, 1), settings);

  return addDays(nextMonth, -1).startsWith(key)
    ? thisMonth
    : candidateStart(shiftKey(key, -1), settings);
};

const startOf = (key: string, settings: PeriodSettings, overrides: PeriodOverrides): string =>
  overrides[key] ?? ruleStart(key, settings);

/**
 * Returns the period named by a month under a period rule and the periods moved by hand.
 *
 * @remarks
 * A moved period starts on its override; the period before it ends the day before, so periods
 * never overlap or leave gaps. With the calendar rule and no overrides this equals
 * {@link calendarPeriod}.
 *
 * @param key - The period key, a month in `YYYY-MM` form.
 * @param settings - The rule and the weekend days, as for {@link ruleStart}.
 * @param overrides - Start dates moved by hand, by period key.
 * @returns The key, the first and the last day (inclusive) and the number of days.
 * @throws `RangeError` when `key` is not in `YYYY-MM` form.
 *
 * @example
 * ```ts
 * periodRange('2026-10', { rule: { day: 25, kind: 'fixed_day' }, weekendDays: [0, 6] });
 * // { days: 28, from: '2026-09-25', key: '2026-10', to: '2026-10-22' }
 * ```
 */
export const periodRange = (
  key: string,
  settings: PeriodSettings,
  overrides: PeriodOverrides = {}
): BudgetPeriod => {
  const from = startOf(key, settings, overrides);
  const next = startOf(shiftKey(key, 1), settings, overrides);

  return {
    days: daysBetween(from, next),
    from,
    key,
    to: addDays(next, -1),
  };
};

/**
 * Finds the period that contains a day.
 *
 * @param isoDate - The day, `YYYY-MM-DD`.
 * @param settings - The rule and the weekend days, as for {@link ruleStart}.
 * @param overrides - Start dates moved by hand, by period key.
 * @returns The period whose range includes the day.
 *
 * @example
 * ```ts
 * periodFor('2026-09-28', { rule: { day: 25, kind: 'fixed_day' }, weekendDays: [0, 6] }).key; // '2026-10'
 * ```
 */
export const periodFor = (
  isoDate: string,
  settings: PeriodSettings,
  overrides: PeriodOverrides = {}
): BudgetPeriod => {
  const month = isoDate.slice(0, MONTH_KEY_LENGTH);
  const candidates = [month, shiftKey(month, 1), shiftKey(month, -1)];

  return (
    candidates
      .map(key => periodRange(key, settings, overrides))
      .find(period => period.from <= isoDate && isoDate <= period.to) ??
    periodRange(month, settings, overrides)
  );
};
