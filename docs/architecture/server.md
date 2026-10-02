# Domain services

> Summary: the domain services in `apps/api/src/modules/`: how they are wired, the conventions they follow (set-based writes and transactions included), the database pool and its time limits, `ServiceError`, soft deletes, the per-user bootstrap at sign-up and how to add a service method. HTTP routes, sessions and error responses are in the API service page.

The services hold every business rule and every query. They know nothing about HTTP: routes in `apps/api/src/routes/` call them and turn their results and errors into responses (see [API service](api.md)).

## Wiring

`apps/api/src/modules/services.ts` builds every service on top of one Drizzle database handle:

```ts
const services = createServices(db, { sessionDays });
services.accounts | auth | budgets | categories | fx | imports | ledger | payees | reports | rules | sessions
services.bootstrap(userId) · listCurrencies() · getSettings(userId) · updateSettings(userId, patch)
```

`buildApp` (`apps/api/src/app.ts`) decorates the Fastify instance with `services`; route plugins call them as `app.services.<name>`. Tests call `createServices(pgliteDb)` directly.

## Services

| Service      | File                                                                                                                                                                          | Responsibilities                                                                                                                                                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accounts`   | `apps/api/src/modules/accounts/service.ts`                                                                                                                                    | list with computed balances, create (with optional opening balance), update (currency lock), archive and unarchive, soft delete (only without live transactions), restore, `owned()` guard                                                   |
| `categories` | `apps/api/src/modules/categories/service.ts`                                                                                                                                  | tree with transaction counts, groups and categories CRUD, reorder (one statement; every id must be yours), archive with move-or-review, unarchive                                                                                            |
| `ledger`     | `apps/api/src/modules/ledger/` (`service.ts` composes `queries.ts`, `standard.ts`, `transfers.ts`, `guards.ts`, `types.ts`)                                                   | paged list with joins and filters, create/update/delete/restore standard rows, create/update/patch/delete/restore transfers, link two rows as a transfer, needs-review count                                                                 |
| `payees`     | `apps/api/src/modules/payees/service.ts`                                                                                                                                      | list, create, resolve many names at once for the import (`resolvePayeesByName`), update, archive and unarchive, learn default category                                                                                                       |
| `reports`    | `apps/api/src/modules/reports/service.ts`                                                                                                                                     | monthly totals, breakdown by group and by category, spending per currency and category for budgets (`categorySpending`), net worth, cash flow, converted totals                                                                              |
| `fx`         | `apps/api/src/modules/fx/service.ts`, `provider.ts`                                                                                                                           | manual rates list, upsert, soft delete and restore, rate lookup through providers (`getRates`: every currency in one query per provider), conversion                                                                                         |
| `rules`      | `apps/api/src/modules/rules/service.ts`                                                                                                                                       | list, create, update, reorder (one statement), soft delete and restore, match texts, apply to uncategorized rows (chunked updates)                                                                                                           |
| `templates`  | `apps/api/src/modules/templates/service.ts`                                                                                                                                   | list, create, update (full replace), reorder (one statement), soft delete and restore of transaction templates; `markTemplateUsed(tx, userId, templateId)` is called by the ledger when a transaction or transfer is created from a template |
| `imports`    | `apps/api/src/modules/import/service.ts` (DB access and factory), `preview.ts` (pure mapping, parsing and classification); the CSV parser is `packages/shared/src/lib/csv.ts` | CSV preview (classify rows), commit (one transaction, idempotent), transfer suggestions (one query)                                                                                                                                          |
| `budgets`    | `apps/api/src/modules/budgets/service.ts`                                                                                                                                     | monthly limits per category and currency with spent amounts, upsert (revives a deleted limit), soft delete and restore, copy previous month                                                                                                  |
| `auth`       | `apps/api/src/auth/service.ts`                                                                                                                                                | sign-up (with bootstrap), sign-in, profile, change password, operator password reset                                                                                                                                                         |
| `sessions`   | `apps/api/src/auth/sessions.ts`                                                                                                                                               | create, resolve and renew, list, revoke one, revoke others, revoke all, purge expired                                                                                                                                                        |

Seeding lives in `apps/api/src/modules/categories/seed.ts` with the taxonomy in `default-taxonomy.ts`.

## Conventions

- A service function takes `userId` first. Anything it touches is filtered by `user_id`; a foreign id resolves to a `ServiceError('… not found', 404)` rather than leaking existence.
- Writes that touch more than one row run inside `db.transaction(...)` and lock the rows they depend on (`FOR UPDATE` on the account, the transaction, or the transfer legs).
- Many rows are written with one set-based statement, never one query per row: `UPDATE … FROM (VALUES …)` for reorders and bulk updates, multi-row inserts with `ON CONFLICT` for the import. The helpers are in `apps/api/src/modules/batch.ts`: `positionedIds` (id and position pairs), `valueList` (an `IN (…)` list), `rowsOf` (rows of a raw statement), `assertDistinctIds`, `assertAllFound` and `WRITE_CHUNK_ROWS` (1,000 rows per statement, well under PostgreSQL's 65,535 bind parameters; split lists with `chunk` from `@coinkeeper/shared/lib/arrays`). Raw `UPDATE` statements set `updated_at = now()` themselves.
- Inside a transaction, never catch a database error and carry on: PostgreSQL rejects every later statement until the rollback. Avoid the error instead (`ON CONFLICT DO NOTHING`, a `NOT EXISTS` guard).
- A reorder takes the full ordered id list. A repeated id is a `400`; an id that is unknown, another user's or (for rules) deleted is a `404`, and nothing changes (the `UPDATE … RETURNING` count is checked inside the transaction).
- Services return plain data typed by the response contracts in `packages/shared/src/schema/` (`TransactionRow`, `AccountSummary`, …), never Drizzle query builders. The route's response schema strips anything else.
- Money arrives already parsed into minor units: routes turn amount strings into integers (`apps/api/src/routes/inputs.ts`) in the currency of the account, budget or rate.
- Reports are raw SQL through `db.execute` for readability; ledger and CRUD use the query builder.
- Correlated subqueries in a query with no joins must qualify columns explicitly (`"accounts"."id"`), because Drizzle renders unjoined columns unqualified.

## Database pool

`apps/api/src/db/index.ts` opens one node-postgres pool for the server and the CLI (`openRuntime` in `apps/api/src/environment.ts`). Every connection gets these session settings:

| Setting                               | Value                                       | Why                                                                                                                                          |
| ------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `statement_timeout`                   | `HANDLER_TIMEOUT_MS` − 1 s (at least 0.5 s) | PostgreSQL cancels a statement (SQLSTATE `57014`) just before the request itself times out, so a runaway query does not outlive its request. |
| `idle_in_transaction_session_timeout` | 30 s                                        | A connection left inside an open transaction is closed, releasing its locks.                                                                 |
| `application_name`                    | `coinkeeper-api`                            | Identifies the API's connections in `pg_stat_activity` and the server log.                                                                   |

Other limits: 10 connections, 10 s to connect, idle clients closed after 30 s. The migrator (`apps/api/src/cli/migrate.ts`, `npm run migrate:deploy`) opens the pool with `statementTimeoutMs: NO_STATEMENT_TIMEOUT`, so a long migration is not cut off; `npm run db:migrate` uses Drizzle Kit's own connection, which has no limit either.

An error on an idle client (the database restarted, a network drop) is logged and the process keeps running: the pool has already dropped the broken client. `server.ts` sends these errors to the Fastify logger (`Idle database client failed`); before the app exists, and in the CLI, they go to `console.error`. A database that stays unreachable shows up in the readiness check (`GET /api/v1/health/ready`), not as a crash.

## Errors

`ServiceError(message, status, code)` in `apps/api/src/modules/db.ts` is the only error type services throw on purpose. `status` defaults to `422` and `code` is derived from the status when omitted (`404` → `NOT_FOUND`, `409` → `CONFLICT`, `422` → `RULE_VIOLATION`, …). The helpers `notFound(what)` and `conflict(message, code?)` throw the common cases.

`apps/api/src/plugins/error-handler.ts` turns a `ServiceError`, a Zod validation error or a PostgreSQL unique or foreign-key violation (detected with `isUniqueViolation` and `isForeignKeyViolation` from `apps/api/src/modules/errors.ts`) into `{ error: { code, message, fields? } }`; anything else becomes a logged `500 INTERNAL`. The status table is in [API service › Errors](api.md#errors).

## Soft deletes

Transactions, transfers (both legs), accounts, rules, budgets and exchange rates are never removed. `remove` sets `deleted_at`, and every list, balance, report, budget and conversion query filters `deleted_at IS NULL`. `restore` clears it after checking the rules again:

- a transaction or transfer cannot come back while one of its accounts is deleted (`409`);
- a transaction whose category was archived in the meantime comes back uncategorised with `needs_review = true`;
- a bank row that was deleted and imported again cannot be restored a second time (`409`, the partial unique index on live import ids);
- an account can only be deleted while it has no live transactions; archive it otherwise;
- upserting a budget or an exchange rate with the same key revives the deleted row.

Categories, category groups and payees are archived instead, because history keeps pointing at them. The endpoints are listed in [API service › Soft deletes](api.md#soft-deletes).

## Bootstrap at sign-up

`auth.signUp` inserts the user and calls `ensureUserBootstrap(tx, userId)` inside the same database transaction, so a user never exists without settings and categories. `ensureUserBootstrap` returns immediately when `user_settings.seeded_version` is set, and otherwise, under a per-user advisory lock (`pg_advisory_xact_lock(hashtext(userId))`), inserts the settings row (primary currency EUR by default) and the default taxonomy, then sets `seeded_version`. `services.bootstrap(userId)` exposes it for tests and scripts.

## Adding a service method

1. Add the function to the domain's `service.ts` (or the matching `ledger/` file), taking `userId` first, checking ownership and throwing `ServiceError`.
2. Return a type from `packages/shared/src/schema/<domain>.ts`; add the schema there if it is new.
3. Cover it in `apps/api/src/modules/services.test.ts` (PGlite) with at least one ownership test.
4. Expose it over HTTP as described in [API service › Adding an endpoint](api.md#adding-an-endpoint) and add the row to the [REST API reference](../reference/rest-api.md).
