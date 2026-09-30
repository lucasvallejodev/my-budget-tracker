import { describe, expect, it } from 'vitest';

import { netWorthByMonth } from '../net-worth';
import type { AccountSummary, BalancePoint } from '../use-finance-data';
import {
  accountDetail,
  accountsDescription,
  accountTrend,
  balancesByAccount,
  balanceSides,
  groupAccounts,
  monthChange,
  paymentAccountFor,
  rangeChange,
  seriesForRange,
  sumByCurrency,
} from './accounts-figures';

const account = (overrides: Partial<AccountSummary>): AccountSummary =>
  ({
    accountNumber: null,
    archivedAt: null,
    balanceMinor: 10000,
    classification: 'asset',
    currency: 'EUR',
    id: 'checking',
    institution: 'Northbank',
    name: 'Checking',
    type: 'checking',
    ...overrides,
  }) as AccountSummary;

const point = (
  accountId: string,
  month: string,
  balanceMinor: number,
  currency = 'EUR'
): BalancePoint => ({
  accountId,
  balanceMinor,
  currency,
  month,
});

const checking = account({});

const savings = account({
  balanceMinor: 50000,
  id: 'savings',
  type: 'savings',
});

const card = account({
  balanceMinor: -3000,
  classification: 'liability',
  id: 'card',
  type: 'credit_card',
});

const dollars = account({
  balanceMinor: 7000,
  currency: 'USD',
  id: 'usd',
});

const balances = [
  point('checking', '2026-09', 10000),
  point('checking', '2026-07', 6000),
  point('checking', '2026-08', 8000),
  point('card', '2026-08', -1000),
  point('card', '2026-09', -3000),
  point('usd', '2026-09', 7000, 'USD'),
];

describe('accounts figures', () => {
  it('sums month-end balances of one currency in month order', () => {
    expect(netWorthByMonth(balances, 'EUR')).toEqual([
      {
        label: 'Jul',
        month: '2026-07',
        totalMinor: 6000,
      },
      {
        label: 'Aug',
        month: '2026-08',
        totalMinor: 7000,
      },
      {
        label: 'Sep',
        month: '2026-09',
        totalMinor: 7000,
      },
    ]);
  });

  it('keeps one point more than the range and measures the change from its start', () => {
    const series = netWorthByMonth(balances, 'EUR');

    expect(seriesForRange(series, 1).map(entry => entry.month)).toEqual(['2026-08', '2026-09']);
    expect(seriesForRange(series, 12)).toHaveLength(3);
    expect(rangeChange(series, 9000)).toEqual({ changeMinor: 3000, percent: 50 });
    expect(rangeChange([], 9000)).toEqual({ changeMinor: 0, percent: 0 });
  });

  it('measures the change since last month-end per account', () => {
    const byAccount = balancesByAccount(balances);

    expect(monthChange(checking, byAccount, '2026-08')).toBe(2000);
    expect(monthChange(card, byAccount, '2026-08')).toBe(-2000);
    expect(monthChange(savings, byAccount, '2026-08')).toBe(0);
    expect(accountTrend(checking, byAccount)).toEqual([6000, 8000, 10000]);
    expect(accountTrend(card, byAccount)).toEqual([1000, 3000]);
  });

  it('groups accounts by type with totals and changes per currency', () => {
    const groups = groupAccounts(
      [checking, dollars, savings, card, account({ archivedAt: '2026-01-01', id: 'old' })],
      balancesByAccount(balances),
      '2026-08'
    );

    expect(groups.map(group => group.label)).toEqual([
      'Cash & checking',
      'Savings & investments',
      'Credit cards',
    ]);

    expect(groups[0].totals).toEqual([
      { amountMinor: 10000, currency: 'EUR' },
      { amountMinor: 7000, currency: 'USD' },
    ]);

    expect(groups[0].accounts).toHaveLength(3);
    expect(groups[0].changes[0]).toEqual({ amountMinor: 2000, currency: 'EUR' });
    expect(groups[2].liability).toBe(true);
  });

  it('splits assets and liabilities by account type', () => {
    const { assets, liabilities } = balanceSides([checking, savings, card, dollars], 'EUR');

    expect(assets.totalMinor).toBe(60000);
    expect(assets.slices.map(slice => slice.label)).toEqual(['Savings', 'Checking']);
    expect(liabilities).toEqual({
      slices: [
        {
          amountMinor: 3000,
          color: 'var(--color-account-credit-card)',
          label: 'Credit card',
          type: 'credit_card',
        },
      ],
      totalMinor: 3000,
    });
  });

  it('describes accounts and their second line', () => {
    expect(accountsDescription([checking, dollars])).toBe(
      '2 accounts in 2 currencies. Balances come from your ledger.'
    );

    expect(accountDetail(account({ accountNumber: 'DE001234' }))).toBe(
      'Northbank · EUR · •••• 1234'
    );

    expect(accountDetail(account({ institution: null, type: 'cash' }))).toBe('Cash · EUR');
  });

  it('pays a card from an asset in the same currency first', () => {
    expect(paymentAccountFor(card, [dollars, card, checking])).toBe('checking');
    expect(paymentAccountFor(card, [dollars, card])).toBe('usd');
    expect(paymentAccountFor(card, [card])).toBeUndefined();
  });

  it('adds amounts per currency', () => {
    expect(
      sumByCurrency([
        { amountMinor: 1, currency: 'EUR' },
        { amountMinor: 2, currency: 'USD' },
        { amountMinor: 3, currency: 'EUR' },
      ])
    ).toEqual([
      { amountMinor: 4, currency: 'EUR' },
      { amountMinor: 2, currency: 'USD' },
    ]);
  });
});
