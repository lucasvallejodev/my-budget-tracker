'use client';

import { SegmentedControl } from '@/components/ui';
import {
  type AnalyticsCompare,
  type AnalyticsFilters,
  type AnalyticsRange,
  AnalyticsRanges,
} from '@/lib/analytics-filters';

import { CurrencySwitch } from '../currency-switch';
import { MonthPicker } from '../month-picker';

const RangeLabels: Record<AnalyticsRange, string> = {
  1: 'Month',
  3: '3 months',
  6: '6 months',
  12: '12 months',
};

const CompareOptions: { label: string; value: AnalyticsCompare }[] = [
  // keep order
  { label: 'vs previous', value: 'previous' },
  { label: 'vs last year', value: 'year' },
];

export function AnalyticsFilterBar({
  currencies,
  currency,
  filters,
  onChange,
  primary,
}: {
  currencies: string[];
  currency: string;
  filters: AnalyticsFilters;
  onChange: (patch: Partial<AnalyticsFilters>) => void;
  primary: string;
}) {
  return (
    <>
      <CurrencySwitch
        currencies={currencies}
        primary={primary}
        value={currency}
        onChange={value => onChange({ currency: value })}
      />
      <MonthPicker month={filters.month} onChange={month => onChange({ month })} />
      <SegmentedControl
        label="Period"
        options={AnalyticsRanges.map(range => ({
          label: RangeLabels[range],
          value: String(range),
        }))}
        value={String(filters.range)}
        onChange={value => onChange({ range: Number(value) as AnalyticsRange })}
      />
      <SegmentedControl
        label="Compare with"
        options={CompareOptions}
        value={filters.compare}
        onChange={value => onChange({ compare: value as AnalyticsCompare })}
      />
    </>
  );
}
