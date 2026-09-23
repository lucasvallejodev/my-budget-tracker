export const MONTHS_PER_YEAR = 12;
export const LAST_MONTH_INDEX = 11;
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;

export const MILLISECONDS_PER_DAY =
  HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;
export const MAX_DAYS_IN_MONTH = 31;
export const EndOfDay = {
  hours: HOURS_PER_DAY - 1,
  milliseconds: MILLISECONDS_PER_SECOND - 1,
  minutes: MINUTES_PER_HOUR - 1,
  seconds: SECONDS_PER_MINUTE - 1,
} as const;
export const ISO_DATE_LENGTH = 10;
export const ISO_MONTH_LENGTH = 7;
