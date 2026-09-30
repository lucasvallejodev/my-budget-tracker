import { describe, expect, it } from 'vitest';

import { netWorthAt, netWorthByMonth, shortMonthLabel } from './net-worth';
import type { AccountSummary } from './use-finance-data';

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

  it('totals the balances of one month-end per currency, split into assets and owed', () => {
    const accounts = [
      { classification: 'asset', id: 'checking' },
      { classification: 'liability', id: 'card' },
    ] as AccountSummary[];

    const point = (accountId: string, month: string, balanceMinor: number, currency = 'EUR') => ({
      accountId,
      balanceMinor,
      currency,
      month,
    });

    expect(
      netWorthAt(
        [
          point('checking', '2026-08', 5000),
          point('card', '2026-08', -1200),
          point('checking', '2026-09', 9000),
          point('usd', '2026-08', 700, 'USD'),
        ],
        accounts,
        '2026-08'
      )
    ).toEqual([
      {
        assetsMinor: 5000,
        currency: 'EUR',
        liabilitiesMinor: -1200,
        netMinor: 3800,
      },
      {
        assetsMinor: 700,
        currency: 'USD',
        liabilitiesMinor: 0,
        netMinor: 700,
      },
    ]);
  });
});
