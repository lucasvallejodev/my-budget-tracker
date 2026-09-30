import { describe, expect, it } from 'vitest';

import { describeConversion } from './conversion';
import type { Summary } from './use-finance-data';

const converted = (rates: NonNullable<Summary['converted']>['rates']) =>
  ({
    asOf: '2026-09-29',
    currency: 'EUR',
    rates,
  }) as NonNullable<Summary['converted']>;

describe('describeConversion', () => {
  it('says the totals are approximate and names each rate', () => {
    expect(describeConversion(converted([]))).toBe(
      'Approximate, using your manual rates as of 2026-09-29'
    );
    expect(
      describeConversion(
        converted([
          {
            currency: 'USD',
            date: '2026-09-01',
            rate: 0.884956,
            source: 'manual',
          },
        ])
      )
    ).toBe(
      'Approximate, using your manual rates as of 2026-09-29 (1 USD = 0.884956 EUR from 2026-09-01)'
    );
  });
});
