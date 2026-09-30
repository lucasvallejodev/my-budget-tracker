// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, signUp, TestClient, TestContext } from '@/test/app';

let context: TestContext;
let ada: TestClient;
let bob: TestClient;

type Account = { id: string };

const ValidAccount = {
  currency: 'EUR',
  name: 'Checking',
  openingBalance: '1000',
  type: 'checking',
};

const createAccount = async (client: TestClient, overrides: Record<string, unknown> = {}) => {
  const response = await client.request('POST', '/accounts', { ...ValidAccount, ...overrides });

  expect(response.statusCode).toBe(201);

  return response.json<Account & { balanceMinor: number }>();
};

const firstCategoryId = async (client: TestClient, groupName = 'Food & Dining') => {
  const groups = (await client.request('GET', '/category-groups')).json().items as {
    categories: { id: string }[];
    name: string;
  }[];

  return groups.find(group => group.name === groupName)!.categories[0].id;
};

const spend = (accountId: string, amount: string, date = '2026-09-10', extra = {}) => ({
  accountId,
  amount,
  date,
  direction: 'expense',
  ...extra,
});

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

describe('accounts', () => {
  it('creates with an opening balance, updates, archives and unarchives', async () => {
    const account = await createAccount(ada);

    expect(account.balanceMinor).toBe(100000);

    const renamed = await ada.request('PATCH', `/accounts/${account.id}`, { name: 'Main' });

    expect(renamed.json()).toMatchObject({ name: 'Main' });

    const locked = await ada.request('PATCH', `/accounts/${account.id}`, { currency: 'USD' });

    expect(locked.statusCode).toBe(409);

    await ada.request('POST', `/accounts/${account.id}/archive`);
    expect((await ada.request('GET', '/accounts')).json().items).toHaveLength(0);
    expect((await ada.request('GET', '/accounts?includeArchived=true')).json().items).toHaveLength(
      1
    );

    const unarchived = await ada.request('POST', `/accounts/${account.id}/unarchive`);

    expect(unarchived.json().archivedAt).toBeNull();
  });

  it('stores an icon and a colour, clears them and refuses invalid ones', async () => {
    const account = await createAccount(ada, { color: '#1f7a5c', icon: 'Landmark' });

    expect((await ada.request('GET', `/accounts/${account.id}`)).json()).toMatchObject({
      color: '#1f7a5c',
      icon: 'Landmark',
    });
    expect(
      (await ada.request('PATCH', `/accounts/${account.id}`, { icon: '🏦' })).json().icon
    ).toBe('🏦');
    expect(
      (await ada.request('PATCH', `/accounts/${account.id}`, { color: null, icon: null })).json()
    ).toMatchObject({ color: null, icon: null });
    expect(
      (await ada.request('PATCH', `/accounts/${account.id}`, { icon: 'bank' })).statusCode
    ).toBe(400);
    expect(
      (await ada.request('PATCH', `/accounts/${account.id}`, { color: '#fff' })).statusCode
    ).toBe(400);
  });

  it('dates the opening balance on the day the client sends, not the server clock', async () => {
    const account = await createAccount(ada, { openingDate: '2026-10-01' });

    const rows = (await ada.request('GET', '/transactions')).json().items as {
      accountId: string;
      date: string;
    }[];

    expect(rows.find(row => row.accountId === account.id)?.date).toBe('2026-10-01');
    expect(
      (await ada.request('POST', '/accounts', { ...ValidAccount, openingDate: '1 Oct' })).statusCode
    ).toBe(400);
  });

  it('soft-deletes an empty account, lists it as deleted and restores it', async () => {
    const empty = await createAccount(ada, { openingBalance: '' });
    const used = await createAccount(ada, { name: 'Used' });

    expect((await ada.request('DELETE', `/accounts/${used.id}`)).statusCode).toBe(409);
    expect((await ada.request('DELETE', `/accounts/${empty.id}`)).statusCode).toBe(204);
    expect((await ada.request('GET', `/accounts/${empty.id}`)).statusCode).toBe(404);

    const deleted = (await ada.request('GET', '/accounts?deleted=true')).json().items;

    expect(deleted).toHaveLength(1);
    expect(deleted[0].deletedAt).not.toBeNull();

    const restored = await ada.request('POST', `/accounts/${empty.id}/restore`);

    expect(restored.statusCode).toBe(200);
    expect(restored.json().deletedAt).toBeNull();
  });

  it('keeps every account private to its owner', async () => {
    const account = await createAccount(ada);

    expect((await bob.request('GET', `/accounts/${account.id}`)).statusCode).toBe(404);
    expect((await bob.request('PATCH', `/accounts/${account.id}`, { name: 'x' })).statusCode).toBe(
      404
    );
    expect((await bob.request('GET', '/accounts')).json().items).toEqual([]);
  });

  it('validates ids and bodies', async () => {
    expect((await ada.request('GET', '/accounts/not-a-uuid')).statusCode).toBe(400);

    const invalid = await ada.request('POST', '/accounts', { currency: 'EUR', type: 'checking' });

    expect(invalid.statusCode).toBe(400);
    expect(invalid.json().error.fields.name).toBeDefined();

    const unknownCurrency = await ada.request('POST', '/accounts', {
      currency: 'XXX',
      name: 'Odd',
      type: 'cash',
    });

    expect(unknownCurrency.statusCode).toBe(422);
  });
});

