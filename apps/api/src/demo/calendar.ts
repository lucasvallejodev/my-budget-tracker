import { ISO_MONTH_LENGTH, MILLISECONDS_PER_DAY } from '@coinkeeper/shared/constants/time';
import { isoDateOfMonthStart, toIsoDate } from '@coinkeeper/shared/lib/date-helpers';

const SUNDAY_INDEX = 0;
const SATURDAY_INDEX = 6;
const UtcMidnight = 'T00:00:00Z';
const DAY_OF_MONTH_OFFSET = ISO_MONTH_LENGTH + 1;

const toUtcDate = (isoDate: string): Date => new Date(`${isoDate}${UtcMidnight}`);

export const addDays = (isoDate: string, days: number): string =>
  toIsoDate(new Date(toUtcDate(isoDate).getTime() + days * MILLISECONDS_PER_DAY));

export const lastDayOfMonth = (isoMonth: string): string =>
  addDays(isoDateOfMonthStart(isoMonth, 1), -1);

export const dayOfMonth = (isoMonth: string, day: number): string => {
  const lastDay = lastDayOfMonth(isoMonth);

  return day >= Number(lastDay.slice(DAY_OF_MONTH_OFFSET))
    ? lastDay
    : addDays(`${isoMonth}-01`, day - 1);
};

export const previousWorkingDay = (isoDate: string): string => {
  let candidate = isoDate;

  while ([SATURDAY_INDEX, SUNDAY_INDEX].includes(toUtcDate(candidate).getUTCDay())) {
    candidate = addDays(candidate, -1);
  }

  return candidate;
};

export const monthsEndingAt = (currentMonth: string, count: number): string[] =>
  Array.from({ length: count }, (_month, index) =>
    isoDateOfMonthStart(currentMonth, index - count + 1).slice(0, currentMonth.length)
  );
