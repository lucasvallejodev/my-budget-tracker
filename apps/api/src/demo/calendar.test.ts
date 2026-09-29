import { describe, expect, it } from 'vitest';

import {
  addDays,
  dayOfMonth,
  lastDayOfMonth,
  monthsEndingAt,
  previousWorkingDay,
} from './calendar';

describe('demo calendar', () => {
  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('finds the last day of a month, including leap years', () => {
    expect(lastDayOfMonth('2028-02')).toBe('2028-02-29');
    expect(lastDayOfMonth('2026-09')).toBe('2026-09-30');
  });

  it('clamps a day to the length of the month', () => {
    expect(dayOfMonth('2026-02', 31)).toBe('2026-02-28');
    expect(dayOfMonth('2026-02', 9)).toBe('2026-02-09');
  });

  it('moves weekend dates back to the Friday before', () => {
    expect(previousWorkingDay('2026-08-30')).toBe('2026-08-28');
    expect(previousWorkingDay('2026-08-27')).toBe('2026-08-27');
  });

  it('lists months up to the current one, oldest first', () => {
    expect(monthsEndingAt('2027-02', 4)).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
  });
});
