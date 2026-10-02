import { describe, expect, it } from 'vitest';

import { addDays, calendarPeriod, daysBetween, periodProgress } from './periods';

describe('periods', () => {
  it('counts days between dates in UTC', () => {
    expect(daysBetween('2026-09-01', '2026-09-30')).toBe(29);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(daysBetween('2026-09-02', '2026-09-01')).toBe(-1);
  });

  it('moves dates by whole days across months and years', () => {
    expect(addDays('2026-09-28', 5)).toBe('2026-10-03');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('builds calendar periods, including February in leap years', () => {
    expect(calendarPeriod('2026-02')).toEqual({
      days: 28,
      from: '2026-02-01',
      key: '2026-02',
      to: '2026-02-28',
    });
    expect(calendarPeriod('2028-02').days).toBe(29);
    expect(calendarPeriod('2026-12')).toMatchObject({ days: 31, to: '2026-12-31' });
    expect(() => calendarPeriod('2026-9')).toThrow(RangeError);
  });

  it('reports progress through current, past and future periods', () => {
    const september = calendarPeriod('2026-09');

    expect(periodProgress(september, '2026-09-18')).toEqual({ daysElapsed: 18, daysLeft: 13 });
    expect(periodProgress(september, '2026-09-01')).toEqual({ daysElapsed: 1, daysLeft: 30 });
    expect(periodProgress(september, '2026-09-30')).toEqual({ daysElapsed: 30, daysLeft: 1 });
    expect(periodProgress(calendarPeriod('2026-08'), '2026-09-18')).toEqual({
      daysElapsed: 31,
      daysLeft: 0,
    });
    expect(periodProgress(calendarPeriod('2026-10'), '2026-09-18')).toEqual({
      daysElapsed: 0,
      daysLeft: 31,
    });
  });
});
