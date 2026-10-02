import { describe, expect, it } from 'vitest';

import {
  addDays,
  calendarPeriod,
  daysBetween,
  periodFor,
  periodProgress,
  periodRange,
  ruleStart,
} from './periods';

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

describe('pay-cycle periods', () => {
  const weekend = [0, 6];
  const fixed25 = { rule: { day: 25, kind: 'fixed_day' as const }, weekendDays: weekend };

  const lastWorkingDay = {
    rule: { kind: 'before_month_end' as const, workingDays: 0 },
    weekendDays: weekend,
  };

  it('names a period after the month it ends in', () => {
    expect(ruleStart('2026-10', fixed25)).toBe('2026-09-25');
    expect(periodRange('2026-10', fixed25)).toEqual({
      days: 28,
      from: '2026-09-25',
      key: '2026-10',
      to: '2026-10-22',
    });
  });

  it('moves a start on the weekend to the working day before', () => {
    expect(ruleStart('2026-11', fixed25)).toBe('2026-10-23');
    expect(ruleStart('2026-10', lastWorkingDay)).toBe('2026-09-30');
    expect(ruleStart('2026-11', lastWorkingDay)).toBe('2026-10-30');
    expect(
      ruleStart('2026-11', {
        rule: { kind: 'before_month_end', workingDays: 2 },
        weekendDays: weekend,
      })
    ).toBe('2026-10-28');
    expect(ruleStart('2026-11', { ...lastWorkingDay, weekendDays: [5, 6] })).toBe('2026-10-29');
  });

  it('matches calendar months under the calendar rule and with day 1', () => {
    const calendar = { rule: { kind: 'calendar' as const }, weekendDays: weekend };

    expect(periodRange('2026-02', calendar)).toEqual(calendarPeriod('2026-02'));
    expect(
      periodRange('2026-09', { rule: { day: 1, kind: 'fixed_day' }, weekendDays: [] })
    ).toEqual(calendarPeriod('2026-09'));
  });

  it('applies a period moved by hand and shortens the one before', () => {
    const overrides = { '2026-10': '2026-10-03' };

    expect(periodRange('2026-10', lastWorkingDay, overrides)).toMatchObject({
      from: '2026-10-03',
      to: '2026-10-29',
    });
    expect(periodRange('2026-09', lastWorkingDay, overrides)).toMatchObject({
      from: '2026-08-31',
      to: '2026-10-02',
    });
  });

  it('finds the period that contains a day', () => {
    expect(periodFor('2026-09-28', fixed25).key).toBe('2026-10');
    expect(periodFor('2026-09-20', fixed25).key).toBe('2026-09');
    expect(periodFor('2026-09-20', { rule: { kind: 'calendar' }, weekendDays: weekend }).key).toBe(
      '2026-09'
    );
  });
});
