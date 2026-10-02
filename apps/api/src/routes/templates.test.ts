// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, signUp, TestClient, TestContext } from '@/test/app';

let context: TestContext;
let ada: TestClient;
let bob: TestClient;

type Template = {
  amountMinor: null | number;
  currency: null | string;
  direction: string;
  id: string;
  lastUsedAt: null | string;
  name: string;
  unavailableReason: null | string;
};

const createAccount = async (client: TestClient, name = 'Checking', currency = 'EUR') => {
  const response = await client.request('POST', '/accounts', {
    currency,
    name,
    type: 'checking',
  });

  expect(response.statusCode).toBe(201);

  return response.json<{ id: string }>().id;
};

const groceriesId = async (client: TestClient) => {
  const groups = (await client.request('GET', '/category-groups')).json().items as {
    categories: { id: string; name: string }[];
    name: string;
  }[];

  return groups.find(group => group.name === 'Food & Dining')!.categories[0].id;
};

const salaryId = async (client: TestClient) => {
  const groups = (await client.request('GET', '/category-groups')).json().items as {
    categories: { id: string }[];
    kind: string;
  }[];

  return groups.find(group => group.kind === 'income')!.categories[0].id;
};

const coffee = (accountId: string, extra: Record<string, unknown> = {}) => ({
  accountId,
  amount: '2.50',
  direction: 'expense',
  kind: 'standard',
  name: 'Coffee',
  ...extra,
});

const createTemplate = async (client: TestClient, body: Record<string, unknown>) => {
  const response = await client.request('POST', '/transaction-templates', body);

  expect(response.statusCode, response.body).toBe(201);

  return response.json<Template>();
};

const listTemplates = async (client: TestClient, query = '') =>
  (await client.request('GET', `/transaction-templates${query}`)).json<{ items: Template[] }>()
    .items;

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

