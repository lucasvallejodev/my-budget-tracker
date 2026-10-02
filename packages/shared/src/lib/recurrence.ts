import { MONTHS_PER_YEAR } from '../constants/time';
import type { RecurringCadence } from '../schema/enums';
import { toIsoDate } from './date-helpers';
import { addDays, daysBetween } from './periods';

export type RecurrenceRule = {
  anchorDate: string;
  cadence: RecurringCadence;
  endDate?: null | string;
  interval: number;
};

export type DetectedCadence = {
  cadence: RecurringCadence;
  interval: number;
};

const DAYS_PER_WEEK = 7;
const LONGEST_MONTH_DAYS = 31;
const LONGEST_YEAR_DAYS = 366;
const DAYS_PER_YEAR = 365.25;
const WEEKS_PER_MONTH = DAYS_PER_YEAR / DAYS_PER_WEEK / MONTHS_PER_YEAR;
const MAX_OCCURRENCES = 500;
const DEFAULT_AMOUNT_TOLERANCE = 0.075;

const LongestPeriodDays: Record<RecurringCadence, number> = {
  monthly: LONGEST_MONTH_DAYS,
  weekly: DAYS_PER_WEEK,
  yearly: LONGEST_YEAR_DAYS,
};

const GapCadences: { cadence: DetectedCadence; from: number; to: number }[] = [
  // keep order
  {
    cadence: { cadence: 'weekly', interval: 1 },
    from: 6,
    to: 8,
  },
  {
    cadence: { cadence: 'weekly', interval: 2 },
    from: 13,
    to: 16,
  },
  {
    cadence: { cadence: 'monthly', interval: 1 },
    from: 26,
    to: 35,
  },
  {
    cadence: { cadence: 'monthly', interval: 2 },
    from: 56,
    to: 66,
  },
  {
    cadence: { cadence: 'monthly', interval: 3 },
    from: 85,
    to: 97,
  },
  {
    cadence: { cadence: 'monthly', interval: 6 },
    from: 175,
    to: 190,
  },
  {
    cadence: { cadence: 'yearly', interval: 1 },
    from: 350,
    to: 380,
  },
];

const monthsAhead = (anchorDate: string, months: number): string => {
  const [year, month, day] = anchorDate.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0));

  target.setUTCDate(Math.min(day, lastDay.getUTCDate()));

  return toIsoDate(target);
};

const nthOccurrence = (rule: RecurrenceRule, index: number): string => {
  if (rule.cadence === 'weekly') {
    return addDays(rule.anchorDate, index * DAYS_PER_WEEK * rule.interval);
  }

  if (rule.cadence === 'monthly') return monthsAhead(rule.anchorDate, index * rule.interval);

  return monthsAhead(rule.anchorDate, index * MONTHS_PER_YEAR * rule.interval);
};

const firstIndexAtOrBefore = (rule: RecurrenceRule, from: string): number =>
  Math.max(
    0,
    Math.floor(
      daysBetween(rule.anchorDate, from) / (LongestPeriodDays[rule.cadence] * rule.interval)
    )
  );

const pastEnd = (rule: RecurrenceRule, date: string, to: string): boolean =>
  date > to || (!!rule.endDate && date > rule.endDate);

/**
 * Lists the dates on which a recurring series falls due within a range.
 *
 * @remarks
 * The anchor date is the first occurrence. Monthly and yearly series keep the anchor's day of
 * the month and fall on the last day of shorter months (the 31st becomes the 30th or the 28th),
 * without drifting afterwards. Nothing is returned after `endDate`. At most 500 dates come back.
 *
 * @param rule - Cadence, interval (every N weeks, months or years), anchor and optional end date.
 * @param from - First day of the range, inclusive, `YYYY-MM-DD`.
 * @param to - Last day of the range, inclusive, `YYYY-MM-DD`.
 * @returns The due dates in order.
 *
 * @example
 * ```ts
 * occurrencesBetween({ anchorDate: '2026-01-31', cadence: 'monthly', interval: 1 }, '2026-02-01', '2026-04-30');
 * // ['2026-02-28', '2026-03-31', '2026-04-30']
 * ```
 */
