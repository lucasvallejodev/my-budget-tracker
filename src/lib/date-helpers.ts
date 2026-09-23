import { EndOfDay, ISO_DATE_LENGTH, ISO_MONTH_LENGTH, LAST_MONTH_INDEX } from '@/constants/time';

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

export const toIsoDate = (date: Date): string => date.toISOString().slice(0, ISO_DATE_LENGTH);

export const toIsoMonth = (date: Date): string => date.toISOString().slice(0, ISO_MONTH_LENGTH);

export const isoDateOfMonthStart = (isoMonth: string, monthOffset = 0): string => {
  const [year, monthNumber] = isoMonth.split('-').map(Number);

  return toIsoDate(new Date(Date.UTC(year, monthNumber - 1 + monthOffset, 1)));
};
