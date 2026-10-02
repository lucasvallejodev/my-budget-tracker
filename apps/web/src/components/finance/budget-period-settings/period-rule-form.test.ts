import { describe, expect, it } from 'vitest';

import {
  DayOptions,
  parseWeekend,
  ruleFor,
  weekendValue,
  WorkingDayOptions,
} from './period-rule-form';

describe('period rule form', () => {
  it('keeps the detail of a rule when switching back to it, with sensible defaults', () => {
    expect(ruleFor('fixed_day', { kind: 'calendar' })).toEqual({ day: 25, kind: 'fixed_day' });
    expect(ruleFor('fixed_day', { day: 3, kind: 'fixed_day' })).toEqual({
      day: 3,
      kind: 'fixed_day',
    });
    expect(ruleFor('before_month_end', { kind: 'calendar' })).toEqual({
      kind: 'before_month_end',
      workingDays: 0,
    });
    expect(ruleFor('calendar', { day: 3, kind: 'fixed_day' })).toEqual({ kind: 'calendar' });
  });

  it('round-trips weekend days and names the day choices', () => {
    expect(parseWeekend(weekendValue([0, 6]))).toEqual([0, 6]);
    expect(parseWeekend('')).toEqual([]);
    expect(DayOptions.at(-1)).toEqual({ label: 'Day 28', value: '28' });
    expect(WorkingDayOptions.slice(0, 3).map(option => option.label)).toEqual([
      'The last working day',
      '1 working day before the last',
      '2 working days before the last',
    ]);
  });
});
