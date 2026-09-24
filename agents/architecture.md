# Architecture (agent version)

> Summary: the shortest accurate description of how CoinKeeper is built: workspaces (api, web, shared), request flow, the API service, service catalogue, invariants, bootstrap at sign-up and frontend essentials.

## Stack

npm workspaces. API: Fastify 5 · fastify-type-provider-zod · Drizzle ORM 0.45 on PostgreSQL 17 · self-hosted auth (argon2id, cookie sessions) · Zod 4. Web: Next.js 16 App Router (client only) · React 19 · TanStack Query · SCSS · Radix primitives · Recharts · lucide-react (curated registry). Shared: Zod contracts and helpers. Tests: Vitest + PGlite + Testing Library · Playwright (e2e).

## Layers and flow

```
packages/shared  @coinkeeper/shared: Zod request/response contracts (src/schema/*), money/patterns/date/csv helpers (src/lib), constants
apps/web         @coinkeeper/web: Next.js client, no server code, no database
  reads  → React Query hooks  src/components/finance/use-finance-data.ts  → apiGet/apiList/apiPages in src/api/client.ts
  writes → src/api/mutations.ts (one function per write) → apiRequest → then useRefreshFinance() invalidates FinanceKeys
  fetch('/api/v1/…', credentials: same-origin); 401 (not /auth/*) → window to /sign-in?next=…
  next.config.ts   rewrites /api/:path* → ${API_URL}/api/:path* (default http://127.0.0.1:4000, read at build), security headers
  src/proxy.ts     page guard: no ck_session / __Host-ck_session cookie → /sign-in?next=…  (validity is checked by the API)
apps/api         @coinkeeper/api: Fastify, owns the database
  plugins/   security (helmet, CORS allow-list, origin check on writes, rate limit) → authentication (cookie → sessions → request.auth)
  routes/    <resource>.ts: Zod schemas from @coinkeeper/shared, withErrors(), userIdOf(request), one service call; authenticated scope via requireSession
  modules/   <domain>/service.ts: business rules + SQL, receive a Db handle, throw ServiceError(message, status, code)
  auth/      passwords (argon2id), sessions (SHA-256 token hashes), service (sign-up with bootstrap, sign-in, profile, password)
  db/        schema.ts (Drizzle tables/enums); migrations in apps/api/drizzle/*.sql
```

`apps/api/src/modules/services.ts` → `createServices(db, { sessionDays })` returns `{ accounts, auth, bootstrap, budgets, categories, db, fx, getSettings, imports, ledger, listCurrencies, payees, reports, rules, sessions, updateSettings }`. `buildApp` decorates Fastify with it (`app.services`); tests call `createServices(pgliteDb)` or `createTestApp()`.

## Core rules (do not break)

1. Money = `amount_minor` (bigint, signed: negative out, positive in) + `currency` (char(3)). Parse with `parseAmountInput`, format with `formatMoney`, never floats. Forms send amount **strings**.
2. Balances, net worth, reports and budgets are SQL over `transactions`. Never add cached balance columns.
3. `kind`: `standard` counts for reports (unless `excluded` or account `counts_in_spending = false`); `transfer` and `opening` count only for balances. DB CHECKs: non-standard rows have no category; `transfer_id` iff `kind='transfer'`.
4. A transfer is exactly two live legs, opposite signs, different accounts, same `transfer_id`, no category or payee. Create/edit/delete/restore both together (`ledger.createTransfer/updateTransfer/removeTransfer/restoreTransfer`).
5. Currency lives on the account (locked once it has transactions) and is copied onto each transaction. Never sum across currencies; group by currency. Conversion only via `fx` and only for the optional converted totals.
6. Categories: `category_groups` own colour + kind; `categories` own icon (name must exist in `packages/shared/src/constants/icon-names.ts`). Archive, never hard-delete; `archiveCategory(id, moveToId?)` moves rows or flags them `needs_review`.
7. Uncategorised = `category_id IS NULL` + `needs_review = true`. No "Uncategorized" category row.
8. Every query filters by `user_id`; foreign ids → `ServiceError('X not found', 404)`. Every multi-row write is one `db.transaction` with row locks.
9. Drizzle renders unjoined columns unqualified: inside correlated subqueries write `"accounts"."id"` explicitly.
10. Soft delete, never hard-delete, financial data: `DELETE` sets `deleted_at` on transactions (both legs for transfers), accounts (only without live transactions), rules, budgets and exchange rates; every read, balance, report, budget and conversion filters `deleted_at IS NULL`; `POST …/restore` brings a row back after re-checking the rules (live account, active category, no re-imported duplicate). Categories, groups and payees are archived instead. Only sessions are hard-deleted.

