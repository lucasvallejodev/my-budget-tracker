import type { AnalyticsFilters } from '@/lib/analytics-filters';

export type AnalyticsContext = {
  currency: string;
  filters: AnalyticsFilters;
  format: (value: number) => string;
  formatTick: (value: number) => string;
};
