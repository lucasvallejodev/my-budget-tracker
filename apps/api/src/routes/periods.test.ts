// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, signUp, TestClient, TestContext } from '@/test/app';

let context: TestContext;
let ada: TestClient;

const createAccount = async (client: TestClient) =>
  (
    await client.request('POST', '/accounts', {
      currency: 'EUR',
      name: 'Checking',
      type: 'checking',
    })
  ).json<{ id: string }>().id;

const expenseCategory = async (client: TestClient) => {
  const groups = (await client.request('GET', '/category-groups')).json().items as {
    categories: { id: string }[];
    kind: string;
  }[];

  return groups.find(group => group.kind === 'expense')!.categories[0].id;
};

const period = async (client: TestClient, month: string) =>
  (await client.request('GET', `/periods/${month}`)).json();

beforeAll(async () => {
  context = await createTestApp();
}, 30000);
afterAll(async () => {
  await context.close();
});
beforeEach(async () => {
  await context.database.reset();
  ada = await signUp(context.app, 'ada@example.com');
});

describe('budget periods', () => {
  it('uses calendar months until a rule is chosen', async () => {
    expect(await period(ada, '2026-10')).toEqual({
      days: 31,
      from: '2026-10-01',
      key: '2026-10',
      moved: false,
      ruleFrom: '2026-10-01',
      to: '2026-10-31',
    });
  });

  it('follows a fixed payday, named after the month the period ends in', async () => {
    const saved = await ada.request('PATCH', '/settings', {
      periodRule: { day: 25, kind: 'fixed_day' },
      weekendDays: [6, 0, 6],
    });

    expect(saved.json()).toMatchObject({
      periodRule: { day: 25, kind: 'fixed_day' },
      weekendDays: [0, 6],
    });
    expect(await period(ada, '2026-10')).toMatchObject({ from: '2026-09-25', to: '2026-10-22' });
  });

  it('rejects a day the rule cannot use every month', async () => {
    const response = await ada.request('PATCH', '/settings', {
      periodRule: { day: 30, kind: 'fixed_day' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('counts spending, budgets and Home totals in the period, not the calendar month', async () => {
    const accountId = await createAccount(ada);
    const categoryId = await expenseCategory(ada);

    await ada.request('PATCH', '/settings', { periodRule: { day: 25, kind: 'fixed_day' } });
    await ada.request('PUT', `/budgets/2026-10/${categoryId}/EUR`, { amount: '100' });
    await ada.request('POST', '/transactions', {
      accountId,
      amount: '30',
      categoryId,
      date: '2026-09-27',
      direction: 'expense',
    });

    const [budget] = (await ada.request('GET', '/budgets?month=2026-10')).json().items;

    expect(budget).toMatchObject({
      periodFrom: '2026-09-25',
      periodTo: '2026-10-22',
      spentMinor: 3000,
    });

    const october = (await ada.request('GET', '/reports/summary?month=2026-10')).json();
    const september = (await ada.request('GET', '/reports/summary?month=2026-09')).json();

    expect(october.period.from).toBe('2026-09-25');
    expect(october.totals[0].spendingMinor).toBe(3000);
    expect(september.totals).toEqual([]);
  });

  it('moves one period by hand within its neighbours and resets it', async () => {
    await ada.request('PATCH', '/settings', {
      periodRule: { kind: 'before_month_end', workingDays: 0 },
    });

    const moved = await ada.request('PUT', '/periods/2026-10', { startsOn: '2026-10-03' });

    expect(moved.json()).toMatchObject({
      from: '2026-10-03',
      moved: true,
      ruleFrom: '2026-09-30',
      to: '2026-10-29',
    });
    expect(await period(ada, '2026-09')).toMatchObject({ from: '2026-08-31', to: '2026-10-02' });

    const tooLate = await ada.request('PUT', '/periods/2026-10', { startsOn: '2026-11-02' });

    expect(tooLate.statusCode).toBe(422);
    expect((await ada.request('DELETE', '/periods/2026-10')).json().from).toBe('2026-09-30');
    expect((await ada.request('DELETE', '/periods/2026-10')).statusCode).toBe(404);
  });
});
