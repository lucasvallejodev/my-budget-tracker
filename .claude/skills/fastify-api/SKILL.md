---
name: fastify-api
description: Adds or changes endpoints, plugins, hooks, error mapping, configuration, logging and production behavior of CoinKeeper's Fastify 5 API in apps/api, the house way (Zod type provider with contracts from packages/shared, one service call per handler, ServiceError, the authenticated scope, soft delete, per-user scoping, PGlite route tests through app.inject). Use when the user asks to add a route or endpoint, change a response or status code, add a Fastify plugin or hook, map a new error, add an environment variable, or work on server timeouts, graceful shutdown, health or readiness checks, request ids, log redaction or load shedding. Not for schema or migration changes (use database-change), security audits of auth code (use api-security-review), Dockerfile or CI hardening (use container-hardening), or hanging tests and profiling (use node-diagnostics).
---

# Fastify API

Build and change `apps/api` so that it looks like the code already there: every route validates and serializes through a Zod contract in `packages/shared`, calls exactly one service with the signed-in user's id, and fails only by throwing `ServiceError`. The API is Fastify 5.12 with `fastify-type-provider-zod` 7 and Zod 4; generic Fastify advice about TypeBox, Ajv, JSON Schema literals, `@fastify/autoload`, `node:test` or type stripping does not apply here.

## Before you start

- Read `agents/architecture.md` (core rules, API service, service catalog) and `agents/conventions.md` › Server patterns and › Tests.
- For an endpoint, follow `agents/workflows.md` › Add an API endpoint; the human version is `docs/architecture/api.md` › Adding an endpoint.
- Look at the closest existing file first: `apps/api/src/routes/payees.ts` (list, create, patch, commands), `routes/rules.ts` (soft delete and restore), `routes/imports.ts` (`bodyLimit`), `routes/auth.ts` (public routes and rate limits).

## Non-negotiables

1. Request and response schemas live in `packages/shared/src/schema/<domain>.ts` and are imported as `@coinkeeper/shared/schema/<domain>`. Never write a schema inside a route file; even `routes/health.ts` imports `livenessSchema` and `readinessSchema` from `@coinkeeper/shared/schema/health`.
2. Every route declares `schema: { params, querystring, body, response: withErrors({ [HttpStatus.ok]: … }), tags }`; `withErrors` and `noContent` come from `routes/responses.ts`.
3. The handler gets the user with `userIdOf(request)` (`plugins/context.ts`) and calls one `app.services.<domain>.<fn>`. Business rules, ownership checks and SQL stay in `apps/api/src/modules/<domain>/`. The dashboard route in `routes/reports.ts` is the one aggregate that calls several services with `Promise.all`; do not grow it, and remember each parallel query holds its own pool connection (`max` 10).
4. Failures throw `ServiceError(message, status, code?)`, `notFound(what)` or `conflict(message)` from `modules/db.ts`. Never `reply.code(…).send({ … })` an error, including in hooks; `plugins/error-handler.ts` owns the envelope `{ error: { code, message, fields? } }`.
5. Status codes come from `HttpStatus` (`apps/api/src/constants/http.ts`); every timeout, limit and header name is a named constant (`no-magic-numbers` allows only -1, 0, 1 outside tests).
6. Money arrives as a string and is parsed in the route with `parseAmount` / `parseMagnitude` / `toStandardInput` from `routes/inputs.ts`, never in the Zod schema. Amounts are integer minor units end to end.
7. Deletes of financial rows are soft: `DELETE` answers `204` with `noContent` and sets `deleted_at`; add `POST /<resource>/:id/restore`. Categories, groups and payees are archived (`/archive`, `/unarchive`).
8. Another user's id answers `404`, never `403`: ownership is checked in the service, which throws `notFound`.
9. New resource files register in `AuthenticatedRoutes` in `routes/index.ts`. Only health and sign-up/in/out are public (`healthRoutes`, `publicAuthRoutes`); a new public route needs a stated reason, a rate limit if it does work per call, `security: []` in its schema (as in `routes/health.ts` and `routes/auth.ts`) so OpenAPI does not demand the session cookie, and an entry in `PublicOperations` in `routes/authorization.test.ts`, which fails for any undeclared public route.
10. House style applies to every line you write: no comments (module augmentation needs its `eslint-disable-next-line` directive and nothing else), `type` not `interface`, arrow functions, sorted keys and imports, PascalCase constant objects. Run `npm run lint:fix`.

## Workflow

