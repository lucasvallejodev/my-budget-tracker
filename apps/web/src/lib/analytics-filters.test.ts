import { describe, expect, it } from 'vitest';

import { analyticsHref, parseAnalyticsFilters } from './analytics-filters';

describe('parseAnalyticsFilters', () => {
  it('reads valid filters and normalizes the currency', () => {
    expect(parseAnalyticsFilters({ currency: 'usd', range: '6' }, '2026-09')).toEqual({
      compare: 'previous',
      currency: 'USD',
      month: '2026-09',
      range: 6,
    });
    expect(
      parseAnalyticsFilters(
        {
          compare: 'year',
          month: '2026-03',
          range: '12',
        },
        '2026-09'
      )
    ).toEqual({
      compare: 'year',
      currency: undefined,
      month: '2026-03',
      range: 12,
    });
  });

  it('falls back to defaults for malformed values', () => {
    expect(
      parseAnalyticsFilters(
        {
          compare: 'week',
          currency: 'euro',
          month: '2026-13x',
          range: '5',
        },
        '2026-09'
      )
    ).toEqual({
      compare: 'previous',
      currency: undefined,
      month: '2026-09',
      range: 1,
    });
  });
});

describe('analyticsHref', () => {
  it('keeps the filters and leaves defaults out', () => {
    expect(
      analyticsHref('/analytics/payees', {
        compare: 'year',
        month: '2026-09',
        range: 3,
      })
    ).toBe('/analytics/payees?compare=year&month=2026-09&range=3');
    expect(
      analyticsHref('/analytics', {
        compare: 'previous',
        currency: 'EUR',
        month: '2026-09',
        range: 1,
      })
    ).toBe('/analytics?currency=EUR&month=2026-09');
  });
});