## API service (`apps/api`)

Fastify 5 + `fastify-type-provider-zod`. `buildApp({ config, db })` (`src/app.ts`) registers the Zod compilers, `services` and `config` decorators, the error handler, security (helmet, CORS allow-list `CORS_ORIGINS`, `@fastify/rate-limit`, origin check on writes against `ALLOWED_ORIGINS`), authentication (cookie → `sessions` → `request.auth`), OpenAPI (`/api/docs`) and `routes/` under `/api/v1`. Every route except `/health` and `/auth/sign-up|sign-in|sign-out` sits in one scope with the `requireSession` hook. Handlers call `userIdOf(request)` and a service; request and response schemas come from `packages/shared/src/schema/`. Services throw `ServiceError(message, status, code)`; the handler answers `{ error: { code, message, fields? } }`. Users and sessions: `src/auth/` (argon2id, SHA-256 token hashes, 30-day sliding sessions, `__Host-ck_session` cookie `HttpOnly; SameSite=Lax; Secure` in production). Sign-up seeds settings and taxonomy in the same transaction. Full description: `docs/architecture/api.md`; endpoints: `docs/reference/rest-api.md`. Tests: `src/routes/*.test.ts` with `createTestApp()` / `signUp()` from `src/test/app.ts` on PGlite.

## Service catalogue

| Service    | Key functions                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| accounts   | `list` (balances via subquery; `deleted` option), `get`, `create` (opening balance row), `update` (currency lock), `archive`, `remove` (soft, only without live transactions), `restore`, `owned`                                                                                                                                                                                                                                                                       |
| categories | `tree`, `createGroup/updateGroup/archiveGroup/unarchiveGroup/reorderGroups`, `createCategory/updateCategory/reorderCategories/archiveCategory/unarchiveCategory`                                                                                                                                                                                                                                                                                                        |
| ledger     | `list`, `page` (cursor), `get`, `createStandard`, `updateStandard`, `remove`, `restore`, `getTransfer`, `createTransfer`, `updateTransfer`, `patchTransfer`, `removeTransfer`, `restoreTransfer`, `linkAsTransfer`, `needsReviewCount`. Split across `ledger/service.ts` (factory), `queries.ts` (list, filters, paging), `standard.ts` (standard rows, remove, restore), `transfers.ts` (paired legs), `guards.ts` (ownership, editability, amount checks), `types.ts` |
| payees     | `list`, `create`, `findOrCreate`, `update`, `archive`, `unarchive`, `learnDefaultCategory` (2 of last 3)                                                                                                                                                                                                                                                                                                                                                                |
| reports    | `monthlyTotals`, `breakdownByGroup`, `breakdownByCategory`, `netWorth`, `cashFlow`, `convertedTotals`                                                                                                                                                                                                                                                                                                                                                                   |
| fx         | `list`, `upsert` (revives a deleted key), `remove`, `restore`, `getRate` (direct then inverse, via `RateProvider[]`), `convert`                                                                                                                                                                                                                                                                                                                                         |
| rules      | `list`, `create`, `update`, `reorder`, `remove`, `restore`, `match`, `applyToUncategorized`                                                                                                                                                                                                                                                                                                                                                                             |
| imports    | `preview` (classify: new/matched/duplicate/invalid, suggest category), `commit`, `transferSuggestions`. `import/service.ts` holds the DB queries and the factory; the pure row helpers (`resolveColumns`, `parseRow`, `buildImportId`, `findMatch`, `classifyRow`) live in `import/preview.ts`, the CSV scanner in `packages/shared/src/lib/csv.ts`                                                                                                                     |
| budgets    | `list` (with spent), `upsert` (revives a deleted key), `remove`, `restore`, `copyFromPreviousMonth`                                                                                                                                                                                                                                                                                                                                                                     |
| auth       | `signUp` (user + bootstrap in one transaction), `signIn`, `get`, `updateProfile`, `changePassword` (revokes other sessions), `resetPassword` (CLI)                                                                                                                                                                                                                                                                                                                      |
| sessions   | `create`, `resolve` (sliding renewal), `list`, `revoke`, `revokeOthers`, `revokeAll`, `revokeToken`, `purgeExpired`                                                                                                                                                                                                                                                                                                                                                     |

