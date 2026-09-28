# Authorization matrix tests

> Summary: how `apps/api/src/routes/authorization.test.ts` makes per-user authorization hard to forget: an inventory taken from the OpenAPI document and the router asserts 401 without a session on every non-public operation, and a foreign-id matrix asserts 404 when user B uses user A's ids in paths and bodies, with a completeness check so that a new `:id` route fails until it is covered. What a reviewer checks in it, and in any test that replaces or extends it.

## Why

Route tests check ownership endpoint by endpoint, by convention (`docs/architecture/testing.md`). On their own, nothing fails when a new route is registered outside `authenticatedScope`, or when a new `:id` route has no user-B case. `apps/api/src/routes/authorization.test.ts` turns both into failures. It uses the same helpers as the other route tests (`createTestApp`, `signUp`, `TestOrigin` from `apps/api/src/test/app.ts`) and PGlite, so no Docker is needed. A hand-written list of routes cannot do this job: it misses exactly the route someone forgot.

`@fastify/swagger` is always registered (`apps/api/src/plugins/openapi.ts`), so `context.app.swagger()` returns the OpenAPI document of the running app. Its paths carry the full prefix and `{param}` placeholders (`/api/v1/accounts/{id}`). Swagger UI routes are hidden from it, and a route could be hidden too (`hide: true`), so the file also compares the document with the router's own table (`printRoutes`).

## Inventory: 401 without a session

The shape of the inventory part (abridged from the file):

```ts
// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { HttpStatus } from '@/constants/http';
import { createTestApp, TestContext, TestOrigin } from '@/test/app';

type OpenApiMethod = 'delete' | 'get' | 'patch' | 'post' | 'put';

type OpenApiDocument = {
  paths: Record<string, Partial<Record<OpenApiMethod, unknown>>>;
};

type Operation = {
  method: OpenApiMethod;
  path: string;
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
const OpenApiParameter = /\{\w+\}/g;

const byText = (left: string, right: string) => left.localeCompare(right);

const keyOf = (operation: Operation) => `${operation.method} ${operation.path}`;

const concretePath = (path: string, values: Record<string, string> = {}) =>
  path.replace(OpenApiParameter, match => values[match.slice(1, -1)] ?? PLACEHOLDER_ID);

const operationsOf = (document: OpenApiDocument): Operation[] =>
  Object.entries(document.paths).flatMap(([path, item]) =>
    OpenApiMethods.filter(method => item[method]).map(method => ({ method, path }))
  );

let context: TestContext;
let operations: Operation[];

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
```

- `onRequest` hooks run before validation. The `requireSession` hook in the authenticated scope therefore answers `401` even when the placeholder UUID would fail a `{month}` or `{currency}` schema. That makes one placeholder enough for every path, and it is why the test must accept `401` only: a `400` would mean validation ran first, so the route skipped the session check.
- Asserting on `{ operation, status }` makes the failure message name the route.
- A third test, "lists every API route of the router in the OpenAPI document", parses `context.app.printRoutes({ commonPrefix: false })` and fails when the router has an `/api/v1` operation the document does not list, so a route hidden from OpenAPI cannot escape the inventory.
- Adding a public route means editing `PublicOperations`, and that edit is what a reviewer should question. The health routes are `GET /api/v1/health/live` and `GET /api/v1/health/ready`; the old `GET /api/v1/health` was removed and answers `404`, so it must not reappear in the list.

## Foreign ids: 404 for another user's resources

In `beforeEach`, the database is reset, user A (`ada`) and user B (`bob`) sign up; `seedOwner` creates one of each of A's resources through the API (accounts, a transaction, a transfer, a payee, a rule, a budget, an exchange rate, a session id) and `seedIntruder` gives B an account pair, a category and a transaction to use in bodies. Each case names the operation by its OpenAPI key and fills the path parameters from A's ids:

```ts
type ForeignCase = {
  body?: (fixture: Fixture) => unknown;
  method: OpenApiMethod;
  params: (owner: OwnerIds) => Record<string, string>;
  path: string;
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
    params: owner => ({ transferId: owner.transferId }),
    path: '/api/v1/transfers/{transferId}',
  },
];

const ForeignIdExemptions = new Map([
  [
    'put /api/v1/exchange-rates/{base}/{quote}/{date}',
    'an upsert by natural key; "keeps upserts by natural key private" below covers it',
  ],
]);

describe('foreign ids', () => {
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
});
```

The file lists every `{…}` operation; the snippet shows three. The `unknown` half fails when a case or exemption names a route that no longer exists, so the list cannot rot.

- "answers 404 to another user's ids and leaves the owner's data unchanged" sends each case as user B with `relativePath(concretePath(path, params(owner)))` (strips `API_PREFIX` from `apps/api/src/routes/index.ts`, because `TestClient.request` adds it), expects `404`, then compares `stateOf(ada)` (A's lists, deleted items and session ids) before and after. A `404` from a handler that changed the row anyway is still a defect.
- Ids in bodies are foreign ids too. `ForeignBodyCases` puts A's `accountId`, `categoryId`, `payeeId`, transaction, rule or group ids inside B's writes: new transactions, moving B's transaction into A's category, transfers into A's account, linking A's row as a transfer leg, rules, categories and payees that point at A's category or group, the rule, group and category reorders, archiving into A's category and an import preview for A's account. Each must answer `404` and change nothing for either user (`stateOf` for both).
- List filters with A's ids (`GET /transactions?accountId=…`) return nothing for B.
- Keep the exemption list short, and give every entry a reason pointing at the test that covers it.

## Review checklist for these tests

- `authorization.test.ts` still exists, still derives operations from the running app, and `PublicOperations` lists only health and sign-up, sign-in and sign-out, unless the pull request justifies a new public route.
- The inventory accepts `401` only, never `400` or `404` as an alternative.
- Every `{…}` operation is in `ForeignCases` or `ForeignIdExemptions`, and a new exemption has a reason that names a covering test.
- A new body field that carries another resource's id has a `ForeignBodyCases` entry.
- The foreign-id tests assert both the status and that A's data (and, for bodies, B's) is unchanged.
- The tests run in the `api` Vitest project: `npm test -- --run --project api`.
