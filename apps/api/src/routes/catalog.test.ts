// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, signUp, TestClient, TestContext } from '@/test/app';

let context: TestContext;
let ada: TestClient;
let bob: TestClient;

type Group = {
  categories: { id: string; name: string }[];
  id: string;
  isSystem: boolean;
  name: string;
};

const groups = async (client: TestClient, query = ''): Promise<Group[]> =>
  (await client.request('GET', `/category-groups${query}`)).json().items;

const categoryId = async (client: TestClient, name: string) =>
  (await groups(client))
    .flatMap(group => group.categories)
    .find(category => category.name === name)!.id;

const createAccount = async (client: TestClient, currency = 'EUR') =>
  (
    await client.request('POST', '/accounts', {
      currency,
      name: `Account ${currency}`,
      type: 'checking',
    })
  ).json<{ id: string }>();

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

describe('categories', () => {
  it('creates, renames, reorders, archives and unarchives groups and categories', async () => {
    const group = (
      await ada.request('POST', '/category-groups', {
        color: '#123456',
        kind: 'expense',
        name: 'Pets',
      })
    ).json();

    const category = (
      await ada.request('POST', '/categories', {
        groupId: group.id,
        icon: 'Dog',
        name: 'Vet',
      })
    ).json();

    expect(category).toMatchObject({ groupId: group.id, name: 'Vet' });
    expect(
      (await ada.request('PATCH', `/categories/${category.id}`, { name: 'Veterinary' })).json().name
    ).toBe('Veterinary');
    expect((await ada.request('POST', `/category-groups/${group.id}/archive`)).statusCode).toBe(
      422
    );

    const archived = await ada.request('POST', `/categories/${category.id}/archive`, {});

    expect(archived.statusCode).toBe(204);
    expect((await ada.request('POST', `/category-groups/${group.id}/archive`)).statusCode).toBe(
      204
    );
    expect((await ada.request('POST', `/categories/${category.id}/unarchive`)).statusCode).toBe(
      409
    );
    expect(
      (await ada.request('POST', `/category-groups/${group.id}/unarchive`)).json().archivedAt
    ).toBeNull();
    expect(
      (await ada.request('POST', `/categories/${category.id}/unarchive`)).json().archivedAt
    ).toBeNull();

    const ids = (await groups(ada)).map(candidate => candidate.id).reverse();

    expect((await ada.request('PUT', '/category-groups/order', { ids })).statusCode).toBe(204);
    expect((await groups(ada)).map(candidate => candidate.id)).toEqual(ids);
  });

  it('refuses unknown icons, other users groups and archiving the income group', async () => {
    const [income] = await groups(ada);

    expect(income.isSystem).toBe(true);
    expect(
      (
        await ada.request('POST', '/categories', {
          groupId: income.id,
          icon: 'Nope',
          name: 'X',
        })
      ).statusCode
    ).toBe(400);
    expect(
      (
        await bob.request('POST', '/categories', {
          groupId: income.id,
          icon: 'Dog',
          name: 'X',
        })
      ).statusCode
    ).toBe(404);
    expect((await ada.request('POST', `/category-groups/${income.id}/archive`)).statusCode).toBe(
      422
    );
  });
});

describe('payees', () => {
  it('creates, renames, archives and unarchives, with unique names', async () => {
    const payee = await ada.request('POST', '/payees', { name: 'Mercadona' });

    expect(payee.statusCode).toBe(201);

    const duplicate = await ada.request('POST', '/payees', { name: 'Mercadona' });

    expect(duplicate.statusCode).toBe(409);
    expect((await bob.request('POST', '/payees', { name: 'Mercadona' })).statusCode).toBe(201);

    const id = payee.json().id as string;

    await ada.request('POST', `/payees/${id}/archive`);
    expect((await ada.request('GET', '/payees')).json().items).toEqual([]);
    expect((await ada.request('GET', '/payees?includeArchived=true')).json().items).toHaveLength(1);
    expect((await ada.request('POST', `/payees/${id}/unarchive`)).json().archivedAt).toBeNull();
  });
});

