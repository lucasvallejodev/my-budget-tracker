export function dateToUTCDate(date: Date) {
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds(),
    )
  );
}

const MIN_MONTH = 0;
const MAX_MONTH = 11;

function getValidMonth(month?: number): number {
  if (month === null || month === undefined || isNaN(month)) {
    return new Date().getMonth();
  }
  
  if (month < MIN_MONTH || month > MAX_MONTH) {
    return new Date().getMonth();
  }
  
  return month;
}

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

function getValidYear(year?: number): number {
  if (year === null || year === undefined || isNaN(year)) {
    return new Date().getFullYear();
  }
  
  if (year < MIN_YEAR || year > MAX_YEAR) {
    return new Date().getFullYear();
  }
  
  return year;
}

export function getStartAndEndOfMonth(month?: number, year?: number) {
  const monthIndex = getValidMonth(month);
  const yearIndex = getValidYear(year);
  
  const endMonthIndex = monthIndex + 1 > 11 ? 0 : monthIndex + 1;
  const endYearIndex = endMonthIndex === 0 ? yearIndex + 1 : yearIndex;

  const startDate = new Date(yearIndex, monthIndex, 1);
  const endDate = new Date(endYearIndex, endMonthIndex, 0);

  endDate.setHours(23);
  endDate.setMinutes(59);
  endDate.setSeconds(59);
  endDate.setMilliseconds(999);

  return {
    startDate,
    endDate
  }
}