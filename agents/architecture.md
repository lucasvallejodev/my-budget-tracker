# Architecture (agent version)

> Summary: the shortest accurate description of how CoinKeeper is built: layers, request flow, service catalogue, invariants and the files that enforce them.

## Stack

Next.js 16 App Router · React 19 · TanStack Query · Drizzle ORM 0.45 on PostgreSQL 17 · Clerk auth · Zod 4 · SCSS modules · Radix primitives · Recharts · lucide-react (curated registry) · Vitest + PGlite + Testing Library · Playwright (e2e).

## Layers and flow

```
Browser (React Query hooks in src/components/finance/use-finance-data.ts)
  reads  → route handlers  src/app/api/**/route.ts        wrapped by handle() in src/server/http.ts
  writes → server actions  src/app/(main)/actions.ts      parse with Zod (src/schema/*), call service, revalidatePath('/')
            both call requireUser() → Clerk userId + ensureUserBootstrap (settings + default categories, once)
Services  src/server/<domain>/service.ts   business rules + SQL, receive a Db handle, throw ServiceError
Schema    src/db/schema.ts                 Drizzle tables/enums; migrations in drizzle/*.sql
```

`src/server/services.ts` → `createServices(db)` returns `{ accounts, categories, ledger, payees, reports, fx, rules, imports, budgets, bootstrap, listCurrencies, getSettings, updateSettings }`. `getServices()` memoises for the app; tests call `createServices(pgliteDb)`.

## Core rules (do not break)

1. Money = `amount_minor` (bigint, signed: negative out, positive in) + `currency` (char(3)). Parse with `parseAmountInput`, format with `formatMoney`, never floats. Forms send amount **strings**.
2. Balances, net worth, reports and budgets are SQL over `transactions`. Never add cached balance columns.
3. `kind`: `standard` counts for reports (unless `excluded` or account `counts_in_spending = false`); `transfer` and `opening` count only for balances. DB CHECKs: non-standard rows have no category; `transfer_id` iff `kind='transfer'`.
4. A transfer is exactly two live legs, opposite signs, different accounts, same `transfer_id`, no category or payee. Create/edit/delete both together (`ledger.createTransfer/updateTransfer/remove`).
5. Currency lives on the account (locked once it has transactions) and is copied onto each transaction. Never sum across currencies; group by currency. Conversion only via `fx` and only for the optional converted totals.
6. Categories: `category_groups` own colour + kind; `categories` own icon (name must exist in `src/components/icons/registry.ts`). Archive, never hard-delete; `archiveCategory(id, moveToId?)` moves rows or flags them `needs_review`.
7. Uncategorised = `category_id IS NULL` + `needs_review = true`. No "Uncategorized" category row.
8. Every query filters by `user_id`; foreign ids → `ServiceError('X not found', 404)`. Every multi-row write is one `db.transaction` with row locks.
9. Drizzle renders unjoined columns unqualified: inside correlated subqueries write `"accounts"."id"` explicitly.

## Service catalogue

| Service | Key functions |
| --- | --- |
| accounts | `list` (balances via subquery), `get`, `create` (opening balance row), `update` (currency lock), `archive`, `remove`, `owned` |
| categories | `tree`, `createGroup/updateGroup/archiveGroup/reorderGroups`, `createCategory/updateCategory/reorderCategories/archiveCategory/restoreCategory` |
| ledger | `list` (joins + filters), `get`, `createStandard`, `updateStandard`, `remove`, `setStatus`, `createTransfer`, `updateTransfer`, `linkAsTransfer`, `needsReviewCount` |
| payees | `list`, `create`, `findOrCreate`, `update`, `archive`, `learnDefaultCategory` (2 of last 3) |
| reports | `monthlyTotals`, `breakdownByGroup`, `breakdownByCategory`, `netWorth`, `cashFlow`, `convertedTotals` |
| fx | `list`, `upsert`, `remove`, `getRate` (direct then inverse, via `RateProvider[]`), `convert` |
| rules | `list`, `create`, `remove`, `match`, `applyToUncategorized` |
| imports | `preview` (classify: new/matched/duplicate/invalid, suggest category), `commit`, `transferSuggestions` |
| budgets | `list` (with spent), `upsert`, `remove`, `copyFromPreviousMonth` |

## Bootstrap

`ensureUserBootstrap` (`src/server/categories/seed.ts`): returns early when `user_settings.seeded_version` is set; otherwise, under `pg_advisory_xact_lock(hashtext(userId))`, inserts settings (primary currency EUR by default) and the taxonomy from `default-taxonomy.ts`, then sets `seeded_version`.

## Frontend essentials

- Pages are thin; screens live in `src/components/finance/`. Shared dialogs/pickers in `src/app/(main)/_components/`.
- Hooks + query keys in `use-finance-data.ts`; after mutations invalidate every key in `FINANCE_KEYS`.
- Types for API rows are `import type`d from the services.
- Styling: SCSS modules per component, tokens in `src/styles/tokens.scss`, `cn()` from `src/lib/styles.ts`. Group colour applied inline.
- Define components at module scope (React Compiler lint forbids components created inside render); avoid `setState` inside `useEffect`.

## Diagrams

`docs/assets/diagrams/*.svg` (architecture, data model, money flow, transaction lifecycle). Editable HTML sources in `docs/legacy/diagrams/`.
