// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { HttpStatus } from '@/constants/http';
import { createTestApp, signUp, TestClient, TestContext, TestOrigin } from '@/test/app';

import { API_PREFIX } from './index';

type OpenApiMethod = 'delete' | 'get' | 'patch' | 'post' | 'put';

type OpenApiDocument = {
  paths: Record<string, Partial<Record<OpenApiMethod, unknown>>>;
};

type Operation = {
  method: OpenApiMethod;
  path: string;
};

type OwnerIds = {
  accountId: string;
  budgetId: string;
  categoryId: string;
  groupId: string;
  payeeId: string;
  ruleId: string;
  sessionId: string;
  templateId: string;
  transactionId: string;
  transferId: string;
};

type IntruderIds = {
  accountId: string;
  categoryId: string;
  groupId: string;
  savingsId: string;
  transactionId: string;
};

type Fixture = {
  intruder: IntruderIds;
  owner: OwnerIds;
};

type ForeignCase = {
  body?: (fixture: Fixture) => unknown;
  method: OpenApiMethod;
  params: (owner: OwnerIds) => Record<string, string>;
  path: string;
};

type ForeignBodyCase = {
  body: (fixture: Fixture) => unknown;
  method: OpenApiMethod;
  name: string;
  path: (fixture: Fixture) => string;
};

const InjectMethods = {
  delete: 'DELETE',
  get: 'GET',
  patch: 'PATCH',
  post: 'POST',
  put: 'PUT',
} as const;

const OpenApiMethods = Object.keys(InjectMethods) as OpenApiMethod[];

const PublicOperations = new Set([
  'get /api/v1/health/live',
  'get /api/v1/health/ready',
  'post /api/v1/auth/sign-in',
  'post /api/v1/auth/sign-out',
  'post /api/v1/auth/sign-up',
]);

const PLACEHOLDER_ID = '00000000-0000-4000-8000-000000000000';
const PATH_PARAMETER_START = '{';
const BUDGET_MONTH = '2026-09';

const RATE_KEY = {
  base: 'USD',
  date: '2026-09-01',
  quote: 'EUR',
};

const ROUTER_IGNORED_METHODS = new Set(['HEAD', 'OPTIONS']);
const TREE_BRANCH = '── ';
const TREE_INDENT = 4;
const METHODS_START = ' (';
const METHODS_END = ')';
const METHODS_SEPARATOR = ', ';
const OpenApiParameter = /\{\w+\}/g;
const RouterParameter = /:[\w:|]+/g;

const byText = (left: string, right: string) => left.localeCompare(right);

const keyOf = (operation: Operation) => `${operation.method} ${operation.path}`;

const concretePath = (path: string, values: Record<string, string> = {}) =>
  path.replace(OpenApiParameter, match => values[match.slice(1, -1)] ?? PLACEHOLDER_ID);

const relativePath = (path: string) => path.slice(API_PREFIX.length);

const shapeOf = (path: string, parameter: RegExp) => path.replace(parameter, '{}');

const operationsOf = (document: OpenApiDocument): Operation[] =>
  Object.entries(document.paths).flatMap(([path, item]) =>
    OpenApiMethods.filter(method => item[method]).map(method => ({ method, path }))
  );

const routerNode = (text: string) => {
  const start = text.lastIndexOf(METHODS_START);

  if (start < 0 || !text.endsWith(METHODS_END)) return { methods: [], segment: text };

  return {
    methods: text.slice(start + METHODS_START.length, -METHODS_END.length).split(METHODS_SEPARATOR),
    segment: text.slice(0, start),
  };
};

const routerOperations = (tree: string): string[] => {
  const ancestors: string[] = [];
  const found: string[] = [];

  for (const line of tree.split('\n')) {
    const branchAt = line.indexOf(TREE_BRANCH);

    if (branchAt < 0) continue;
    const depth = Math.floor((branchAt + 1) / TREE_INDENT);
    const { methods, segment } = routerNode(line.slice(branchAt + TREE_BRANCH.length).trimEnd());

    ancestors.length = depth;
    ancestors.push(segment);
    const path = ancestors.join('');

    for (const method of methods) {
      if (!ROUTER_IGNORED_METHODS.has(method)) {
        found.push(`${method.toLowerCase()} ${shapeOf(path, RouterParameter)}`);
      }
    }
  }

  return found.filter(key => key.includes(` ${API_PREFIX}/`));
};

