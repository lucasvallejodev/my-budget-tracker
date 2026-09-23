# Server layer

> Summary: the domain services, how they are wired, how errors travel to the client, and how authentication and per-user bootstrapping work.

## Wiring

`src/server/services.ts` builds every service on top of one Drizzle database handle:

```ts
const services = createServices(db);
services.accounts | categories | ledger | payees | reports | fx | rules | imports | budgets
services.bootstrap(userId) · listCurrencies() · getSettings(userId) · updateSettings(userId, patch)
```

`getServices()` memoises the instance for the app; tests call `createServices(pgliteDb)` directly.

## Services

| Service | File | Responsibilities |
| --- | --- | --- |
| `accounts` | `src/server/accounts/service.ts` | list with computed balances, create (with optional opening balance), update (currency lock), archive, delete, `owned()` guard |
| `categories` | `src/server/categories/service.ts` | tree with transaction counts, groups and categories CRUD, reorder, archive with move-or-review, restore |
| `ledger` | `src/server/ledger/` (`service.ts` composes `queries.ts`, `standard.ts`, `transfers.ts`, `guards.ts`, `types.ts`) | list with joins and filters, create/update/delete standard rows, create/update transfers, link two rows as a transfer, status changes, needs-review count |
| `payees` | `src/server/payees/service.ts` | list, create, find-or-create (import), update, archive, learn default category |
| `reports` | `src/server/reports/service.ts` | monthly totals, breakdown by group and by category, net worth, cash flow, converted totals |
| `fx` | `src/server/fx/service.ts` | manual rates CRUD, rate lookup through providers, conversion |
| `rules` | `src/server/rules/service.ts` | rules CRUD, match texts, apply to uncategorised rows |
| `imports` | `src/server/import/service.ts` (DB access and factory), `preview.ts` (pure mapping, parsing and classification), `csv.ts` (parser) | CSV preview (classify rows), commit, transfer suggestions |
| `budgets` | `src/server/budgets/service.ts` | monthly limits per category and currency, spent comparison, copy previous month |

Seeding lives in `src/server/categories/seed.ts` with the taxonomy in `default-taxonomy.ts`.

## Conventions

- A service function takes `userId` first. Anything it touches is filtered by `user_id`; a foreign id resolves to a `ServiceError('… not found', 404)` rather than leaking existence.
- Writes that touch more than one row run inside `db.transaction(...)` and lock the rows they depend on (`FOR UPDATE` on the account, the transaction, or the transfer legs).
- Services return plain data (rows or DTOs such as `TransactionRow`), never Drizzle query builders.
- Reports are raw SQL through `db.execute` for readability; ledger and CRUD use the query builder.
- Correlated subqueries in a query with no joins must qualify columns explicitly (`"accounts"."id"`), because Drizzle renders unjoined columns unqualified.

## Errors

`ServiceError(message, status)` in `src/server/db.ts` is the only error type services throw on purpose.

- Route handlers wrapped by `handle()` (`src/server/http.ts`) turn it into `{ error }` with that status; anything else becomes a 500 and is logged.
- Server actions in `src/app/(main)/actions.ts` run inside `run()`, which rethrows a `ServiceError` as a plain `Error` so React Query's `onError` can show `error.message` in a toast.
- Zod failures in actions surface the first issue message the same way.

## Authentication and bootstrap

`requireUser()` (`src/server/auth/require-user.ts`):

1. reads the Clerk session with `auth()` and redirects to `/sign-in` when absent;
2. calls `ensureUserBootstrap(db, userId)`, which returns immediately when `user_settings.seeded_version` is set, and otherwise inserts the settings row and the default taxonomy inside one transaction guarded by a per-user advisory lock;
3. returns `{ userId, services }`.

Route protection for pages happens earlier, in `src/middleware.ts` (`clerkMiddleware` with public `/sign-in` and `/sign-up`).

## Adding a service method

1. Add the function to the domain's `service.ts`, taking `userId` first and validating ownership.
2. If it mutates, add a server action in `actions.ts` that parses input with a Zod schema from `src/schema/` and calls it; if it reads, add or extend a route handler under `src/app/api/`.
3. Cover it in `src/server/services.test.ts` (PGlite) with at least one ownership test.
4. Document it in [API and server actions](../reference/api.md).