describe('transactions', () => {
  it('creates, patches, soft-deletes and restores a transaction', async () => {
    const account = await createAccount(ada);
    const categoryId = await firstCategoryId(ada);
    const created = await ada.request('POST', '/transactions', spend(account.id, '12.50'));

    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({ amountMinor: -1250, needsReview: true });

    const id = created.json().id as string;
    const categorised = await ada.request('PATCH', `/transactions/${id}`, { categoryId });

    expect(categorised.json()).toMatchObject({ categoryId, needsReview: false });

    const reAmounted = await ada.request('PATCH', `/transactions/${id}`, { amount: '20' });

    expect(reAmounted.json().amountMinor).toBe(-2000);
    expect((await ada.request('DELETE', `/transactions/${id}`)).statusCode).toBe(204);

    const live = (await ada.request('GET', `/transactions?accountId=${account.id}`)).json();

    expect(live.items.map((row: { id: string }) => row.id)).not.toContain(id);

    const deleted = (await ada.request('GET', '/transactions?deleted=true')).json().items;

    expect(deleted).toHaveLength(1);
    expect(deleted[0]).toMatchObject({ id });
    expect((await ada.request('GET', `/transactions/${id}`)).json().deletedAt).not.toBeNull();

    const restored = await ada.request('POST', `/transactions/${id}/restore`);

    expect(restored.statusCode).toBe(200);
    expect(restored.json()).toMatchObject({ deletedAt: null, id });
    expect((await ada.request('POST', `/transactions/${id}/restore`)).statusCode).toBe(404);
  });

  it('filters the list by currency', async () => {
    const euros = await createAccount(ada);
    const dollars = await createAccount(ada, { currency: 'USD', name: 'Dollars' });

    await ada.request('POST', '/transactions', spend(euros.id, '10'));
    await ada.request('POST', '/transactions', spend(dollars.id, '20'));

    const listed = (await ada.request('GET', '/transactions?currency=USD')).json().items as {
      accountId: string;
      currency: string;
    }[];

    expect(listed.length).toBeGreaterThan(0);
    expect(listed.every(row => row.currency === 'USD' && row.accountId === dollars.id)).toBe(true);
    expect((await ada.request('GET', '/transactions?currency=US')).statusCode).toBe(400);
  });

  it('returns the payee icon and colour on every row', async () => {
    const account = await createAccount(ada);

    const payee = (
      await ada.request('POST', '/payees', {
        color: '#1f7a5c',
        icon: '🥖',
        name: 'Bakery',
      })
    ).json<{ id: string }>();

    const created = (
      await ada.request(
        'POST',
        '/transactions',
        spend(account.id, '3', undefined, { payeeId: payee.id })
      )
    ).json<{ id: string }>();

    const unnamed = (await ada.request('POST', '/transactions', spend(account.id, '1'))).json<{
      id: string;
    }>();

    expect((await ada.request('GET', `/transactions/${created.id}`)).json()).toMatchObject({
      payeeColor: '#1f7a5c',
      payeeIcon: '🥖',
    });

    const rows = (await ada.request('GET', '/transactions')).json().items as {
      id: string;
      payeeColor: string | null;
      payeeIcon: string | null;
    }[];

    expect(rows.find(row => row.id === created.id)).toMatchObject({
      payeeColor: '#1f7a5c',
      payeeIcon: '🥖',
    });
    expect(rows.find(row => row.id === unnamed.id)).toMatchObject({
      payeeColor: null,
      payeeIcon: null,
    });
  });

  it('suggests categories for rows that need review from rules and payee defaults', async () => {
    const account = await createAccount(ada);
    const categoryId = await firstCategoryId(ada);

    await ada.request('POST', '/rules', { categoryId, pattern: 'bakery' });

    const payee = (
      await ada.request('POST', '/payees', { defaultCategoryId: categoryId, name: 'Corner shop' })
    ).json<{ id: string }>();

    const byRule = (
      await ada.request(
        'POST',
        '/transactions',
        spend(account.id, '4', undefined, { memo: 'Bakery' })
      )
    ).json<{ id: string }>();

    const byPayee = (
      await ada.request(
        'POST',
        '/transactions',
        spend(account.id, '9', undefined, { payeeId: payee.id })
      )
    ).json<{ id: string }>();

    await ada.request('POST', '/transactions', spend(account.id, '1'));

    const response = await ada.request('GET', '/transactions/review-suggestions');

    expect(response.statusCode).toBe(200);
    expect(response.json().items).toEqual(
      expect.arrayContaining([
        {
          categoryId,
          source: 'rule',
          transactionId: byRule.id,
        },
        {
          categoryId,
          source: 'payee',
          transactionId: byPayee.id,
        },
      ])
    );
    expect(response.json().items).toHaveLength(2);
    expect((await bob.request('GET', '/transactions/review-suggestions')).json().items).toEqual([]);
  });

  it('leaves deleted rows out of balances and reports until they are restored', async () => {
    const account = await createAccount(ada, { openingBalance: '' });
    const created = await ada.request('POST', '/transactions', spend(account.id, '30'));
    const id = created.json().id as string;
    const summary = () => ada.request('GET', '/reports/summary?month=2026-09');

    expect((await summary()).json().totals).toEqual([
      {
        currency: 'EUR',
        incomeMinor: 0,
        spendingMinor: 3000,
      },
    ]);

    await ada.request('DELETE', `/transactions/${id}`);
    expect((await summary()).json().totals).toEqual([]);
    expect((await ada.request('GET', `/accounts/${account.id}`)).json().balanceMinor).toBe(0);

    await ada.request('POST', `/transactions/${id}/restore`);
    expect((await summary()).json().totals[0].spendingMinor).toBe(3000);
  });

  it('restores a row whose category was archived as needing review', async () => {
    const account = await createAccount(ada);
    const categoryId = await firstCategoryId(ada);

    const created = await ada.request(
      'POST',
      '/transactions',
      spend(account.id, '5', '2026-09-01', { categoryId })
    );

    const id = created.json().id as string;

    await ada.request('DELETE', `/transactions/${id}`);
    await ada.request('POST', `/categories/${categoryId}/archive`, {});

    const restored = (await ada.request('POST', `/transactions/${id}/restore`)).json();

    expect(restored).toMatchObject({ categoryId: null, needsReview: true });
  });

  it('pages newest first with a cursor', async () => {
    const account = await createAccount(ada, { openingBalance: '' });

    for (const day of ['01', '02', '03', '04', '05']) {
      await ada.request('POST', '/transactions', spend(account.id, '1', `2026-09-${day}`));
    }

    const first = (await ada.request('GET', '/transactions?limit=2')).json();

    expect(first.items.map((row: { date: string }) => row.date)).toEqual([
      '2026-09-05',
      '2026-09-04',
    ]);
    expect(first.nextCursor).toBeTruthy();

    const second = (
      await ada.request('GET', `/transactions?limit=2&cursor=${first.nextCursor}`)
    ).json();

    const third = (
      await ada.request('GET', `/transactions?limit=2&cursor=${second.nextCursor}`)
    ).json();

    expect(second.items.map((row: { date: string }) => row.date)).toEqual([
      '2026-09-03',
      '2026-09-02',
    ]);
    expect(third.items).toHaveLength(1);
    expect(third.nextCursor).toBeNull();
    expect((await ada.request('GET', '/transactions?cursor=garbage')).statusCode).toBe(400);
    expect((await ada.request('GET', '/transactions?limit=0')).statusCode).toBe(400);
    expect((await ada.request('GET', '/transactions?from=yesterday')).statusCode).toBe(400);
  });

  it('searches server-side and escapes LIKE wildcards', async () => {
    const account = await createAccount(ada, { openingBalance: '' });

    await ada.request(
      'POST',
      '/transactions',
      spend(account.id, '1', '2026-09-01', { memo: '100% cotton' })
    );
    await ada.request(
      'POST',
      '/transactions',
      spend(account.id, '1', '2026-09-02', { memo: 'coffee' })
    );

    const percent = (await ada.request('GET', '/transactions?q=100%25')).json().items;
    const wildcard = (await ada.request('GET', '/transactions?q=%25')).json().items;

    expect(percent).toHaveLength(1);
    expect(wildcard).toHaveLength(1);
  });

  it('rejects writes to another user rows and zero amounts', async () => {
    const account = await createAccount(ada);
    const created = await ada.request('POST', '/transactions', spend(account.id, '2'));
    const id = created.json().id as string;

    expect((await bob.request('DELETE', `/transactions/${id}`)).statusCode).toBe(404);
    expect((await bob.request('POST', '/transactions', spend(account.id, '2'))).statusCode).toBe(
      404
    );
    expect((await ada.request('POST', '/transactions', spend(account.id, '0'))).statusCode).toBe(
      400
    );
    expect((await ada.request('POST', '/transactions', spend(account.id, 'abc'))).statusCode).toBe(
      400
    );
  });
});