describe('rules', () => {
  it('creates, edits, reorders, applies, soft-deletes and restores rules', async () => {
    const groceries = await categoryId(ada, 'Groceries');
    const coffee = await categoryId(ada, 'Coffee');
    const account = await createAccount(ada);

    await ada.request('POST', '/transactions', {
      accountId: account.id,
      amount: '10',
      date: '2026-09-01',
      direction: 'expense',
      memo: 'MERCADONA 123',
    });

    const first = (
      await ada.request('POST', '/rules', { categoryId: coffee, pattern: 'mercadona' })
    ).json();

    const second = (
      await ada.request('POST', '/rules', { categoryId: groceries, pattern: 'merca' })
    ).json();

    const edited = await ada.request('PATCH', `/rules/${first.id}`, { categoryId: groceries });

    expect(edited.json().categoryId).toBe(groceries);
    expect(
      (await ada.request('PUT', '/rules/order', { ids: [second.id, first.id] })).statusCode
    ).toBe(204);
    expect((await ada.request('GET', '/rules')).json().items[0].id).toBe(second.id);
    expect((await ada.request('DELETE', `/rules/${first.id}`)).statusCode).toBe(204);
    expect((await ada.request('GET', '/rules')).json().items).toHaveLength(1);
    expect((await ada.request('GET', '/rules?deleted=true')).json().items[0].id).toBe(first.id);
    expect((await ada.request('POST', `/rules/${first.id}/restore`)).json().deletedAt).toBeNull();
    expect((await ada.request('POST', '/rules/apply')).json()).toEqual({ updated: 1 });
    expect((await bob.request('DELETE', `/rules/${first.id}`)).statusCode).toBe(404);
  });
});

describe('budgets', () => {
  it('upserts by natural key, soft-deletes, restores and copies months', async () => {
    const groceries = await categoryId(ada, 'Groceries');
    const path = `/budgets/2026-09/${groceries}/EUR`;
    const created = await ada.request('PUT', path, { amount: '300' });

    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({ amountMinor: 30000, spentMinor: 0 });

    const updated = await ada.request('PUT', path, { amount: '250' });

    expect(updated.statusCode).toBe(200);
    expect(updated.json().amountMinor).toBe(25000);

    const id = created.json().id as string;

    expect((await ada.request('DELETE', `/budgets/${id}`)).statusCode).toBe(204);
    expect((await ada.request('GET', '/budgets?month=2026-09')).json().items).toEqual([]);
    expect(
      (await ada.request('GET', '/budgets?month=2026-09&deleted=true')).json().items
    ).toHaveLength(1);
    expect((await ada.request('POST', `/budgets/${id}/restore`)).json().deletedAt).toBeNull();

    const copied = await ada.request('POST', '/budgets/copy-previous-month', { month: '2026-10' });

    expect(copied.json()).toEqual({ copied: 1 });
    expect((await ada.request('GET', '/budgets')).statusCode).toBe(400);
    expect((await bob.request('DELETE', `/budgets/${id}`)).statusCode).toBe(404);
  });
});

describe('exchange rates', () => {
  it('upserts by key, soft-deletes, restores and ignores deleted rates in conversions', async () => {
    const put = (rate: string) =>
      ada.request('PUT', '/exchange-rates/USD/EUR/2026-09-01', { rate });

    expect((await put('0,9')).statusCode).toBe(201);
    expect((await put('0.95')).statusCode).toBe(200);
    expect((await put('-1')).statusCode).toBe(400);
    expect(
      (await ada.request('PUT', '/exchange-rates/USD/XXX/2026-09-01', { rate: '1' })).statusCode
    ).toBe(422);

    await ada.request('PATCH', '/settings', { showConvertedTotals: true });
    await createAccount(ada, 'USD');

    const withRate = (await ada.request('GET', '/reports/summary?month=2026-09')).json();

    expect(withRate.converted.missing).toEqual([]);
    expect((await ada.request('DELETE', '/exchange-rates/USD/EUR/2026-09-01')).statusCode).toBe(
      204
    );
    expect((await ada.request('DELETE', '/exchange-rates/USD/EUR/2026-09-01')).statusCode).toBe(
      404
    );

    const withoutRate = (await ada.request('GET', '/reports/summary?month=2026-09')).json();

    expect(withoutRate.converted.missing).toEqual(['USD']);

    const restored = await ada.request('POST', '/exchange-rates/USD/EUR/2026-09-01/restore');

    expect(restored.json()).toMatchObject({ deletedAt: null, rate: 0.95 });
    expect((await bob.request('GET', '/exchange-rates')).json().items).toEqual([]);
  });
});