const ForeignCases: ForeignCase[] = [
  {
    method: 'get',
    params: owner => ({ id: owner.accountId }),
    path: '/api/v1/accounts/{id}',
  },
  {
    body: () => ({ name: 'Taken over' }),
    method: 'patch',
    params: owner => ({ id: owner.accountId }),
    path: '/api/v1/accounts/{id}',
  },
  {
    method: 'delete',
    params: owner => ({ id: owner.accountId }),
    path: '/api/v1/accounts/{id}',
  },
  {
    method: 'post',
    params: owner => ({ id: owner.accountId }),
    path: '/api/v1/accounts/{id}/archive',
  },
  {
    method: 'post',
    params: owner => ({ id: owner.accountId }),
    path: '/api/v1/accounts/{id}/unarchive',
  },
  {
    method: 'post',
    params: owner => ({ id: owner.accountId }),
    path: '/api/v1/accounts/{id}/restore',
  },
  {
    body: () => ({ amount: '999' }),
    method: 'put',
    params: owner => ({
      categoryId: owner.categoryId,
      currency: 'EUR',
      month: BUDGET_MONTH,
    }),
    path: '/api/v1/budgets/{month}/{categoryId}/{currency}',
  },
  {
    method: 'delete',
    params: owner => ({ id: owner.budgetId }),
    path: '/api/v1/budgets/{id}',
  },
  {
    method: 'post',
    params: owner => ({ id: owner.budgetId }),
    path: '/api/v1/budgets/{id}/restore',
  },
  {
    body: () => ({ name: 'Taken over' }),
    method: 'patch',
    params: owner => ({ id: owner.groupId }),
    path: '/api/v1/category-groups/{id}',
  },
  {
    method: 'post',
    params: owner => ({ id: owner.groupId }),
    path: '/api/v1/category-groups/{id}/archive',
  },
  {
    method: 'post',
    params: owner => ({ id: owner.groupId }),
    path: '/api/v1/category-groups/{id}/unarchive',
  },
  {
    body: ({ owner }) => ({ ids: [owner.categoryId] }),
    method: 'put',
    params: owner => ({ id: owner.groupId }),
    path: '/api/v1/category-groups/{id}/categories/order',
  },
  {
    body: () => ({ name: 'Taken over' }),
    method: 'patch',
    params: owner => ({ id: owner.categoryId }),
    path: '/api/v1/categories/{id}',
  },
  {
    body: () => ({}),
    method: 'post',
    params: owner => ({ id: owner.categoryId }),
    path: '/api/v1/categories/{id}/archive',
  },
  {
    method: 'post',
    params: owner => ({ id: owner.categoryId }),
    path: '/api/v1/categories/{id}/unarchive',
  },
  {
    method: 'delete',
    params: () => RATE_KEY,
    path: '/api/v1/exchange-rates/{base}/{quote}/{date}',
  },
  {
    method: 'post',
    params: () => RATE_KEY,
    path: '/api/v1/exchange-rates/{base}/{quote}/{date}/restore',
  },
  {
    method: 'delete',
    params: owner => ({ id: owner.sessionId }),
    path: '/api/v1/me/sessions/{id}',
  },
  {
    body: () => ({ name: 'Taken over' }),
    method: 'patch',
    params: owner => ({ id: owner.payeeId }),
    path: '/api/v1/payees/{id}',
  },
  {
    method: 'post',
    params: owner => ({ id: owner.payeeId }),
    path: '/api/v1/payees/{id}/archive',
  },
  {
    method: 'post',
    params: owner => ({ id: owner.payeeId }),
    path: '/api/v1/payees/{id}/unarchive',
  },
  {
    body: () => ({ pattern: 'taken over' }),
    method: 'patch',
    params: owner => ({ id: owner.ruleId }),
    path: '/api/v1/rules/{id}',
  },
  {
    method: 'delete',
    params: owner => ({ id: owner.ruleId }),
    path: '/api/v1/rules/{id}',
  },
  {
    method: 'post',
    params: owner => ({ id: owner.ruleId }),
    path: '/api/v1/rules/{id}/restore',
  },
  {
    body: () => ({
      direction: 'expense',
      kind: 'standard',
      name: 'Taken over',
    }),
    method: 'put',
    params: owner => ({ id: owner.templateId }),
    path: '/api/v1/transaction-templates/{id}',
  },
  {
    method: 'delete',
    params: owner => ({ id: owner.templateId }),
    path: '/api/v1/transaction-templates/{id}',
  },
  {
    method: 'post',
    params: owner => ({ id: owner.templateId }),
    path: '/api/v1/transaction-templates/{id}/restore',
  },
  {
    method: 'get',
    params: owner => ({ id: owner.transactionId }),
    path: '/api/v1/transactions/{id}',
  },
  {
    body: () => ({ memo: 'Taken over' }),
    method: 'patch',
    params: owner => ({ id: owner.transactionId }),
    path: '/api/v1/transactions/{id}',
  },
  {
    method: 'delete',
    params: owner => ({ id: owner.transactionId }),
    path: '/api/v1/transactions/{id}',
  },
  {
    method: 'post',
    params: owner => ({ id: owner.transactionId }),
    path: '/api/v1/transactions/{id}/restore',
  },
  {
    method: 'get',
    params: owner => ({ transferId: owner.transferId }),
    path: '/api/v1/transfers/{transferId}',
  },
  {
    body: ({ intruder }) => ({
      amountFrom: '1',
      date: '2026-09-06',
      fromAccountId: intruder.accountId,
      toAccountId: intruder.savingsId,
    }),
    method: 'put',
    params: owner => ({ transferId: owner.transferId }),
    path: '/api/v1/transfers/{transferId}',
  },
  {
    body: () => ({ memo: 'Taken over' }),
    method: 'patch',
    params: owner => ({ transferId: owner.transferId }),
    path: '/api/v1/transfers/{transferId}',
  },
  {
    method: 'delete',
    params: owner => ({ transferId: owner.transferId }),
    path: '/api/v1/transfers/{transferId}',
  },
  {
    method: 'post',
    params: owner => ({ transferId: owner.transferId }),
    path: '/api/v1/transfers/{transferId}/restore',
  },
];

