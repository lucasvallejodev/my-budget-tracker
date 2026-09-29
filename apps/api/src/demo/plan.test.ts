import { describe, expect, it } from 'vitest';

import { convertMinor } from '@coinkeeper/shared/lib/money';

import { type AccountKey, DemoAccounts } from './persona';
import {
  buildDemoPlan,
  type DemoEntry,
  openingBalances,
  type StandardEntry,
  type TransferEntry,
} from './plan';

const Today = '2026-09-29';
const plan = buildDemoPlan(Today);

const standards = (entries: DemoEntry[] = plan.entries) =>
  entries.filter((entry): entry is StandardEntry => entry.kind === 'standard');

const transfers = (memo: string) =>
  plan.entries.filter(
    (entry): entry is TransferEntry => entry.kind === 'transfer' && entry.memo === memo
  );

const byPayee = (payee: string) => standards().filter(entry => entry.payee === payee);

const monthOf = (date: string) => date.slice(0, 7);

const inRange = (value: number, min: number, max: number) => value >= min && value <= max;

const runningBalances = (account: AccountKey) => {
  let balance = DemoAccounts[account].openingBalanceMinor;
  const balances: number[] = [];

  for (const entry of plan.entries) {
    if (entry.kind === 'standard' && entry.account === account) balance += entry.amountMinor;
    if (entry.kind === 'transfer' && entry.from === account) balance -= entry.amountFromMinor;

    if (entry.kind === 'transfer' && entry.to === account) {
      balance += entry.amountToMinor ?? entry.amountFromMinor;
    }

    balances.push(balance);
  }

  return balances;
};

describe('demo plan', () => {
  it('covers six full months plus the current month up to today', () => {
    expect(plan.months).toEqual([
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
    ]);
    expect(plan.openingDate).toBe('2026-02-28');
    expect(plan.entries.every(entry => entry.date >= '2026-03-01' && entry.date <= Today)).toBe(
      true
    );
    expect(new Set(plan.entries.map(entry => monthOf(entry.date))).size).toBe(7);
  });

  it('pays a 3,000 EUR salary on a working day near the end of every month', () => {
    const salaries = byPayee('Northwind Labs');

    expect(salaries.map(entry => monthOf(entry.date))).toEqual(plan.months);
    expect(salaries.every(entry => entry.amountMinor === 300_000)).toBe(true);
    expect(salaries.every(entry => Number(entry.date.slice(8)) >= 24)).toBe(true);
    expect(salaries.every(entry => ![0, 6].includes(new Date(entry.date).getUTCDay()))).toBe(true);
  });

  it('charges rent and the monthly bills within their ranges', () => {
    expect(byPayee('Oakwood Lettings')).toHaveLength(7);
    expect(byPayee('Oakwood Lettings').every(entry => entry.amountMinor === -120_000)).toBe(true);
    expect(byPayee('FibreNet').every(entry => entry.amountMinor === -2500)).toBe(true);

    for (const payee of ['BrightSpark Energy', 'Hearth Gas']) {
      expect(byPayee(payee).every(entry => inRange(-entry.amountMinor, 4000, 8000))).toBe(true);
    }
  });

  it('moves 400 to 600 EUR to savings after each payday', () => {
    const savings = transfers('Monthly savings');

    expect(savings.length).toBeGreaterThanOrEqual(6);
    expect(savings.every(entry => inRange(entry.amountFromMinor, 40_000, 60_000))).toBe(true);
    expect(savings.every(entry => entry.amountFromMinor % 5000 === 0)).toBe(true);
  });

  it('sends about 120 EUR a month to the USD account at 1.13', () => {
    const topUps = transfers('Top up the USD account');

    expect(topUps).toHaveLength(7);

    for (const topUp of topUps) {
      expect(inRange(topUp.amountFromMinor, 10_000, 14_000)).toBe(true);
      expect(topUp.amountToMinor).toBe(convertMinor(topUp.amountFromMinor, 'EUR', 'USD', 1.13));
    }
  });

  it('receives 200 to 340 USD of royalties and pays the adviser from the USD account', () => {
    const royalties = byPayee('Lumen Stock');

    expect(royalties).toHaveLength(7);
    expect(royalties.every(entry => entry.account === 'usd')).toBe(true);
    expect(royalties.every(entry => inRange(entry.amountMinor, 20_000, 34_000))).toBe(true);
    expect(byPayee('Harbor Financial Advice').every(entry => entry.account === 'usd')).toBe(true);
  });

  it('raises the Spotify price for the last three months', () => {
    const prices = byPayee('Spotify').map(entry => [monthOf(entry.date), -entry.amountMinor]);

    expect(prices).toEqual([
      ['2026-03', 1099],
      ['2026-04', 1099],
      ['2026-05', 1099],
      ['2026-06', 1199],
      ['2026-07', 1199],
      ['2026-08', 1199],
      ['2026-09', 1199],
    ]);
  });

  it('pays off the previous month of credit card spending', () => {
    for (const payment of transfers('Credit card payment')) {
      const previousMonth = plan.months[plan.months.indexOf(monthOf(payment.date)) - 1];

      const spent = standards()
        .filter(entry => entry.account === 'creditCard' && monthOf(entry.date) === previousMonth)
        .reduce((total, entry) => total - entry.amountMinor, 0);

      expect(payment.amountFromMinor).toBe(spent);
    }

    expect(transfers('Credit card payment')).toHaveLength(6);
  });

  it('never lets the everyday or cash accounts go below zero', () => {
    expect(Math.min(...runningBalances('everyday'))).toBeGreaterThan(0);
    expect(Math.min(...runningBalances('cash'))).toBeGreaterThanOrEqual(0);
    expect(openingBalances()).toHaveLength(5);
  });

  it('leaves two recent purchases for the review inbox and marks recent card rows pending', () => {
    const unreviewed = standards().filter(entry => entry.category === null);

    expect(unreviewed.map(entry => entry.bankDescription)).toEqual([
      'SQ *FARMERS STALL',
      'MKTPLACE*7731 ONLINE',
    ]);
    expect(
      standards()
        .filter(entry => entry.status === 'pending')
        .every(entry => entry.account === 'creditCard' && entry.date >= '2026-09-27')
    ).toBe(true);
  });

  it('plans eight budgets for every month', () => {
    expect(plan.budgets).toHaveLength(8 * 7);
  });

  it('is deterministic, and everyday spending in past months does not change over time', () => {
    const later = buildDemoPlan('2026-10-15');

    const pastMonths = (entries: DemoEntry[]) =>
      standards(entries).filter(
        entry =>
          entry.category === 'Groceries' && entry.date >= '2026-04-01' && entry.date < '2026-09-01'
      );

    expect(buildDemoPlan(Today)).toEqual(plan);
    expect(pastMonths(later.entries)).toEqual(pastMonths(plan.entries));
  });

  it('works on the first day of a month', () => {
    const firstDay = buildDemoPlan('2026-10-01');

    expect(firstDay.entries.every(entry => entry.date <= '2026-10-01')).toBe(true);
    expect(standards(firstDay.entries).filter(entry => entry.category === null)).toHaveLength(2);
  });
});
