import { describe, expect, it } from 'vitest';

import {
  amountRange,
  cadenceFromGap,
  monthlyEquivalent,
  nextOccurrence,
  occurrencesBetween,
} from './recurrence';

describe('occurrencesBetween', () => {
  it('keeps the anchor day and falls on the last day of shorter months', () => {
    expect(
      occurrencesBetween(
        {
          anchorDate: '2026-01-31',
          cadence: 'monthly',
          interval: 1,
        },
        '2026-02-01',
        '2026-04-30'
      )
    ).toEqual(['2026-02-28', '2026-03-31', '2026-04-30']);
  });

  it('steps weekly series by whole weeks from the anchor', () => {
    expect(
      occurrencesBetween(
        {
          anchorDate: '2026-09-04',
          cadence: 'weekly',
          interval: 2,
        },
        '2026-09-10',
        '2026-10-20'
      )
    ).toEqual(['2026-09-18', '2026-10-02', '2026-10-16']);
  });

  it('handles yearly series on 29 February and stops at the end date', () => {
    expect(
      occurrencesBetween(
        {
          anchorDate: '2028-02-29',
          cadence: 'yearly',
          endDate: '2030-12-31',
          interval: 1,
        },
        '2028-01-01',
        '2032-12-31'
      )
    ).toEqual(['2028-02-29', '2029-02-28', '2030-02-28']);
  });

  it('returns nothing before the anchor date', () => {
    expect(
      occurrencesBetween(
        {
          anchorDate: '2026-10-05',
          cadence: 'monthly',
          interval: 1,
        },
        '2026-09-01',
        '2026-09-30'
      )
    ).toEqual([]);
  });

  it('finds occurrences far from the anchor without skipping one', () => {
    expect(
      occurrencesBetween(
        {
          anchorDate: '2020-01-31',
          cadence: 'monthly',
          interval: 1,
        },
        '2026-09-01',
        '2026-09-30'
      )
    ).toEqual(['2026-09-30']);
  });
});

describe('nextOccurrence', () => {
  it('returns the next due date or null after the end', () => {
    expect(
      nextOccurrence(
        {
          anchorDate: '2026-01-15',
          cadence: 'monthly',
          interval: 1,
        },
        '2026-09-20'
      )
    ).toBe('2026-10-15');
    expect(
      nextOccurrence(
        {
          anchorDate: '2026-09-20',
          cadence: 'monthly',
          interval: 1,
        },
        '2026-09-20'
      )
    ).toBe('2026-09-20');
    expect(
      nextOccurrence(
        {
          anchorDate: '2026-01-15',
          cadence: 'monthly',
          endDate: '2026-06-30',
          interval: 1,
        },
        '2026-09-20'
      )
    ).toBeNull();
  });
});

describe('monthlyEquivalent', () => {
  it('spreads yearly and weekly amounts over a month', () => {
    expect(monthlyEquivalent(-11988, 'yearly', 1)).toBe(-999);
    expect(monthlyEquivalent(-1000, 'weekly', 2)).toBe(-2174);
    expect(monthlyEquivalent(-3000, 'monthly', 3)).toBe(-1000);
  });
});

describe('cadenceFromGap', () => {
  it('recognises the usual rhythms and nothing else', () => {
    expect(cadenceFromGap(30)).toEqual({ cadence: 'monthly', interval: 1 });
    expect(cadenceFromGap(14)).toEqual({ cadence: 'weekly', interval: 2 });
    expect(cadenceFromGap(91)).toEqual({ cadence: 'monthly', interval: 3 });
    expect(cadenceFromGap(365)).toEqual({ cadence: 'yearly', interval: 1 });
    expect(cadenceFromGap(45)).toBeNull();
  });
});

describe('amountRange', () => {
  it('widens the expected amount by the tolerance in its own sign', () => {
    expect(amountRange(-1000)).toEqual([-1075, -925]);
    expect(amountRange(200000)).toEqual([185000, 215000]);
    expect(amountRange(-1000, 0)).toEqual([-1000, -1000]);
  });
});