describe('transaction templates', () => {
  it('creates an expense template with a signed amount in the account currency', async () => {
    const accountId = await createAccount(ada, 'Yen wallet', 'JPY');
    const template = await createTemplate(ada, coffee(accountId, { amount: '450' }));

    expect(template).toMatchObject({
      amountMinor: -450,
      currency: 'JPY',
      direction: 'expense',
      name: 'Coffee',
      unavailableReason: null,
    });
  });

  it('keeps an empty amount so the form asks each time, and reads the direction from the category', async () => {
    const accountId = await createAccount(ada);

    const template = await createTemplate(ada, {
      accountId,
      categoryId: await salaryId(ada),
      direction: 'income',
      kind: 'standard',
      name: 'Salary',
    });

    expect(template).toMatchObject({ amountMinor: null, direction: 'income' });
  });

  it('saves transfer templates with a positive amount and two different accounts', async () => {
    const checking = await createAccount(ada);
    const savings = await createAccount(ada, 'Savings');

    const template = await createTemplate(ada, {
      accountId: checking,
      amount: '200',
      direction: 'expense',
      kind: 'transfer',
      name: 'Move to savings',
      transferAccountId: savings,
    });

    expect(template.amountMinor).toBe(20000);

    const same = await ada.request('POST', '/transaction-templates', {
      accountId: checking,
      direction: 'expense',
      kind: 'transfer',
      name: 'Loop',
      transferAccountId: checking,
    });

    expect(same.statusCode).toBe(422);
  });

  it('rejects an amount without an account, a category on a transfer and a blank name', async () => {
    const accountId = await createAccount(ada);

    const amountOnly = await ada.request('POST', '/transaction-templates', {
      amount: '5',
      direction: 'expense',
      kind: 'standard',
      name: 'Loose',
    });

    const categorisedTransfer = await ada.request('POST', '/transaction-templates', {
      accountId,
      categoryId: await groceriesId(ada),
      direction: 'expense',
      kind: 'transfer',
      name: 'Odd',
    });

    const blank = await ada.request(
      'POST',
      '/transaction-templates',
      coffee(accountId, { name: ' ' })
    );

    expect(amountOnly.statusCode).toBe(422);
    expect(categorisedTransfer.statusCode).toBe(422);
    expect(blank.statusCode).toBe(400);
  });

  it('refuses a second live template with the same name', async () => {
    const accountId = await createAccount(ada);

    await createTemplate(ada, coffee(accountId));

    const duplicate = await ada.request('POST', '/transaction-templates', coffee(accountId));

    expect(duplicate.statusCode).toBe(409);
  });

  it('updates, reorders, deletes softly and restores', async () => {
    const accountId = await createAccount(ada);
    const first = await createTemplate(ada, coffee(accountId));
    const second = await createTemplate(ada, coffee(accountId, { name: 'Bus' }));

    const updated = await ada.request(
      'PUT',
      `/transaction-templates/${first.id}`,
      coffee(accountId, { amount: '3', name: 'Flat white' })
    );

    expect(updated.json()).toMatchObject({ amountMinor: -300, name: 'Flat white' });

    const reordered = await ada.request('PUT', '/transaction-templates/order', {
      ids: [second.id, first.id],
    });

    expect(reordered.statusCode).toBe(204);
    expect((await listTemplates(ada)).map(template => template.name)).toEqual([
      'Bus',
      'Flat white',
    ]);

    expect((await ada.request('DELETE', `/transaction-templates/${first.id}`)).statusCode).toBe(
      204
    );
    expect(await listTemplates(ada)).toHaveLength(1);
    expect(await listTemplates(ada, '?deleted=true')).toHaveLength(1);

    const restored = await ada.request('POST', `/transaction-templates/${first.id}/restore`);

    expect(restored.statusCode).toBe(200);
    expect(await listTemplates(ada)).toHaveLength(2);
  });

  it('marks a template used when a transaction or transfer is recorded from it', async () => {
    const checking = await createAccount(ada);
    const savings = await createAccount(ada, 'Savings');
    const template = await createTemplate(ada, coffee(checking));

    const recorded = await ada.request('POST', '/transactions', {
      accountId: checking,
      amount: '2.50',
      date: '2026-09-10',
      direction: 'expense',
      templateId: template.id,
    });

    expect(recorded.statusCode).toBe(201);
    expect((await listTemplates(ada))[0].lastUsedAt).not.toBeNull();

    const transferTemplate = await createTemplate(ada, {
      accountId: checking,
      direction: 'expense',
      kind: 'transfer',
      name: 'Savings',
      transferAccountId: savings,
    });

    await ada.request('POST', '/transfers', {
      amountFrom: '10',
      date: '2026-09-10',
      fromAccountId: checking,
      templateId: transferTemplate.id,
      toAccountId: savings,
    });

    const used = (await listTemplates(ada)).find(item => item.id === transferTemplate.id);

    expect(used?.lastUsedAt).not.toBeNull();
  });

  it('flags templates whose account or category was archived', async () => {
    const accountId = await createAccount(ada);
    const categoryId = await groceriesId(ada);

    await createTemplate(ada, coffee(accountId, { categoryId }));
    await ada.request('POST', `/categories/${categoryId}/archive`, {});
    expect((await listTemplates(ada))[0].unavailableReason).toBe('category_archived');

    await ada.request('POST', `/accounts/${accountId}/archive`);
    expect((await listTemplates(ada))[0].unavailableReason).toBe('account_archived');
  });

  it('caps the number of live templates', async () => {
    const accountId = await createAccount(ada);

    for (let index = 0; index < 50; index += 1) {
      await createTemplate(ada, coffee(accountId, { name: `Template ${index}` }));
    }

    const over = await ada.request(
      'POST',
      '/transaction-templates',
      coffee(accountId, { name: 'One too many' })
    );

    expect(over.statusCode).toBe(422);
  });

  it("keeps templates private and refuses another user's references", async () => {
    const accountId = await createAccount(ada);
    const template = await createTemplate(ada, coffee(accountId));

    expect(await listTemplates(bob)).toEqual([]);
    expect((await bob.request('DELETE', `/transaction-templates/${template.id}`)).statusCode).toBe(
      404
    );

    const foreignAccount = await bob.request('POST', '/transaction-templates', coffee(accountId));

    expect(foreignAccount.statusCode).toBe(404);

    const bobAccount = await createAccount(bob);

    await bob.request('POST', '/transactions', {
      accountId: bobAccount,
      amount: '1',
      date: '2026-09-10',
      direction: 'expense',
      templateId: template.id,
    });

    expect((await listTemplates(ada))[0].lastUsedAt).toBeNull();
  });
});
