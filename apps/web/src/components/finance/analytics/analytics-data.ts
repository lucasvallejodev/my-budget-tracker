import type { AnalyticsFilters } from '@/lib/analytics-filters';

import { shortMonthLabel } from '../net-worth';
import { type CashPoint, type GroupSlice, monthLabel, shiftMonth } from '../use-finance-data';

const YearMonths = 12;
const ChartMonths = 6;
const YearLength = 4;

export type PeriodTotals = {
  incomeMinor: number;
  keptMinor: number;
  spendingMinor: number;
};

export type GroupChange = {
  afterMinor: number;
  beforeMinor: number;
  changeMinor: number;
  color: string;
  name: string;
};

export const periodMonths = (end: string, count: number): string[] =>
  Array.from({ length: count }, (_unused, index) => shiftMonth(end, index - count + 1));

export const comparisonEnd = ({ compare, month, range }: AnalyticsFilters): string =>
  shiftMonth(month, compare === 'year' ? -YearMonths : -range);

export const chartMonths = ({ range }: AnalyticsFilters): number => Math.max(range, ChartMonths);

export const cashFlowSpan = (filters: AnalyticsFilters): number => {
  const back = filters.compare === 'year' ? YearMonths : filters.range;

  return Math.max(chartMonths(filters), filters.range + back);
};

export const shortMonth = shortMonthLabel;

export const periodLabel = (end: string, range: number): string => {
  if (range === 1) return monthLabel(end);

  const start = shiftMonth(end, 1 - range);
  const startYear = start.slice(0, YearLength);
  const endYear = end.slice(0, YearLength);

  return startYear === endYear
    ? `${shortMonth(start)} – ${shortMonth(end)} ${endYear}`
    : `${shortMonth(start)} ${startYear} – ${shortMonth(end)} ${endYear}`;
};

export const totalsOf = (points: CashPoint[], months: string[], currency: string): PeriodTotals => {
  const inPeriod = points.filter(
    point => point.currency === currency && months.includes(point.month)
  );

  const incomeMinor = inPeriod.reduce((sum, point) => sum + point.incomeMinor, 0);
  const spendingMinor = inPeriod.reduce((sum, point) => sum + point.spendingMinor, 0);

  return {
    incomeMinor,
    keptMinor: incomeMinor - spendingMinor,
    spendingMinor,
  };
};

export const monthlyRows = (points: CashPoint[], months: string[], currency: string) =>
  months.map(month => {
    const point = points.find(
      candidate => candidate.month === month && candidate.currency === currency
    );

    const incomeMinor = point?.incomeMinor ?? 0;
    const spendingMinor = point?.spendingMinor ?? 0;

    return {
      incomeMinor,
      keptMinor: incomeMinor - spendingMinor,
      month,
      spendingMinor,
    };
  });

export const groupChanges = (
  current: GroupSlice[],
  previous: GroupSlice[],
  currency: string
): GroupChange[] => {
  const names = new Set(
    [...current, ...previous]
      .filter(slice => slice.currency === currency)
      .map(slice => slice.groupName)
  );

  return [...names]
    .map(name => {
      const after = current.find(slice => slice.currency === currency && slice.groupName === name);

      const before = previous.find(
        slice => slice.currency === currency && slice.groupName === name
      );

      const afterMinor = after?.spentMinor ?? 0;
      const beforeMinor = before?.spentMinor ?? 0;

      return {
        afterMinor,
        beforeMinor,
        changeMinor: afterMinor - beforeMinor,
        color: after?.color ?? before?.color ?? '',
        name,
      };
    })
    .sort((left, right) => Math.abs(right.changeMinor) - Math.abs(left.changeMinor));
};