describe('transfers', () => {
  it('moves both legs together through create, patch, delete and restore', async () => {
    const checking = await createAccount(ada);

    const savings = await createAccount(ada, {
      name: 'Savings',
      openingBalance: '',
      type: 'savings',
    });

    const created = await ada.request('POST', '/transfers', {
      amountFrom: '100',
      date: '2026-09-05',
      fromAccountId: checking.id,
      toAccountId: savings.id,
    });

    expect(created.statusCode).toBe(201);

    const { legs, transferId } = created.json();

    expect(legs.map((leg: { amountMinor: number }) => leg.amountMinor)).toEqual([-10000, 10000]);
    expect((await ada.request('DELETE', `/transactions/${legs[0].id}`)).statusCode).toBe(409);

    const reconciled = await ada.request('PATCH', `/transfers/${transferId}`, {
      status: 'reconciled',
    });

    expect(
      reconciled.json().legs.every((leg: { status: string }) => leg.status === 'reconciled')
    ).toBe(true);
    expect((await ada.request('DELETE', `/transfers/${transferId}`)).statusCode).toBe(204);
    expect((await ada.request('GET', `/transfers/${transferId}`)).statusCode).toBe(404);
    expect(
      (await ada.request('GET', '/transactions?deleted=true&kind=transfer')).json().items
    ).toHaveLength(2);

    const restored = await ada.request('POST', `/transfers/${transferId}/restore`);

    expect(restored.statusCode).toBe(200);
    expect(restored.json().legs).toHaveLength(2);
    expect((await ada.request('GET', `/accounts/${savings.id}`)).json().balanceMinor).toBe(10000);
  });

  it('links two opposite rows and refuses different same-currency amounts', async () => {
    const checking = await createAccount(ada, { openingBalance: '' });
    const savings = await createAccount(ada, { name: 'Savings', openingBalance: '' });
    const out = (await ada.request('POST', '/transactions', spend(checking.id, '50'))).json();

    const into = (
      await ada.request('POST', '/transactions', {
        ...spend(savings.id, '50'),
        direction: 'income',
      })
    ).json();

    const other = (
      await ada.request('POST', '/transactions', {
        ...spend(savings.id, '49'),
        direction: 'income',
      })
    ).json();

    const mismatch = await ada.request('POST', '/transfers/link', {
      inTransactionId: other.id,
      outTransactionId: out.id,
    });

    expect(mismatch.statusCode).toBe(422);

    const linked = await ada.request('POST', '/transfers/link', {
      inTransactionId: into.id,
      outTransactionId: out.id,
    });

    expect(linked.statusCode).toBe(201);
    expect(linked.json().legs.every((leg: { kind: string }) => leg.kind === 'transfer')).toBe(true);
  });
});
