# Testing the API

> Summary: the two API test layers (route tests through app.inject and service tests on PGlite), the helpers in apps/api/src/test, the cases every endpoint needs, the suite-wide guards (authorization matrix, OpenAPI snapshot, coverage floors), and how to test config, hooks, headers, logs and error mapping.

## Layers

| What                              | Where                                       | Built with                                                   |
| --------------------------------- | ------------------------------------------- | ------------------------------------------------------------ |
| HTTP contract, auth, status codes | `apps/api/src/routes/<area>.test.ts`        | `createTestApp()`, `signUp()`, `inject()` from `@/test/app`  |
| business rules and SQL            | `apps/api/src/modules/services.test.ts`     | `createTestDatabase()`, `insertUser()`, `createServices(db)` |
| configuration                     | `apps/api/src/config.test.ts`               | `loadConfig({ … })` with a plain object                      |
| server options, headers, bodies   | `apps/api/src/app.test.ts`                  | `buildApp` with its own config and a throw-away route        |
| every route's access rules        | `apps/api/src/routes/authorization.test.ts` | the OpenAPI document and the router tree                     |
| the published contract            | `apps/api/src/routes/openapi.test.ts`       | a Vitest snapshot of `/api/docs/json`                        |
| pure helpers                      | colocated `*.test.ts`                       | plain Vitest                                                 |

Both database layers run on PGlite (in-process PostgreSQL, `@electric-sql/pglite` 0.4) with the real Drizzle migrations from `apps/api/drizzle/`. PGlite is single-connection: it does not exercise concurrent transactions, row-lock contention or advisory-lock races. Do not claim a concurrency fix is proven by these tests.

## Route tests

```ts
// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, signUp, TestClient, TestContext } from '@/test/app';

let context: TestContext;
let ada: TestClient;
let bob: TestClient;

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
```

- `createTestApp(environment?)` builds the real app on a fresh PGlite database with `LOG_LEVEL: 'silent'`, `AUTH_ATTEMPTS_PER_MINUTE: '1000'`, `API_DOCS: 'true'` and `ALLOWED_ORIGINS` set to `TestOrigin`; pass overrides as strings (`createTestApp({ SESSION_DAYS: '1' })`).
- `signUp(app, email)` creates a user through `POST /auth/sign-up` and returns a `TestClient` whose `request(method, path, body?)` sends the session cookie and the allowed `Origin`. Paths are relative to `/api/v1`.
- `inject(app, method, path, options)` is the low-level form: use it for requests without a cookie, with a foreign `Origin`, or with custom headers.
- `context.database.reset()` truncates `users` with `CASCADE`; the `// @vitest-environment node` directive is required because the root Vitest config also runs jsdom projects.
- Always `await context.close()` in `afterAll`: it closes the Fastify instance and the PGlite client. A missing close is the usual cause of a run that does not exit (see node-diagnostics).

## Cases every endpoint needs

1. **Happy path**: status code and the response body shape (`toMatchObject`).
2. **Validation**: a malformed id (`/accounts/not-a-uuid`) or body → `400` with `error.code === 'INVALID_REQUEST'` and, for body fields, `error.fields`.
3. **Ownership**: `bob` uses `ada`'s id → `404` for read, update, delete and restore; list endpoints return `[]` for `bob`.
4. **The rule**: the business rule the endpoint enforces (for example deleting an account with live transactions is refused; a restore re-checks the rules).
5. **Soft delete** (deletes): the row disappears from lists, appears with `?deleted=true` where supported, and `POST …/restore` brings it back.
6. **Money** (amount inputs): a currency with 0 decimals (`JPY`) and one with 3 (`KWD`), plus an invalid string → `400`.
7. **Auth**: without a cookie → `401 UNAUTHENTICATED`; a write with a foreign `Origin` → `403 ORIGIN_NOT_ALLOWED` (already covered globally; add it when a route has its own guard).

Magic numbers are allowed in tests (`toBe(404)`), but reuse `HttpStatus` when it reads better.

## Suite-wide guards

These run on every change and fail when a new route or contract change forgets something:

- **Authorization matrix** (`routes/authorization.test.ts`). It reads the OpenAPI document and the router tree (`printRoutes`) and checks that both list the same operations, that the public surface is exactly `PublicOperations` (health live and ready, sign-up, sign-in, sign-out), that every other operation answers `401` without a session, and that every operation with a path parameter has a `ForeignCases` entry proving another user's id answers `404` and leaves the owner's data unchanged. `ForeignBodyCases` does the same for ids sent in bodies; `ForeignIdExemptions` needs a written reason. A new route therefore needs a `ForeignCases` entry (and a `ForeignBodyCases` entry when its body takes another resource's id); do not add it to an exemption to make the test pass.
- **OpenAPI snapshot** (`routes/openapi.test.ts`, `routes/__snapshots__/openapi.test.ts.snap`). Any change to a path, parameter, body or response schema changes the snapshot. Update it with `npx vitest run --project api src/routes/openapi.test.ts -u` only when the contract change is intended, and review the snapshot diff like code: a removed field or a narrowed type breaks the web app.
- **Coverage floors** (`vitest.config.mts` › `coverage.thresholds`). `npm run test:coverage`, run by `quality.yml` and `sonar.yml`, fails when `apps/api/src/**` or the stricter `apps/api/src/modules/**` drops below its floor. Add tests rather than lowering a floor; a lower floor needs a reason in the pull request.

## Testing infrastructure pieces

- **Config**: add cases to `config.test.ts`: default, override, invalid value throws.
- **Hooks and headers**: assert with `inject` on any existing route (`response.headers['x-request-id']`), and include a request that must be rejected.
- **Error mapping**: trigger the error through a real route (oversized body with `bodyLimit`, a `ServiceError` from a service) and assert status and `error.code`. `createTestApp` already calls `app.ready()`, so no route can be added to its instance. For an error that no real route can trigger yet, build the app with `buildApp({ config, db, logger: false })` in that test (config from `loadConfig`, database from `createTestDatabase()`), register a throw-away route, then call `ready()`; `app.test.ts` does this (a `/slow` route for the handler timeout). To test the mapping alone, `plugins/error-handler.test.ts` uses a bare `Fastify({ logger: false })` with only `registerErrorHandler` and routes that throw.
- **Logs**: pass a stream through `buildApp({ config, db, logger: { stream } })` (the level comes from `LOG_LEVEL` in the config) and parse the lines when a test must prove redaction, an audit event or a `userId` field; `plugins/logging.test.ts` and `plugins/audit.test.ts` show the pattern.
- **Shutdown**: `shutDown` takes `closeApp`, `closeDatabase`, `exit` and `log` as arguments, so `shutdown.test.ts` passes fakes and a short `timeoutMs`; keep new process-level behavior injectable the same way.
- **Timers**: the hourly purge lives in `server.ts`, not in `buildApp`, so tests never start it. Services that depend on time take dates as arguments; use `vi.useFakeTimers()` only in pure helper tests.

## Service tests

`services.test.ts` creates one PGlite database in `beforeAll`, truncates it and inserts two users (`owner`, `other`) with `insertUser(db, id)` before each test, then calls `createServices(db)` functions directly. Add every new rule there with an ownership case (the `other` user gets `404` or sees nothing) and keep the test next to the other cases of the same service.
