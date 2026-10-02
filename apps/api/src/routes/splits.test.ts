// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, signUp, TestClient, TestContext } from '@/test/app';

let context: TestContext;
let ada: TestClient;
let bob: TestClient;

type Split = {
  amountMinor: number;
  categoryId: null | string;
  categoryName: null | string;
  memo: string;
};

type Row = {
  amountMinor: number;
  categoryId: null | string;
  id: string;
  needsReview: boolean;
  splits: Split[];
};

type Categories = Record<string, string>;

const MONTH = '2026-09';

const createAccount = async (client: TestClient, currency = 'EUR') => {
  const response = await client.request('POST', '/accounts', {
    currency,
    name: `Checking ${currency}`,
    type: 'checking',
  });

  expect(response.statusCode).toBe(201);

  return response.json<{ id: string }>().id;
};

const categoriesOf = async (client: TestClient): Promise<Categories> => {
  const groups = (await client.request('GET', '/category-groups')).json().items as {
    categories: { id: string; name: string }[];
    kind: string;
  }[];

  return Object.fromEntries(
    groups
      .filter(group => group.kind === 'expense')
      .flatMap(group => group.categories.map(category => [category.name, category.id]))
  );
};

const groceriesAndHousehold = async (client: TestClient) => {
  const categories = await categoriesOf(client);
  const names = Object.keys(categories);

  return {
    first: categories[names[0]],
    second: categories[names[1]],
    third: categories[names[2]],
  };
};

const splitExpense = (accountId: string, lines: unknown[], amount = '30') => ({
  accountId,
  amount,
  date: `${MONTH}-10`,
  direction: 'expense',
  memo: 'Supermarket',
  splits: lines,
});

const record = async (client: TestClient, body: unknown) => {
  const response = await client.request('POST', '/transactions', body);

  expect(response.statusCode, response.body).toBe(201);

  return response.json<Row>();
};

const transactionsIn = async (client: TestClient, query: string) =>
  (await client.request('GET', `/transactions?${query}`)).json<{ items: Row[] }>().items;

const spendingByCategory = async (client: TestClient, currency = 'EUR') =>
  (
    await client.request(
      'GET',
      `/reports/breakdown?by=category&month=${MONTH}&currency=${currency}`
    )
  ).json<{ items: { categoryId: null | string; spentMinor: number }[] }>().items;

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