const ForeignIdExemptions = new Map([
  [
    'put /api/v1/exchange-rates/{base}/{quote}/{date}',
    'an upsert by natural key; "keeps upserts by natural key private" below covers it',
  ],
]);

const ForeignBodyCases: ForeignBodyCase[] = [
  {
    body: ({ owner }) => ({
      accountId: owner.accountId,
      amount: '5',
      date: '2026-09-11',
      direction: 'expense',
    }),
    method: 'post',
    name: 'a transaction in the owner account',
    path: () => '/transactions',
  },
  {
    body: ({ intruder, owner }) => ({
      accountId: intruder.accountId,
      amount: '5',
      categoryId: owner.categoryId,
      date: '2026-09-11',
      direction: 'expense',
    }),
    method: 'post',
    name: 'a transaction in the owner category',
    path: () => '/transactions',
  },
  {
    body: ({ intruder, owner }) => ({
      accountId: intruder.accountId,
      amount: '5',
      date: '2026-09-11',
      direction: 'expense',
      payeeId: owner.payeeId,
    }),
    method: 'post',
    name: 'a transaction with the owner payee',
    path: () => '/transactions',
  },
  {
    body: ({ owner }) => ({ categoryId: owner.categoryId }),
    method: 'patch',
    name: 'moving an own transaction into the owner category',
    path: ({ intruder }) => `/transactions/${intruder.transactionId}`,
  },
  {
    body: ({ intruder, owner }) => ({
      amountFrom: '5',
      date: '2026-09-11',
      fromAccountId: intruder.accountId,
      toAccountId: owner.accountId,
    }),
    method: 'post',
    name: 'a transfer into the owner account',
    path: () => '/transfers',
  },
  {
    body: ({ intruder, owner }) => ({
      inTransactionId: owner.transactionId,
      outTransactionId: intruder.transactionId,
    }),
    method: 'post',
    name: 'linking an owner row as a transfer leg',
    path: () => '/transfers/link',
  },
  {
    body: ({ owner }) => ({ categoryId: owner.categoryId, pattern: 'grocer' }),
    method: 'post',
    name: 'a rule that files into the owner category',
    path: () => '/rules',
  },
  {
    body: ({ owner }) => ({ ids: [owner.ruleId] }),
    method: 'put',
    name: 'reordering the owner rules',
    path: () => '/rules/order',
  },
  {
    body: ({ intruder, owner }) => ({
      accountId: intruder.accountId,
      amount: '10',
      date: '2026-09-10',
      direction: 'expense',
      splits: [
        { amount: '5', categoryId: intruder.categoryId },
        { amount: '5', categoryId: owner.categoryId },
      ],
    }),
    method: 'post',
    name: 'a split line in the owner category',
    path: () => '/transactions',
  },
  {
    body: ({ owner }) => ({ ids: [owner.templateId] }),
    method: 'put',
    name: 'reordering the owner templates',
    path: () => '/transaction-templates/order',
  },
  {
    body: ({ owner }) => ({
      accountId: owner.accountId,
      amount: '5',
      direction: 'expense',
      kind: 'standard',
      name: 'Planted',
    }),
    method: 'post',
    name: 'a template on the owner account',
    path: () => '/transaction-templates',
  },
  {
    body: ({ owner }) => ({
      categoryId: owner.categoryId,
      direction: 'expense',
      kind: 'standard',
      name: 'Planted',
    }),
    method: 'post',
    name: 'a template in the owner category',
    path: () => '/transaction-templates',
  },
  {
    body: ({ owner }) => ({
      groupId: owner.groupId,
      icon: 'Activity',
      name: 'Planted',
    }),
    method: 'post',
    name: 'a category in the owner group',
    path: () => '/categories',
  },
  {
    body: ({ owner }) => ({ defaultCategoryId: owner.categoryId, name: 'Planted' }),
    method: 'post',
    name: 'a payee that defaults to the owner category',
    path: () => '/payees',
  },
  {
    body: ({ owner }) => ({ ids: [owner.groupId] }),
    method: 'put',
    name: 'reordering the owner groups',
    path: () => '/category-groups/order',
  },
  {
    body: ({ owner }) => ({ ids: [owner.categoryId] }),
    method: 'put',
    name: 'moving an owner category into an own group order',
    path: ({ intruder }) => `/category-groups/${intruder.groupId}/categories/order`,
  },
  {
    body: ({ owner }) => ({ moveToId: owner.categoryId }),
    method: 'post',
    name: 'archiving an own category into the owner category',
    path: ({ intruder }) => `/categories/${intruder.categoryId}/archive`,
  },
  {
    body: ({ owner }) => ({
      accountId: owner.accountId,
      csv: 'date,amount\n2026-09-01,-5',
      mapping: { amount: 'amount', date: 'date' },
    }),
    method: 'post',
    name: 'an import preview for the owner account',
    path: () => '/imports/preview',
  },
];

