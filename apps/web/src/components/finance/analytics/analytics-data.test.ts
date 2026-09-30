import { describe, expect, it } from 'vitest';

import type { CashPoint, GroupSlice } from '../use-finance-data';
import {
  cashFlowSpan,
  chartMonths,
  comparisonEnd,
  groupChanges,
  monthlyRows,
  periodLabel,
  periodMonths,
  totalsOf,
} from './analytics-data';

const filters = {
  compare: 'previous' as const,
  month: '2026-09',
  range: 3 as const,
};

const point = (month: string, incomeMinor: number, spendingMinor: number): CashPoint => ({
  currency: 'EUR',
  incomeMinor,
  month,
  spendingMinor,
});

const slice = (groupName: string, spentMinor: number): GroupSlice => ({
  color: '#DC2626',
  currency: 'EUR',
  groupId: groupName,
  groupName,
  spentMinor,
});

describe('analytics data', () => {
  it('lists the months of a period and where its comparison ends', () => {
    expect(periodMonths('2026-09', 3)).toEqual(['2026-07', '2026-08', '2026-09']);
    expect(comparisonEnd(filters)).toBe('2026-06');
    expect(comparisonEnd({ ...filters, compare: 'year' })).toBe('2025-09');
    expect(chartMonths(filters)).toBe(6);
    expect(
      cashFlowSpan({
        ...filters,
        compare: 'year',
        range: 12,
      })
    ).toBe(24);
  });

  it('labels a period', () => {
    expect(periodLabel('2026-09', 1)).toBe('September 2026');
    expect(periodLabel('2026-09', 3)).toBe('Jul – Sep 2026');
    expect(periodLabel('2026-02', 6)).toBe('Sep 2025 – Feb 2026');
  });

  it('adds up a period and fills missing months with zero', () => {
    const points = [point('2026-08', 3000, 1000), point('2026-09', 3000, 2000)];

    expect(totalsOf(points, ['2026-08', '2026-09'], 'EUR')).toEqual({
      incomeMinor: 6000,
      keptMinor: 3000,
      spendingMinor: 3000,
    });
    expect(monthlyRows(points, ['2026-07', '2026-08'], 'EUR')).toEqual([
      {
        incomeMinor: 0,
        keptMinor: 0,
        month: '2026-07',
        spendingMinor: 0,
      },
      {
        incomeMinor: 3000,
        keptMinor: 2000,
        month: '2026-08',
        spendingMinor: 1000,
      },
    ]);
  });

  it('ranks groups by the size of their change, new and vanished groups included', () => {
    const changes = groupChanges(
      [slice('Food', 500), slice('Travel', 900)],
      [slice('Food', 700), slice('Gifts', 100)],
      'EUR'
    );

    expect(changes.map(change => [change.name, change.changeMinor])).toEqual([
      ['Travel', 900],
      ['Food', -200],
      ['Gifts', -100],
    ]);
  });
});
