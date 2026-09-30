import { describe, expect, it } from 'vitest';

import { netWorthByMonth, shortMonthLabel } from './net-worth';

describe('net worth', () => {
  it('adds up month-end balances of one currency in month order', () => {
    expect(
      netWorthByMonth(
        [
          {
            accountId: 'a',
            balanceMinor: 10,
            currency: 'EUR',
            month: '2026-09',
          },
          {
            accountId: 'a',
            balanceMinor: 7,
            currency: 'EUR',
            month: '2026-08',
          },
          {
            accountId: 'b',
            balanceMinor: 5,
            currency: 'EUR',
            month: '2026-08',
          },
          {
            accountId: 'usd',
            balanceMinor: 99,
            currency: 'USD',
            month: '2026-09',
          },
        ],
        'EUR'
      )
    ).toEqual([
      {
        label: 'Aug',
        month: '2026-08',
        totalMinor: 12,
      },
      {
        label: 'Sep',
        month: '2026-09',
        totalMinor: 10,
      },
    ]);
    expect(shortMonthLabel('2026-01')).toBe('Jan');
  });
});