const StatePaths = [
  '/accounts?includeArchived=true',
  '/accounts?deleted=true',
  '/transactions',
  '/transactions?deleted=true',
  '/category-groups?includeArchived=true',
  '/payees?includeArchived=true',
  '/rules',
  '/rules?deleted=true',
  `/budgets?month=${BUDGET_MONTH}`,
  `/budgets?month=${BUDGET_MONTH}&deleted=true`,
  '/exchange-rates',
  '/exchange-rates?deleted=true',
  '/transaction-templates',
  '/transaction-templates?deleted=true',
];

let context: TestContext;
let operations: Operation[];

const created = async <Body>(pending: ReturnType<TestClient['request']>): Promise<Body> => {
  const response = await pending;

  expect(response.statusCode, response.body).toBeLessThan(HttpStatus.badRequest);

  return response.json<Body>();
};

const firstCategory = async (client: TestClient) => {
  const groups = await created<{ items: { categories: { id: string }[]; id: string }[] }>(
    client.request('GET', '/category-groups')
  );

  const group = groups.items.find(candidate => candidate.categories.length > 0)!;

  return { categoryId: group.categories[0].id, groupId: group.id };
};

const createAccounts = async (client: TestClient) => {
  const checking = await created<{ id: string }>(
    client.request('POST', '/accounts', {
      currency: 'EUR',
      name: 'Checking',
      openingBalance: '1000',
      type: 'checking',
    })
  );

  const savings = await created<{ id: string }>(
    client.request('POST', '/accounts', {
      currency: 'EUR',
      name: 'Savings',
      type: 'savings',
    })
  );

  return { checkingId: checking.id, savingsId: savings.id };
};