## Bootstrap

At sign-up: `auth.signUp` inserts the user and calls `ensureUserBootstrap(tx, userId)` (`apps/api/src/modules/categories/seed.ts`) inside the same database transaction. It returns early when `user_settings.seeded_version` is set; otherwise, under `pg_advisory_xact_lock(hashtext(userId))`, inserts settings (primary currency EUR by default) and the taxonomy from `default-taxonomy.ts`, then sets `seeded_version`. Nothing bootstraps on later requests.

## Frontend essentials

- Pages are thin; screens live in `apps/web/src/components/finance/<screen>/`. Components are organised in three modules (`ui`, `finance`, `shell`), one folder per component, imported through barrels and depending in one direction, `shell → finance → ui` (`agents/components.md`). Dialogs and pickers are finance components too (`transaction-dialog/`, `account-picker/`, …); `apps/web/src/app/` holds only pages and layouts.
- Reads: hooks + `QueryKeys` in `use-finance-data.ts`, calling `@/api/client` (`apiGet`, `apiList`, `apiPages`; errors are `ApiError` with `status`, `code`, `fields`). Writes: functions in `@/api/mutations` (`deleteTransaction(row)` routes transfer legs to `/transfers/:transferId`), called through `useMutation`/`useEntityMutation`; after a write `useRefreshFinance()` invalidates every key in `FinanceKeys`. Component tests `vi.mock('@/api/mutations', …)` and seed with `client.setQueryData(QueryKeys.…)`.
- Auth UI: shell `AuthForm` on `(auth)/sign-in` and `sign-up` (`safeNextPath` keeps `next` local), shell `UserMenu` in sidebar and header, finance `ProfileForm`, `PasswordForm`, `SessionList` in Settings › Profile/Security, finance `DeletedItems` at `/settings/deleted`. `useHydrated()` (`apps/web/src/lib/hydration.ts`) guards data the shell may already have cached from causing hydration mismatches.
- Request and response contracts live in `packages/shared/src/schema/<domain>.ts`: input schemas (`…FormSchema`) and response schemas (`…Schema`) with inferred types (`AccountSummary`, `TransactionRow`, …). API services return those types and routes serialise through them; the client `import type`s them from `@coinkeeper/shared/schema/<domain>`. Enum value lists live in `packages/shared/src/schema/enums.ts` and feed `pgEnum`.
- Styling: one global `.scss` per component holding one BEM block, class names written as plain strings (`cn()` from `apps/web/src/lib/styles.ts` to combine); cascade layers `reset < ui.base < ui < feature`; mobile-first breakpoint mixins and helpers in `apps/web/src/styles/abstracts/`; colour tokens in `apps/web/src/styles/tokens.scss`. Group colour applied inline.
- Define components at module scope (React Compiler lint forbids components created inside render); avoid `setState` inside `useEffect`.

## Diagrams

`docs/assets/diagrams/*.svg` (architecture, data model, money flow, transaction lifecycle). Editable HTML sources in `docs/legacy/diagrams/`. `architecture.svg` predates the API split (it still shows Clerk and server actions) and is no longer linked; `docs/architecture/overview.md` uses Mermaid instead. `data-model-er.svg` does not show `users` and `sessions`.
