# Domain services

> Summary: the domain services in `apps/api/src/modules/`: how they are wired, the conventions they follow, `ServiceError`, soft deletes, the per-user bootstrap at sign-up and how to add a service method. HTTP routes, sessions and error responses are in the API service page.

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

| Service      | File                                                                                                                                                                          | Responsibilities                                                                                                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `accounts`   | `apps/api/src/modules/accounts/service.ts`                                                                                                                                    | list with computed balances, create (with optional opening balance), update (currency lock), archive and unarchive, soft delete (only without live transactions), restore, `owned()` guard |
| `categories` | `apps/api/src/modules/categories/service.ts`                                                                                                                                  | tree with transaction counts, groups and categories CRUD, reorder, archive with move-or-review, unarchive                                                                                  |
| `ledger`     | `apps/api/src/modules/ledger/` (`service.ts` composes `queries.ts`, `standard.ts`, `transfers.ts`, `guards.ts`, `types.ts`)                                                   | paged list with joins and filters, create/update/delete/restore standard rows, create/update/patch/delete/restore transfers, link two rows as a transfer, needs-review count               |
| `payees`     | `apps/api/src/modules/payees/service.ts`                                                                                                                                      | list, create, find-or-create (import), update, archive and unarchive, learn default category                                                                                               |
| `reports`    | `apps/api/src/modules/reports/service.ts`                                                                                                                                     | monthly totals, breakdown by group and by category, net worth, cash flow, converted totals                                                                                                 |
| `fx`         | `apps/api/src/modules/fx/service.ts`, `provider.ts`                                                                                                                           | manual rates list, upsert, soft delete and restore, rate lookup through providers, conversion                                                                                              |
| `rules`      | `apps/api/src/modules/rules/service.ts`                                                                                                                                       | list, create, update, reorder, soft delete and restore, match texts, apply to uncategorised rows                                                                                           |
| `imports`    | `apps/api/src/modules/import/service.ts` (DB access and factory), `preview.ts` (pure mapping, parsing and classification); the CSV parser is `packages/shared/src/lib/csv.ts` | CSV preview (classify rows), commit, transfer suggestions                                                                                                                                  |
| `budgets`    | `apps/api/src/modules/budgets/service.ts`                                                                                                                                     | monthly limits per category and currency with spent amounts, upsert (revives a deleted limit), soft delete and restore, copy previous month                                                |
| `auth`       | `apps/api/src/auth/service.ts`                                                                                                                                                | sign-up (with bootstrap), sign-in, profile, change password, operator password reset                                                                                                       |
| `sessions`   | `apps/api/src/auth/sessions.ts`                                                                                                                                               | create, resolve and renew, list, revoke one, revoke others, revoke all, purge expired                                                                                                      |

Seeding lives in `apps/api/src/modules/categories/seed.ts` with the taxonomy in `default-taxonomy.ts`.

## Conventions

- A service function takes `userId` first. Anything it touches is filtered by `user_id`; a foreign id resolves to a `ServiceError('… not found', 404)` rather than leaking existence.
- Writes that touch more than one row run inside `db.transaction(...)` and lock the rows they depend on (`FOR UPDATE` on the account, the transaction, or the transfer legs).
- Services return plain data typed by the response contracts in `packages/shared/src/schema/` (`TransactionRow`, `AccountSummary`, …), never Drizzle query builders. The route's response schema strips anything else.
- Money arrives already parsed into minor units: routes turn amount strings into integers (`apps/api/src/routes/inputs.ts`) in the currency of the account, budget or rate.
- Reports are raw SQL through `db.execute` for readability; ledger and CRUD use the query builder.
- Correlated subqueries in a query with no joins must qualify columns explicitly (`"accounts"."id"`), because Drizzle renders unjoined columns unqualified.

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