const createExpense = async (client: TestClient, accountId: string) =>
  (
    await created<{ id: string }>(
      client.request('POST', '/transactions', {
        accountId,
        amount: '12.50',
        date: '2026-09-10',
        direction: 'expense',
        memo: 'GROCER 42',
      })
    )
  ).id;

const seedOwner = async (owner: TestClient): Promise<OwnerIds> => {
  const { checkingId, savingsId } = await createAccounts(owner);
  const { categoryId, groupId } = await firstCategory(owner);
  const transactionId = await createExpense(owner, checkingId);

  const transfer = await created<{ transferId: string }>(
    owner.request('POST', '/transfers', {
      amountFrom: '100',
      date: '2026-09-05',
      fromAccountId: checkingId,
      toAccountId: savingsId,
    })
  );

  const payee = await created<{ id: string }>(owner.request('POST', '/payees', { name: 'Grocer' }));

  const rule = await created<{ id: string }>(
    owner.request('POST', '/rules', { categoryId, pattern: 'grocer' })
  );

  const budget = await created<{ id: string }>(
    owner.request('PUT', `/budgets/${BUDGET_MONTH}/${categoryId}/EUR`, { amount: '300' })
  );

  await created(
    owner.request('PUT', `/exchange-rates/${RATE_KEY.base}/${RATE_KEY.quote}/${RATE_KEY.date}`, {
      rate: '0.9',
    })
  );

  const sessions = await created<{ items: { id: string }[] }>(owner.request('GET', '/me/sessions'));

  const template = await created<{ id: string }>(
    owner.request('POST', '/transaction-templates', {
      accountId: checkingId,
      amount: '2.50',
      direction: 'expense',
      kind: 'standard',
      name: 'Coffee',
    })
  );

  return {
    accountId: checkingId,
    budgetId: budget.id,
    categoryId,
    groupId,
    payeeId: payee.id,
    ruleId: rule.id,
    sessionId: sessions.items[0].id,
    templateId: template.id,
    transactionId,
    transferId: transfer.transferId,
  };
};

const seedIntruder = async (intruder: TestClient): Promise<IntruderIds> => {
  const { checkingId, savingsId } = await createAccounts(intruder);
  const { categoryId, groupId } = await firstCategory(intruder);
  const transactionId = await createExpense(intruder, checkingId);

  return {
    accountId: checkingId,
    categoryId,
    groupId,
    savingsId,
    transactionId,
  };
};

const stateOf = async (client: TestClient) => {
  const lists = await Promise.all(
    StatePaths.map(async path => ({ path, state: (await client.request('GET', path)).json() }))
  );

  const sessions = (await client.request('GET', '/me/sessions')).json().items as { id: string }[];

  return { lists, sessionIds: sessions.map(session => session.id) };
};

beforeAll(async () => {
  context = await createTestApp();
  operations = operationsOf(context.app.swagger() as unknown as OpenApiDocument);
}, 30000);

afterAll(async () => {
  await context.close();
});

