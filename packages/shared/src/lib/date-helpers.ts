import { EndOfDay, ISO_DATE_LENGTH, ISO_MONTH_LENGTH, LAST_MONTH_INDEX } from '../constants/time';

const MIN_MONTH = 0;
const MAX_MONTH = LAST_MONTH_INDEX;

const getValidMonth = (month?: number): number => {
  if (month === undefined || Number.isNaN(month)) {
    return new Date().getMonth();
  }

  if (month < MIN_MONTH || month > MAX_MONTH) {
    return new Date().getMonth();
  }

  return month;
};

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

const getValidYear = (year?: number): number => {
  if (year === undefined || Number.isNaN(year)) {
    return new Date().getFullYear();
  }

  if (year < MIN_YEAR || year > MAX_YEAR) {
    return new Date().getFullYear();
  }

  return year;
};

/**
 * Returns the first and last instant of a calendar month in the runtime's local time zone.
 *
 * @remarks
 * `month` is a zero-based JavaScript month index (0 = January, 11 = December). A missing,
 * `NaN` or out-of-range month falls back to the current month, and a year outside 1900 to 2100
 * falls back to the current year, so the function never throws.
 *
 * @param month - Zero-based month index; defaults to the current month.
 * @param year - Four-digit year; defaults to the current year.
 * @returns `startDate` at 00:00:00.000 on the 1st and `endDate` at 23:59:59.999 on the last day.
 *
 * @example
 * ```ts
 * getStartAndEndOfMonth(1, 2024);
 * // { startDate: 2024-02-01 00:00:00.000, endDate: 2024-02-29 23:59:59.999 } (local time)
 * ```
 */
export const getStartAndEndOfMonth = (
  month?: number,
  year?: number
): { endDate: Date; startDate: Date } => {
  const monthIndex = getValidMonth(month);
  const yearIndex = getValidYear(year);

  const endMonthIndex = monthIndex + 1 > LAST_MONTH_INDEX ? 0 : monthIndex + 1;
  const endYearIndex = endMonthIndex === 0 ? yearIndex + 1 : yearIndex;

  const startDate = new Date(yearIndex, monthIndex, 1);
  const endDate = new Date(endYearIndex, endMonthIndex, 0);

  endDate.setHours(EndOfDay.hours);
  endDate.setMinutes(EndOfDay.minutes);
  endDate.setSeconds(EndOfDay.seconds);
  endDate.setMilliseconds(EndOfDay.milliseconds);

  return {
    endDate,
    startDate,
  };
};

/**
 * Formats a date as `YYYY-MM-DD` using its UTC calendar day.
 *
 * @remarks
 * The day is taken in UTC, not local time: local midnight in a time zone ahead of UTC is still
 * the previous day in UTC. Build the input with `Date.UTC` when a calendar day is meant.
 *
 * @param date - The instant to format.
 * @returns The ISO 8601 date, e.g. `'2026-09-23'`.
 *
 * @example
 * ```ts
 * toIsoDate(new Date(Date.UTC(2026, 8, 23))); // '2026-09-23'
 * ```
 */
export const toIsoDate = (date: Date): string => date.toISOString().slice(0, ISO_DATE_LENGTH);

/**
 * Formats a date as `YYYY-MM` using its UTC calendar month, the key used by budgets and reports.
 *
 * @remarks
 * Uses UTC like {@link toIsoDate}, so the same time-zone caveat applies on the first and last
 * day of a month.
 *
 * @param date - The instant to format.
 * @returns The ISO 8601 month, e.g. `'2026-09'`.
 *
 * @example
 * ```ts
 * toIsoMonth(new Date(Date.UTC(2026, 8, 23))); // '2026-09'
 * ```
 */
export const toIsoMonth = (date: Date): string => date.toISOString().slice(0, ISO_MONTH_LENGTH);

/**
 * Returns the ISO date of the first day of a month, optionally shifted by whole months.
 *
 * @remarks
 * Works entirely in UTC, so the result does not depend on the runtime's time zone. Offsets roll
 * over year boundaries in both directions.
 *
 * @param isoMonth - Month in `YYYY-MM` form; see `isIsoMonth` in `patterns.ts` to validate it.
 * @param monthOffset - Months to add (negative to go back); defaults to 0.
 * @returns The first day of the resulting month as `YYYY-MM-DD`.
 * @throws `RangeError` when `isoMonth` is not in `YYYY-MM` form.
 *
 * @example
 * ```ts
 * isoDateOfMonthStart('2026-09'); // '2026-09-01'
 * isoDateOfMonthStart('2026-12', 1); // '2027-01-01'
 * isoDateOfMonthStart('2026-01', -1); // '2025-12-01'
 * ```
 */
export const isoDateOfMonthStart = (isoMonth: string, monthOffset = 0): string => {
  const [year, monthNumber] = isoMonth.split('-').map(Number);

  return toIsoDate(new Date(Date.UTC(year, monthNumber - 1 + monthOffset, 1)));
};