1. **Contract.** Add or extend the Zod schemas in `packages/shared/src/schema/<domain>.ts`. Query and path values arrive as strings: use `z.coerce.number()`, `z.stringbool()` or the shared `pageSizeSchema`, `idParamsSchema`, `includeArchivedQuerySchema`, `deletedQuerySchema`, `listOf`, `pageOf` from `schema/common.ts` (Ajv coercion does not run under the Zod validator).
2. **Service.** Add the function to `apps/api/src/modules/<domain>/service.ts` with `userId` first, filter `user_id` and `deleted_at IS NULL`, wrap multi-row writes in `db.transaction` with `FOR UPDATE`, return the shared response type. A new domain is registered in `createServices` (`modules/services.ts`).
3. **Route.** Write the handler as in `references/routes-and-contracts.md`. Creates answer `HttpStatus.created`, commands and patches answer the updated row, deletes answer `HttpStatus.noContent`.
4. **Errors.** Reuse an existing `ErrorCode` (`ErrorCodeValues` in `packages/shared/src/schema/common.ts`). A new code is added there, then mapped in `plugins/error-handler.ts` if it does not come from a `ServiceError`. See `references/errors.md`.
5. **Plugin, hook or decorator** (only when a route cannot do it): follow `references/plugins-and-hooks.md`; register it from `buildApp` in `app.ts` in the right order.
6. **Configuration**: follow `references/configuration.md` (Zod `environmentSchema` in `config.ts`, `AppConfig`, `config.test.ts`, `.env.example`).
7. **Production behavior** (timeouts, shutdown, health, request ids, redaction, audit events, load shedding): follow `references/production.md`. Server timeouts (`HANDLER_TIMEOUT_MS`), the bounded shutdown in `shutdown.ts`, liveness and readiness, UUID request ids, Pino redaction, `audit()` security events and the `503 UNAVAILABLE` mapping exist: keep them and check a change does not weaken them. Load shedding and fatal-error (`unhandledRejection`, `uncaughtException`) handling do not exist yet; the reference says how to add them.
8. **Tests.** Route tests in `apps/api/src/routes/*.test.ts` with `createTestApp()` and `signUp()`; service rules in `apps/api/src/modules/services.test.ts`. Cover the happy path, `400`, another user's id → `404` and the rule. A new route also lands in `routes/authorization.test.ts` (a `ForeignCases` entry for each path parameter) and changes the OpenAPI snapshot in `routes/__snapshots__/openapi.test.ts.snap`. See `references/testing.md`.
9. **Docs** (below), then the gates.

## References

| File                                                          | Read it when                                                                                                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [routes-and-contracts.md](references/routes-and-contracts.md) | Writing or changing a route: schema block, coercion, money, 201/204, soft delete and restore, route options.                                           |
| [errors.md](references/errors.md)                             | Throwing, mapping or adding an error code; handling Fastify `FST_ERR_*` errors; validation `fields`.                                                   |
| [plugins-and-hooks.md](references/plugins-and-hooks.md)       | Adding a plugin, hook or decorator; choosing the hook; encapsulation and registration order in `buildApp`.                                             |
| [configuration.md](references/configuration.md)               | Adding or changing an environment variable or a derived setting.                                                                                       |
| [production.md](references/production.md)                     | Timeouts, graceful shutdown, liveness and readiness, request ids, log redaction, audit events, load shedding, module state.                            |
| [testing.md](references/testing.md)                           | Writing route or service tests on PGlite; the authorization matrix, OpenAPI snapshot and coverage floors; testing config, hooks, logs and error paths. |
| [source.md](references/source.md)                             | Checking where an idea came from and what was changed from upstream.                                                                                   |

## Verify

```bash
npm run lint:fix
npm run lint && npm run typecheck && npm test -- --run && npm run build
```

- Run only the API tests while iterating: `npx vitest run --project api` (add a file path or `-t "<name>"` to narrow).
- CI runs `npm run test:coverage`, which fails below the floors in `vitest.config.mts` (`apps/api/src/**` and a higher bar for `apps/api/src/modules/**`); run it before you finish a change that adds code.
- To see a route work end to end, `npm run dev`, sign up a throwaway account (`POST /api/v1/auth/sign-up` with header `Origin: http://localhost:3000`) and open `/api/docs` for the generated OpenAPI.

## Keep the docs true

Use `agents/docs-map.md`. Almost every change here touches `docs/reference/rest-api.md` (routes), `docs/architecture/api.md` (lifecycle, access layers, errors, configuration) and `agents/architecture.md` › API service or the service catalog. A new or renamed environment variable also updates `.env.example`, `docs/getting-started/setup.md` and `README.md`.
