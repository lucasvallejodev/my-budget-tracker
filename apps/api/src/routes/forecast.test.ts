// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, signUp, TestClient, TestContext } from '@/test/app';

let context: TestContext;
let ada: TestClient;
let bob: TestClient;

const MONTH = '2026-09';
const TODAY = '2026-09-10';

const createAccount = async (client: TestClient, openingBalance = '0') => {
  const response = await client.request('POST', '/accounts', {
    currency: 'EUR',
    name: 'Checking',
    openingBalance,
    openingDate: '2026-09-01',
    type: 'checking',
  });

  expect(response.statusCode, response.body).toBe(201);

  return response.json<{ id: string }>().id;
};

const categoriesOf = async (client: TestClient): Promise<{ expense: string[]; income: string }> => {
  const groups = (await client.request('GET', '/category-groups')).json().items as {
    categories: { id: string }[];
    kind: string;
  }[];

  return {
    expense: groups
      .filter(group => group.kind === 'expense')
      .flatMap(group => group.categories.map(category => category.id)),
    income: groups.find(group => group.kind === 'income')!.categories[0].id,
  };
};

const record = async (client: TestClient, body: Record<string, unknown>) => {
  const response = await client.request('POST', '/transactions', body);

  expect(response.statusCode, response.body).toBe(201);
};

const series = async (client: TestClient, body: Record<string, unknown>) => {
  const response = await client.request('POST', `/recurring-series?today=${TODAY}`, {
    cadence: 'monthly',
    interval: 1,
    recordMode: 'match_only',
    ...body,
  });

  expect(response.statusCode, response.body).toBe(201);
};

beforeAll(async () => {
  context = await createTestApp();
}, 30000);
afterAll(async () => {
  await context.close();
});
beforeEach(async () => {
  await context.database.reset();
  ada = await signUp(context.app, 'ada@example.com');
  bob = await signUp(context.app, 'bob@example.com');
});

describe('left to spend', () => {
  it('takes bills still due, budgets and unbudgeted spending from income received', async () => {
    const accountId = await createAccount(ada);
    const { expense, income } = await categoriesOf(ada);
    const [groceries, housing, leisure] = expense;

    await record(ada, {
      accountId,
      amount: '3000',
      categoryId: income,
      date: '2026-09-01',
      direction: 'income',
    });
    await ada.request('PUT', `/budgets/${MONTH}/${groceries}/EUR`, { amount: '400' });
    await record(ada, {
      accountId,
      amount: '100',
      categoryId: groceries,
      date: '2026-09-05',
      direction: 'expense',
    });
    await record(ada, {
      accountId,
      amount: '50',
      categoryId: leisure,
      date: '2026-09-06',
      direction: 'expense',
    });
    await series(ada, {
      accountId,
      amount: '1000',
      anchorDate: '2026-09-25',
      categoryId: housing,
      kind: 'bill',
      name: 'Rent',
    });
    await series(ada, {
      accountId,
      amount: '15',
      anchorDate: '2026-09-20',
      categoryId: groceries,
      kind: 'subscription',
      name: 'Veg box',
    });

    const response = await ada.request(
      'GET',
      `/reports/left-to-spend?month=${MONTH}&currency=EUR&today=${TODAY}`
    );

    expect(response.json()).toEqual({
      billsDueMinor: 100000,
      budgetedMinor: 40000,
      currency: 'EUR',
      daysLeft: 21,
      incomeMinor: 300000,
      leftMinor: 155000,
      month: MONTH,
      perDayMinor: 7380,
      unbudgetedSpentMinor: 5000,
    });
  });

  it('shows nothing of another user and validates the query', async () => {
    const accountId = await createAccount(ada);
    const { income } = await categoriesOf(ada);

    await record(ada, {
      accountId,
      amount: '3000',
      categoryId: income,
      date: '2026-09-01',
      direction: 'income',
    });

    const theirs = await bob.request('GET', `/reports/left-to-spend?month=${MONTH}&currency=EUR`);
    const missing = await ada.request('GET', `/reports/left-to-spend?month=${MONTH}`);

    expect(theirs.json().incomeMinor).toBe(0);
    expect(missing.statusCode).toBe(400);
  });
});

describe('budget figures from recurring payments', () => {
  it('reports bills still due and fixed spending per budget', async () => {
    const accountId = await createAccount(ada);
    const [groceries] = (await categoriesOf(ada)).expense;
    const payee = (await ada.request('POST', '/payees', { name: 'Veg box' })).json().id;

    await ada.request('PUT', `/budgets/${MONTH}/${groceries}/EUR`, { amount: '400' });
    await series(ada, {
      accountId,
      amount: '15',
      anchorDate: '2026-09-02',
      cadence: 'weekly',
      categoryId: groceries,
      kind: 'subscription',
      name: 'Veg box',
      payeeId: payee,
    });
    await record(ada, {
      accountId,
      amount: '15',
      categoryId: groceries,
      date: '2026-09-02',
      direction: 'expense',
      payeeId: payee,
    });

    const [budget] = (await ada.request('GET', `/budgets?month=${MONTH}`)).json().items;

    expect(budget).toMatchObject({
      billsDueMinor: 6000,
      fixedSpentMinor: 1500,
      spentMinor: 1500,
    });
  });
});

describe('projected balances', () => {
  it('runs scheduled payments through each account and finds the lowest point', async () => {
    const accountId = await createAccount(ada, '1000');

    await series(ada, {
      accountId,
      amount: '800',
      anchorDate: '2026-09-15',
      kind: 'bill',
      name: 'Rent',
    });
    await series(ada, {
      accountId,
      amount: '2000',
      anchorDate: '2026-09-28',
      kind: 'income',
      name: 'Salary',
    });
    await series(ada, {
      accountId,
      amount: '300',
      anchorDate: '2026-09-01',
      kind: 'bill',
      name: 'Insurance',
    });

    const response = await ada.request('GET', `/accounts/projections?today=${TODAY}&days=20`);

    expect(response.json().items).toEqual([
      {
        accountId,
        balanceMinor: 100000,
        currency: 'EUR',
        lowestMinor: -10000,
        lowestOn: '2026-09-15',
        projectedMinor: 190000,
        scheduledCount: 3,
        until: '2026-09-30',
      },
    ]);
    expect((await bob.request('GET', '/accounts/projections')).json().items).toEqual([]);
  });
});
