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
  it('covers twenty-four full months plus the current month up to today', () => {
    expect(plan.months).toHaveLength(25);
    expect(plan.months[0]).toBe('2024-09');
    expect(plan.months.at(-1)).toBe('2026-09');
    expect(plan.openingDate).toBe('2024-08-31');
    expect(plan.entries.every(entry => entry.date >= '2024-09-01' && entry.date <= Today)).toBe(
      true
    );
    expect(new Set(plan.entries.map(entry => monthOf(entry.date))).size).toBe(25);
  });

  it('pays the salary on a working day near month end, with a raise a year ago', () => {
    const salaries = byPayee('Northwind Labs');

    expect(salaries.map(entry => monthOf(entry.date))).toEqual(plan.months);
    expect(
      salaries
        .filter(entry => entry.date < '2025-10-01')
        .every(entry => entry.amountMinor === 285_000)
    ).toBe(true);
    expect(
      salaries
        .filter(entry => entry.date >= '2025-10-01')
        .every(entry => entry.amountMinor === 300_000)
    ).toBe(true);
    expect(salaries.every(entry => Number(entry.date.slice(8)) >= 24)).toBe(true);
    expect(salaries.every(entry => ![0, 6].includes(new Date(entry.date).getUTCDay()))).toBe(true);
  });

  it('charges rent and the monthly bills within their ranges', () => {
    expect(
      byPayee('Oakwood Lettings').filter(entry => entry.amountMinor === -120_000)
    ).toHaveLength(25);
    expect(byPayee('FibreNet').every(entry => entry.amountMinor === -2500)).toBe(true);

    for (const payee of ['BrightSpark Energy', 'Hearth Gas']) {
      expect(byPayee(payee).every(entry => inRange(-entry.amountMinor, 4000, 8000))).toBe(true);
    }
  });

  it('saves what is above the buffer on payday, up to 600 EUR, in steps of 50', () => {
    const savings = transfers('Monthly savings');

    expect(savings.length).toBeGreaterThanOrEqual(20);
    expect(savings.every(entry => inRange(entry.amountFromMinor, 5000, 60_000))).toBe(true);
    expect(savings.every(entry => entry.amountFromMinor % 5000 === 0)).toBe(true);
    expect(savings.every(entry => plan.paydays.includes(entry.date))).toBe(true);
  });

  it('keeps the everyday account above 200 EUR and cash above zero with top-ups', () => {
    expect(Math.min(...runningBalances('everyday'))).toBeGreaterThanOrEqual(20_000);
    expect(Math.min(...runningBalances('cash'))).toBeGreaterThanOrEqual(0);
    expect(Math.min(...runningBalances('savings'))).toBeGreaterThan(0);
    expect(transfers('Top up from savings').every(entry => entry.from === 'savings')).toBe(true);
    expect(transfers('ATM withdrawal').every(entry => entry.amountFromMinor === 10_000)).toBe(true);
    expect(openingBalances()).toHaveLength(5);
  });

  it('sends 120 EUR to the USD account every quarter at 1.13', () => {
    const topUps = transfers('Top up the USD account');

    expect(topUps.map(entry => monthOf(entry.date))).toEqual(
      plan.months.filter(month => Number(month.slice(5)) % 3 === 0)
    );

    for (const topUp of topUps) {
      expect(topUp.amountFromMinor).toBe(12_000);
      expect(topUp.amountToMinor).toBe(convertMinor(12_000, 'EUR', 'USD', 1.13));
    }
  });

  it('receives 200 to 340 USD of royalties and pays the adviser from the USD account', () => {
    const royalties = byPayee('Lumen Stock');

    expect(royalties).toHaveLength(25);
    expect(royalties.every(entry => entry.account === 'usd')).toBe(true);
    expect(royalties.every(entry => inRange(entry.amountMinor, 20_000, 34_000))).toBe(true);
    expect(byPayee('Harbor Financial Advice').every(entry => entry.account === 'usd')).toBe(true);
  });

  it('raises the Spotify price three months ago and the Netflix price on its latest charge', () => {
    const spotify = byPayee('Spotify');
    const netflix = byPayee('Netflix').map(entry => -entry.amountMinor);

    expect(
      spotify.filter(entry => entry.date < '2026-06-01').every(entry => entry.amountMinor === -1099)
    ).toBe(true);
    expect(
      spotify
        .filter(entry => entry.date >= '2026-06-01')
        .every(entry => entry.amountMinor === -1199)
    ).toBe(true);
    expect(netflix.at(-1)).toBe(1399);
    expect(netflix.slice(0, -1).every(amount => amount === 1299)).toBe(true);
  });

  it('pays off the previous month of credit card spending', () => {
    for (const payment of transfers('Credit card payment')) {
      const previousMonth = plan.months[plan.months.indexOf(monthOf(payment.date)) - 1];

      const spent = standards()
        .filter(entry => !entry.deleted)
        .filter(entry => entry.account === 'creditCard' && monthOf(entry.date) === previousMonth)
        .reduce((total, entry) => total - entry.amountMinor, 0);

      expect(payment.amountFromMinor).toBe(spent);
    }

    expect(transfers('Credit card payment')).toHaveLength(24);
  });

  it('adds yearly events: home insurance, a summer holiday and Christmas', () => {
    expect(byPayee('SafeNest Insurance').map(entry => entry.date)).toEqual([
      '2025-03-15',
      '2026-03-15',
    ]);
    expect(byPayee('Seaside Villas')).toHaveLength(2);
    expect(byPayee('Giftology').filter(entry => entry.memo === 'Christmas presents')).toHaveLength(
      2
    );
    expect(byPayee('BoxDrop Prime').map(entry => entry.date)).toEqual(['2024-10-09', '2025-10-09']);
  });

  it('splits the monthly big shop into lines that add up to the amount', () => {
    const shops = byPayee('Greenleaf Market').filter(entry => entry.splits);

    expect(shops).toHaveLength(25);

    for (const shop of shops) {
      expect(shop.splits!.map(line => line.category)).toEqual(['Groceries', 'Home & garden']);
      expect(shop.splits!.reduce((total, line) => total + line.amountMinor, 0)).toBe(
        shop.amountMinor
      );
    }
  });

  it('pays the cleaner every other Friday and the water bill every quarter but the last', () => {
    const cleaning = byPayee('Sparkle Cleaning').map(entry => entry.date);
    const water = byPayee('Clearwater Utilities').map(entry => entry.date);

    expect(cleaning[0]).toBe(plan.cleanerFirstDate);
    expect(cleaning.every(date => new Date(date).getUTCDay() === 5)).toBe(true);
    expect(water.length).toBeGreaterThanOrEqual(7);
    expect(water.every(date => date < '2026-09-19')).toBe(true);
  });

  it('leaves two recent purchases for the review inbox, one deleted duplicate, and pending card rows', () => {
    const unreviewed = standards().filter(entry => entry.category === null);

    expect(unreviewed.map(entry => entry.bankDescription)).toEqual([
      'SQ *FARMERS STALL',
      'MKTPLACE*7731 ONLINE',
    ]);
    expect(
      standards()
        .filter(entry => entry.deleted)
        .map(entry => entry.memo)
    ).toEqual(['Charged twice by mistake']);
    expect(
      standards()
        .filter(entry => entry.status === 'pending')
        .every(entry => entry.account === 'creditCard' && entry.date >= '2026-09-27')
    ).toBe(true);
  });

  it('plans nine budgets for every month', () => {
    expect(plan.budgets).toHaveLength(9 * 25);
  });

  it('is deterministic, and everyday spending in past months does not change over time', () => {
    const later = buildDemoPlan('2026-10-15');

    const pastMonths = (entries: DemoEntry[]) =>
      standards(entries).filter(
        entry =>
          entry.category === 'Groceries' && entry.date >= '2025-04-01' && entry.date < '2026-09-01'
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