describe('authorization inventory', () => {
  it('keeps the public surface to health and sign-up, sign-in and sign-out', () => {
    const publicKeys = operations.map(keyOf).filter(key => PublicOperations.has(key));

    expect(publicKeys.toSorted(byText)).toEqual([...PublicOperations].toSorted(byText));
  });

  it('lists every API route of the router in the OpenAPI document', () => {
    const documented = operations.map(operation => shapeOf(keyOf(operation), OpenApiParameter));
    const routed = routerOperations(context.app.printRoutes({ commonPrefix: false }));

    expect(routed.toSorted(byText)).toEqual(documented.toSorted(byText));
  });

  it('answers 401 without a session on every other operation', async () => {
    const guarded = operations.filter(operation => !PublicOperations.has(keyOf(operation)));

    expect(guarded.length).toBeGreaterThan(0);

    for (const operation of guarded) {
      const response = await context.app.inject({
        headers: { origin: TestOrigin },
        method: InjectMethods[operation.method],
        url: concretePath(operation.path),
      });

      expect({ operation: keyOf(operation), status: response.statusCode }).toEqual({
        operation: keyOf(operation),
        status: HttpStatus.unauthorized,
      });
    }
  });
});

describe('foreign ids', () => {
  let ada: TestClient;
  let bob: TestClient;
  let fixture: Fixture;

  beforeEach(async () => {
    await context.database.reset();
    ada = await signUp(context.app, 'ada@example.com');
    bob = await signUp(context.app, 'bob@example.com');
    fixture = { intruder: await seedIntruder(bob), owner: await seedOwner(ada) };
  });

  it('covers every operation that takes a path parameter', () => {
    const covered = new Set(ForeignCases.map(keyOf));

    const uncovered = operations
      .filter(operation => operation.path.includes(PATH_PARAMETER_START))
      .map(keyOf)
      .filter(key => !covered.has(key) && !ForeignIdExemptions.has(key));

    const unknown = [...covered, ...ForeignIdExemptions.keys()].filter(
      key => !operations.some(operation => keyOf(operation) === key)
    );

    expect({ uncovered, unknown }).toEqual({ uncovered: [], unknown: [] });
  });

  it("answers 404 to another user's ids and leaves the owner's data unchanged", async () => {
    const ownerBefore = await stateOf(ada);

    for (const foreignCase of ForeignCases) {
      const response = await bob.request(
        InjectMethods[foreignCase.method],
        relativePath(concretePath(foreignCase.path, foreignCase.params(fixture.owner))),
        foreignCase.body?.(fixture)
      );

      expect({ operation: keyOf(foreignCase), status: response.statusCode }).toEqual({
        operation: keyOf(foreignCase),
        status: HttpStatus.notFound,
      });
    }

    expect(await stateOf(ada)).toEqual(ownerBefore);
  });

  it("answers 404 to another user's ids in bodies and changes nothing for either user", async () => {
    const ownerBefore = await stateOf(ada);
    const intruderBefore = await stateOf(bob);

    for (const foreignCase of ForeignBodyCases) {
      const response = await bob.request(
        InjectMethods[foreignCase.method],
        foreignCase.path(fixture),
        foreignCase.body(fixture)
      );

      expect({ case: foreignCase.name, status: response.statusCode }).toEqual({
        case: foreignCase.name,
        status: HttpStatus.notFound,
      });
    }

    expect(await stateOf(ada)).toEqual(ownerBefore);
    expect(await stateOf(bob)).toEqual(intruderBefore);
  });

  it("filters another user's ids out of list queries", async () => {
    const byAccount = await bob.request(
      'GET',
      `/transactions?accountId=${fixture.owner.accountId}`
    );

    const byCategory = await bob.request(
      'GET',
      `/transactions?categoryId=${fixture.owner.categoryId}`
    );

    const suggestions = await bob.request(
      'GET',
      `/transfers/suggestions?transactionIds=${fixture.owner.transactionId}`
    );

    expect(byAccount.json().items).toEqual([]);
    expect(byCategory.json().items).toEqual([]);
    expect(suggestions.json().items).toEqual([]);
  });

  it('keeps upserts by natural key private', async () => {
    const path = `/exchange-rates/${RATE_KEY.base}/${RATE_KEY.quote}/${RATE_KEY.date}`;
    const ownerBefore = await stateOf(ada);
    const response = await bob.request('PUT', path, { rate: '2' });

    expect(response.statusCode).toBe(HttpStatus.created);
    expect(await stateOf(ada)).toEqual(ownerBefore);
    expect((await bob.request('GET', '/exchange-rates')).json().items).toHaveLength(1);
  });
});