export const occurrencesBetween = (rule: RecurrenceRule, from: string, to: string): string[] => {
  const dates: string[] = [];
  let index = firstIndexAtOrBefore(rule, from);
  let date = nthOccurrence(rule, index);

  while (!pastEnd(rule, date, to) && dates.length < MAX_OCCURRENCES) {
    if (date >= from) dates.push(date);
    index += 1;
    date = nthOccurrence(rule, index);
  }

  return dates;
};

/**
 * Finds the first due date of a recurring series on or after a day.
 *
 * @param rule - The series rule, as for {@link occurrencesBetween}.
 * @param onOrAfter - The day to start looking from, `YYYY-MM-DD`.
 * @returns The next due date, or `null` when the series has ended.
 *
 * @example
 * ```ts
 * nextOccurrence({ anchorDate: '2026-01-15', cadence: 'monthly', interval: 1 }, '2026-09-20'); // '2026-10-15'
 * ```
 */
export const nextOccurrence = (rule: RecurrenceRule, onOrAfter: string): null | string => {
  const horizon = addDays(onOrAfter, LongestPeriodDays[rule.cadence] * rule.interval);

  return occurrencesBetween(rule, onOrAfter, horizon)[0] ?? null;
};

/**
 * Converts the amount of one occurrence into what it costs per month.
 *
 * @remarks
 * Weekly amounts use 365.25 / 7 / 12 weeks per month. The result is rounded to whole minor units
 * and keeps the sign of `amountMinor`.
 *
 * @param amountMinor - Amount of one occurrence in minor units.
 * @param cadence - How often it occurs.
 * @param interval - Every how many weeks, months or years.
 * @returns The monthly equivalent in minor units.
 *
 * @example
 * ```ts
 * monthlyEquivalent(-11988, 'yearly', 1); // -999
 * monthlyEquivalent(-1000, 'weekly', 2); // -2174
 * ```
 */
export const monthlyEquivalent = (
  amountMinor: number,
  cadence: RecurringCadence,
  interval: number
): number => {
  if (cadence === 'weekly') return Math.round((amountMinor * WEEKS_PER_MONTH) / interval);
  if (cadence === 'monthly') return Math.round(amountMinor / interval);

  return Math.round(amountMinor / (MONTHS_PER_YEAR * interval));
};

/**
 * Maps the typical gap between payments to a cadence.
 *
 * @remarks
 * Recognises weekly, every two weeks, monthly, every two, three or six months and yearly, with
 * some slack for weekends and month lengths. Any other gap returns `null`.
 *
 * @param medianGapDays - The median number of days between consecutive payments.
 * @returns The cadence and interval, or `null` when the gap is not a known rhythm.
 *
 * @example
 * ```ts
 * cadenceFromGap(30); // { cadence: 'monthly', interval: 1 }
 * cadenceFromGap(14); // { cadence: 'weekly', interval: 2 }
 * cadenceFromGap(45); // null
 * ```
 */
export const cadenceFromGap = (medianGapDays: number): DetectedCadence | null =>
  GapCadences.find(entry => medianGapDays >= entry.from && medianGapDays <= entry.to)?.cadence ??
  null;

/**
 * Returns the range of amounts that still counts as a payment of a series.
 *
 * @remarks
 * The range is the expected amount plus or minus the tolerance (7.5 % by default), widened to whole
 * minor units, in the same sign as the expected amount, with the smaller value first.
 *
 * @param amountMinor - Expected amount in minor units, signed.
 * @param tolerance - Allowed relative difference, `0.075` for 7.5 %.
 * @returns `[min, max]` in minor units.
 *
 * @example
 * ```ts
 * amountRange(-1000); // [-1075, -925]
 * amountRange(200000); // [185000, 215000]
 * ```
 */
export const amountRange = (
  amountMinor: number,
  tolerance = DEFAULT_AMOUNT_TOLERANCE
): [number, number] => {
  const low = Math.floor(Math.abs(amountMinor) * (1 - tolerance));
  const high = Math.ceil(Math.abs(amountMinor) * (1 + tolerance));

  return amountMinor < 0 ? [-high, -low] : [low, high];
};
