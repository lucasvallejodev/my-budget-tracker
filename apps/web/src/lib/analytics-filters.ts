import { isIsoMonth } from '@coinkeeper/shared/lib/patterns';

const MonthRange = 1;
const QuarterRange = 3;
const HalfYearRange = 6;
const YearRange = 12;

// keep order
export const AnalyticsRanges = [MonthRange, QuarterRange, HalfYearRange, YearRange] as const;

export type AnalyticsRange = (typeof AnalyticsRanges)[number];

export type AnalyticsCompare = 'previous' | 'year';

export type AnalyticsFilters = {
  compare: AnalyticsCompare;
  currency?: string;
  month: string;
  range: AnalyticsRange;
};

export type AnalyticsParams = Partial<Record<'compare' | 'currency' | 'month' | 'range', string>>;

const DefaultRange: AnalyticsRange = 1;
const DefaultCompare: AnalyticsCompare = 'previous';
const CurrencyCodeLength = 3;

const isRange = (value: number): value is AnalyticsRange =>
  (AnalyticsRanges as readonly number[]).includes(value);

/**
 * Reads the Analytics filters from the page's query parameters.
 *
 * @remarks
 * Unknown or malformed values fall back to the defaults: the given month, a one-month range and a
 * comparison with the previous period. The currency is kept only when it looks like a three-letter
 * code and is upper-cased.
 *
 * @param params - The raw query parameters (`month`, `range`, `compare`, `currency`).
 * @param fallbackMonth - The month to show when `month` is missing or invalid, as `YYYY-MM`.
 * @returns The filters every Analytics sub-page shares.
 *
 * @example
 * ```ts
 * parseAnalyticsFilters({ range: '6', currency: 'usd' }, '2026-09');
 * // { compare: 'previous', currency: 'USD', month: '2026-09', range: 6 }
 * ```
 */
export const parseAnalyticsFilters = (
  params: AnalyticsParams,
  fallbackMonth: string
): AnalyticsFilters => {
  const range = Number(params.range);
  const currency = params.currency?.toUpperCase();

  return {
    compare: params.compare === 'year' ? 'year' : DefaultCompare,
    currency: currency?.length === CurrencyCodeLength ? currency : undefined,
    month: params.month && isIsoMonth(params.month) ? params.month : fallbackMonth,
    range: isRange(range) ? range : DefaultRange,
  };
};

/**
 * Builds a link to an Analytics sub-page that keeps the shared filters.
 *
 * @remarks
 * Default values are left out so the address stays short; parameters are sorted by name.
 *
 * @param path - The sub-page, such as `/analytics/spending`.
 * @param filters - The filters to keep.
 * @returns The path with a query string, or the bare path when every filter is a default.
 *
 * @example
 * ```ts
 * analyticsHref('/analytics/payees', { compare: 'year', month: '2026-09', range: 3 });
 * // '/analytics/payees?compare=year&month=2026-09&range=3'
 * ```
 */
export const analyticsHref = (path: string, filters: AnalyticsFilters): string => {
  const query = new URLSearchParams();

  if (filters.compare !== DefaultCompare) query.set('compare', filters.compare);
  if (filters.currency) query.set('currency', filters.currency);

  query.set('month', filters.month);

  if (filters.range !== DefaultRange) query.set('range', String(filters.range));

  return `${path}?${query}`;
};
