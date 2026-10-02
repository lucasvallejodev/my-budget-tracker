// @vitest-environment node
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { users } from '@/db/schema';
import type { Db } from '@/modules/db';
import { createServices, type Services } from '@/modules/services';
import { TestPassword } from '@/test/app';
import { createTestDatabase, type TestDatabase } from '@/test/database';

import { DemoUser } from './persona';
import { seedDemoAccount } from './seed';

const Today = '2026-09-29';
const SEED_TIMEOUT_MS = 300_000;
const Credentials = { email: 'demo@example.com', password: TestPassword };

let database: TestDatabase;
let db: Db;
let services: Services;
let userId: string;

const byName = (left: string[], right: string[]) => left[0].localeCompare(right[0]);

beforeAll(async () => {
  database = await createTestDatabase();
  db = database.db;
  services = createServices(db);
  userId = (await seedDemoAccount(services, Today, Credentials)).userId;
}, SEED_TIMEOUT_MS);

afterAll(async () => {
  await database.close();
});

describe('demo account seed', () => {
  it('creates a user who can sign in with the documented credentials', async () => {
    const user = await services.auth.signIn(Credentials.email, Credentials.password);

    expect(user).toMatchObject({
      email: Credentials.email,
      id: userId,
      name: DemoUser.name,
    });
  });

  it('creates the five accounts with EUR and USD balances', async () => {
    const accounts = await services.accounts.list(userId);

    expect(accounts.map(account => [account.name, account.currency]).sort(byName)).toEqual([
      ['Cash', 'EUR'],
      ['Credit card', 'EUR'],
      ['Everyday account', 'EUR'],
      ['Savings', 'EUR'],
      ['USD account', 'USD'],
    ]);
    expect(accounts.find(account => account.name === 'Savings')!.balanceMinor).toBeGreaterThan(
      820_000
    );
  });

  it('reports the salary as EUR income and the royalties as USD income', async () => {
    const totals = await services.reports.monthlyTotals(userId, '2026-08');
    const eur = totals.find(total => total.currency === 'EUR')!;
    const usd = totals.find(total => total.currency === 'USD')!;

    expect(eur.incomeMinor).toBe(300_000);
    expect(eur.spendingMinor).toBeGreaterThan(150_000);
    expect(usd.incomeMinor).toBeGreaterThanOrEqual(20_000);
  });

  it('sets budgets, rules, exchange rates and two rows to review', async () => {
    expect(await services.budgets.list(userId, '2026-09')).toHaveLength(9);
    expect(await services.rules.list(userId)).toHaveLength(5);
    expect(await services.fx.list(userId)).toHaveLength(26);
    expect(await services.ledger.needsReviewCount(userId)).toBe(2);
  });

  it('covers two years, with a salary raise a year ago', async () => {
    const before = await services.reports.monthlyTotals(userId, '2025-08');
    const oldest = await services.ledger.list(userId, { month: '2024-09' });

    expect(before.find(total => total.currency === 'EUR')!.incomeMinor).toBe(285_000);
    expect(oldest.length).toBeGreaterThan(30);
  });

  it('keeps templates, one of them deleted', async () => {
    const templates = await services.templates.list(userId);

    expect(templates.map(template => template.name)).toEqual([
      'Coffee',
      'Bakery',
      'Groceries',
      'Haircut',
      'Monthly savings',
      'Cash withdrawal',
    ]);
    expect(templates.find(template => template.name === 'Coffee')!.lastUsedAt).not.toBeNull();
    expect(await services.templates.list(userId, { deleted: true })).toHaveLength(1);
  });

  it('splits the monthly big shop between groceries and home', async () => {
    const [shop] = await services.ledger.list(userId, {
      month: '2026-08',
      search: 'Big monthly shop',
    });

    expect(shop.splits.map(line => line.categoryName)).toEqual(['Groceries', 'Home & garden']);
    expect(shop.splits.reduce((total, line) => total + line.amountMinor, 0)).toBe(shop.amountMinor);
  });

  it('links payments to recurring series and shows what is due', async () => {
    const series = await services.recurring.list(userId, { today: Today });
    const byName = new Map(series.map(item => [item.name, item]));

    expect(series).toHaveLength(10);
    expect(byName.get('Rent')!.paidCount).toBe(25);
    expect(byName.get('Salary')!.paidCount).toBe(25);
    expect(byName.get('Netflix')!.lastPaidAmountMinor).toBe(-1399);
    expect(byName.get('Netflix')!.previousPaidAmountMinor).toBe(-1299);
    expect(await services.recurring.list(userId, { deleted: true })).toHaveLength(1);

    const upcoming = await services.recurring.upcoming(userId, { today: Today });

    expect(upcoming.find(item => item.name === 'Water')!.status).toBe('overdue');
    expect(await services.recurring.recordDue(userId, { today: Today })).toBe(1);
  });

  it('suggests the regular payments that have no series yet', async () => {
    const suggestions = await services.recurring.suggestions(userId, { today: Today });

    expect(suggestions.map(item => item.payeeName)).toEqual(
      expect.arrayContaining(['City Transit', 'Mobi Mobile', 'PulseFit Gym'])
    );
  });

  it('starts budget periods before the end of the month and moves this one to payday', async () => {
    const settings = await services.getSettings(userId);
    const period = await services.periods.range(userId, '2026-10');

    expect(settings.periodRule).toEqual({ kind: 'before_month_end', workingDays: 2 });
    expect(period.ruleFrom).toBe('2026-09-28');
  });

  it('keeps one deleted transaction to restore', async () => {
    const deleted = await services.ledger.list(userId, { deleted: true });

    expect(deleted.map(row => row.memo)).toEqual(['Charged twice by mistake']);
  });

  it('refuses to replace an account that is not the demo user', async () => {
    await services.auth.signUp({
      email: 'someone@example.com',
      name: 'Someone',
      password: TestPassword,
    });

    await expect(
      seedDemoAccount(services, Today, { ...Credentials, email: 'someone@example.com' })
    ).rejects.toThrow('not the demo user');
    expect(
      await db.select().from(users).where(eq(users.email, 'someone@example.com'))
    ).toHaveLength(1);
  });

  it(
    'replaces the previous demo user when it runs again',
    async () => {
      const again = await seedDemoAccount(services, Today, Credentials);
      const matching = await db.select().from(users).where(eq(users.email, Credentials.email));

      expect(again.userId).not.toBe(userId);
      expect(matching).toHaveLength(1);
      expect(await services.accounts.list(again.userId)).toHaveLength(5);

      userId = again.userId;
    },
    SEED_TIMEOUT_MS
  );
});