describe('reports and settings', () => {
  it('serves granular reports and validates their parameters', async () => {
    const account = await createAccount(ada);

    await ada.request('POST', '/transactions', {
      accountId: account.id,
      amount: '42',
      categoryId: await categoryId(ada, 'Groceries'),
      date: '2026-09-03',
      direction: 'expense',
    });

    const byCategory = (
      await ada.request('GET', '/reports/breakdown?month=2026-09&by=category')
    ).json();

    expect(byCategory.items[0]).toMatchObject({ categoryName: 'Groceries', spentMinor: 4200 });
    expect(
      (await ada.request('GET', '/reports/monthly-totals?month=2026-09')).json().items[0]
    ).toMatchObject({ spendingMinor: 4200 });
    expect((await ada.request('GET', '/reports/net-worth')).json().items[0].netMinor).toBe(-4200);
    expect(
      (await ada.request('GET', '/reports/cash-flow?month=2026-09&months=3')).json().items
    ).toHaveLength(1);
    expect(
      (await ada.request('GET', '/reports/cash-flow?month=2026-09&months=99')).statusCode
    ).toBe(400);
    expect((await ada.request('GET', '/reports/monthly-totals?month=09-2026')).statusCode).toBe(
      400
    );
  });

  it('updates settings and rejects unknown currencies', async () => {
    const updated = await ada.request('PATCH', '/settings', { primaryCurrency: 'usd' });

    expect(updated.json().primaryCurrency).toBe('USD');
    expect((await ada.request('PATCH', '/settings', { primaryCurrency: 'XXX' })).statusCode).toBe(
      422
    );
    expect((await ada.request('GET', '/currencies')).json().items.length).toBeGreaterThan(10);
  });

  it('reports health without a session', async () => {
    const response = await context.app.inject({ method: 'GET', url: '/api/v1/health' });

    expect(response.json()).toEqual({ database: 'ok', status: 'ok' });
  });
});

describe('imports', () => {
  it('previews a CSV, commits it and skips duplicates on a second import', async () => {
    const account = await createAccount(ada);
    const csv = 'Date,Payee,Amount\n2026-09-01,Mercadona,-12.30\n2026-09-02,Salary,2000\n';

    const mapping = {
      amount: 'Amount',
      date: 'Date',
      payee: 'Payee',
    };

    const preview = await ada.request('POST', '/imports/preview', {
      accountId: account.id,
      csv,
      mapping,
    });

    expect(preview.statusCode).toBe(200);
    expect(preview.json().counts).toMatchObject({ new: 2 });

    const committed = await ada.request('POST', '/imports', preview.json());

    expect(committed.statusCode).toBe(201);
    expect(committed.json()).toMatchObject({ inserted: 2, matched: 0 });

    const again = await ada.request('POST', '/imports/preview', {
      accountId: account.id,
      csv,
      mapping,
    });

    expect(again.json().counts).toMatchObject({ duplicate: 2, new: 0 });
    expect(
      (
        await ada.request('POST', '/imports/preview', {
          accountId: account.id,
          csv,
          mapping: {},
        })
      ).statusCode
    ).toBe(400);
    expect(
      (
        await bob.request('POST', '/imports/preview', {
          accountId: account.id,
          csv,
          mapping,
        })
      ).statusCode
    ).toBe(404);
  });
});
