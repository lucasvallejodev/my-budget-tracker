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
const SEED_TIMEOUT_MS = 120_000;
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
    expect(await services.budgets.list(userId, '2026-09')).toHaveLength(8);
    expect(await services.rules.list(userId)).toHaveLength(5);
    expect(await services.fx.list(userId)).toHaveLength(8);
    expect(await services.ledger.needsReviewCount(userId)).toBe(2);
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