describe('split transactions', () => {
  it('records a split with no parent category and counts each line in its category', async () => {
    const accountId = await createAccount(ada);
    const { first, second } = await groceriesAndHousehold(ada);

    const row = await record(
      ada,
      splitExpense(accountId, [
        {
          amount: '20',
          categoryId: first,
          memo: 'Food',
        },
        { amount: '10', categoryId: second },
      ])
    );

    expect(row).toMatchObject({
      amountMinor: -3000,
      categoryId: null,
      needsReview: false,
    });
    expect(row.splits.map(line => [line.categoryId, line.amountMinor, line.memo])).toEqual([
      [first, -2000, 'Food'],
      [second, -1000, ''],
    ]);

    const spending = await spendingByCategory(ada);

    expect(spending.find(slice => slice.categoryId === first)?.spentMinor).toBe(2000);
    expect(spending.find(slice => slice.categoryId === second)?.spentMinor).toBe(1000);
    expect(spending.find(slice => slice.categoryId === null)).toBeUndefined();

    const totals = (await ada.request('GET', `/reports/monthly-totals?month=${MONTH}`)).json();

    expect(totals.items[0].spendingMinor).toBe(3000);
  });

  it('counts split lines in budgets and in the category filter of the list', async () => {
    const accountId = await createAccount(ada);
    const { first, second } = await groceriesAndHousehold(ada);

    await ada.request('PUT', `/budgets/${MONTH}/${second}/EUR`, { amount: '100' });
    await record(
      ada,
      splitExpense(accountId, [
        { amount: '25', categoryId: first },
        {
          amount: '5',
          categoryId: second,
          memo: 'Light bulbs',
        },
      ])
    );

    const budgets = (await ada.request('GET', `/budgets?month=${MONTH}`)).json().items;

    expect(budgets[0].spentMinor).toBe(500);
    expect(await transactionsIn(ada, `categoryId=${second}`)).toHaveLength(1);
    expect(await transactionsIn(ada, 'q=bulbs')).toHaveLength(1);
  });

  it('keeps minor units of the account currency on every line', async () => {
    const accountId = await createAccount(ada, 'JPY');
    const { first, second } = await groceriesAndHousehold(ada);

    const row = await record(
      ada,
      splitExpense(
        accountId,
        [
          { amount: '1200', categoryId: first },
          { amount: '300', categoryId: second },
        ],
        '1500'
      )
    );

    expect(row.splits.map(line => line.amountMinor)).toEqual([-1200, -300]);
  });

  it('rejects a single line, lines that do not add up and a foreign category', async () => {
    const accountId = await createAccount(ada);
    const { first, second } = await groceriesAndHousehold(ada);
    const foreign = (await groceriesAndHousehold(bob)).first;

    const single = await ada.request(
      'POST',
      '/transactions',
      splitExpense(accountId, [{ amount: '30', categoryId: first }])
    );

    const mismatch = await ada.request(
      'POST',
      '/transactions',
      splitExpense(accountId, [
        { amount: '20', categoryId: first },
        { amount: '5', categoryId: second },
      ])
    );

    const stolen = await ada.request(
      'POST',
      '/transactions',
      splitExpense(accountId, [
        { amount: '20', categoryId: first },
        { amount: '10', categoryId: foreign },
      ])
    );

    expect(single.statusCode).toBe(422);
    expect(mismatch.statusCode).toBe(422);
    expect(stolen.statusCode).toBe(404);
    expect(await transactionsIn(ada, '')).toHaveLength(0);
  });

  it('changes the amount only together with new lines, and unsplits with a category', async () => {
    const accountId = await createAccount(ada);
    const { first, second, third } = await groceriesAndHousehold(ada);

    const row = await record(
      ada,
      splitExpense(accountId, [
        { amount: '20', categoryId: first },
        { amount: '10', categoryId: second },
      ])
    );

    const alone = await ada.request('PATCH', `/transactions/${row.id}`, { amount: '40' });

    expect(alone.statusCode).toBe(422);

    const resplit = await ada.request('PATCH', `/transactions/${row.id}`, {
      amount: '40',
      splits: [
        { amount: '15', categoryId: first },
        { amount: '15', categoryId: second },
        { amount: '10', categoryId: third },
      ],
    });

    expect(resplit.json<Row>().splits).toHaveLength(3);
    expect(resplit.json<Row>().amountMinor).toBe(-4000);

    const memoOnly = await ada.request('PATCH', `/transactions/${row.id}`, {
      categoryId: '',
      memo: 'Weekly shop',
    });

    expect(memoOnly.json<Row>()).toMatchObject({ categoryId: null, needsReview: false });
    expect(memoOnly.json<Row>().splits).toHaveLength(3);

    const collapsed = await ada.request('PATCH', `/transactions/${row.id}`, { categoryId: first });

    expect(collapsed.json<Row>()).toMatchObject({ categoryId: first, splits: [] });
  });

  it('removes the split with an empty list, leaving the row to review', async () => {
    const accountId = await createAccount(ada);
    const { first, second } = await groceriesAndHousehold(ada);

    const row = await record(
      ada,
      splitExpense(accountId, [
        { amount: '20', categoryId: first },
        { amount: '10', categoryId: second },
      ])
    );

    const unsplit = await ada.request('PATCH', `/transactions/${row.id}`, { splits: [] });

    expect(unsplit.json<Row>()).toMatchObject({
      categoryId: null,
      needsReview: true,
      splits: [],
    });
  });

  it('moves split lines with an archived category or sends the row to review', async () => {
    const accountId = await createAccount(ada);
    const { first, second, third } = await groceriesAndHousehold(ada);

    const row = await record(
      ada,
      splitExpense(accountId, [
        { amount: '20', categoryId: first },
        { amount: '10', categoryId: second },
      ])
    );

    await ada.request('POST', `/categories/${first}/archive`, { moveToId: third });

    const [moved] = await transactionsIn(ada, `categoryId=${third}`);

    expect(moved.splits[0].categoryId).toBe(third);

    await ada.request('POST', `/categories/${second}/archive`, {});

    const [flagged] = await transactionsIn(ada, '');

    expect(flagged.id).toBe(row.id);
    expect(flagged.needsReview).toBe(true);
    expect(flagged.splits[1].categoryId).toBeNull();
  });

  it('leaves split rows alone when rules are applied and when linked as a transfer', async () => {
    const accountId = await createAccount(ada);
    const savingsId = await createAccount(ada, 'EUR');
    const { first, second } = await groceriesAndHousehold(ada);

    const row = await record(
      ada,
      splitExpense(accountId, [
        { amount: '20', categoryId: first },
        { amount: '10', categoryId: second },
      ])
    );

    await ada.request('POST', '/rules', { categoryId: first, pattern: 'supermarket' });

    const applied = await ada.request('POST', '/rules/apply');

    expect(applied.json().updated).toBe(0);

    const income = await record(ada, {
      accountId: savingsId,
      amount: '30',
      date: `${MONTH}-10`,
      direction: 'income',
    });

    const linked = await ada.request('POST', '/transfers/link', {
      inTransactionId: income.id,
      outTransactionId: row.id,
    });

    expect(linked.statusCode).toBe(201);
    expect(linked.json().legs.every((leg: Row) => leg.splits.length === 0)).toBe(true);
  });

  it('restores a deleted split and flags lines whose category was archived meanwhile', async () => {
    const accountId = await createAccount(ada);
    const { first, second, third } = await groceriesAndHousehold(ada);

    const row = await record(
      ada,
      splitExpense(accountId, [
        { amount: '20', categoryId: first },
        { amount: '10', categoryId: second },
      ])
    );

    await ada.request('DELETE', `/transactions/${row.id}`);
    expect(await spendingByCategory(ada)).toEqual([]);

    await ada.request('POST', `/categories/${third}/archive`, {});

    const restored = await ada.request('POST', `/transactions/${row.id}/restore`);

    expect(restored.json<Row>()).toMatchObject({ needsReview: false });
    expect(restored.json<Row>().splits).toHaveLength(2);
    expect(await spendingByCategory(ada)).toHaveLength(2);
  });

  it("never shows another user's split lines", async () => {
    const accountId = await createAccount(ada);
    const { first, second } = await groceriesAndHousehold(ada);

    await record(
      ada,
      splitExpense(accountId, [
        { amount: '20', categoryId: first },
        { amount: '10', categoryId: second },
      ])
    );

    expect(await transactionsIn(bob, `categoryId=${first}`)).toEqual([]);
    expect(await spendingByCategory(bob)).toEqual([]);
  });
});
