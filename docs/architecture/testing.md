# Testing

> Summary: the three kinds of tests, how the database tests run without Docker, and what to cover when adding a feature.

## Kinds of tests

| Kind | Tool | Where | Runs against |
| --- | --- | --- | --- |
| Pure unit | Vitest | `src/lib/*.test.ts`, `src/server/import/csv.test.ts`, `src/server/import/preview.test.ts` | nothing external |
| Service integration | Vitest + PGlite | `src/server/services.test.ts` | an in-memory PostgreSQL with every migration in `drizzle/` applied |
| Component | Vitest + Testing Library (jsdom) | `src/components/**/*.test.tsx` | rendered React with a prefilled `QueryClient`; server actions mocked with `vi.mock` |
| End to end | Playwright | `e2e/` | a running app in a real browser |

Run everything once with `npm test -- --run`. Playwright is separate (`npm run test:e2e`) and excluded from Vitest.

## Service tests

`services.test.ts` migrates a fresh PGlite database once, truncates every table before each test and bootstraps two users (`user_owner`, `user_other`). Tests assert:

- seeding is idempotent and every seeded icon exists in the registry;
- balances derive from the ledger, including opening balances, edits and deletes;
- ownership: foreign accounts, categories, payees, rules and budgets resolve to "not found";
- the credit-card cycle: purchases count as spending, the payment transfer does not, net worth is right, both legs edit and delete together;
- cross-currency transfers keep each leg in its own currency and reports stay per currency;
- refunds net against their category; excluded rows and non-spending accounts stay out of reports;
- payee default-category learning;
- transfers roll back when the second leg fails;
- manual exchange rates, inverse lookup and converted totals with missing currencies;
- CSV import: classification, deduplication, matching, rules, transfer suggestions and idempotent re-import;
- budgets per currency, copy from previous month.

Because the migration file is what gets applied, a schema change without a migration fails these tests immediately.

## Component tests

Render inside `QueryClientProvider`, prefill the cache with `client.setQueryData(['categories', true], tree)` and mock `@/app/(main)/actions` to assert calls. Query by accessible role and name (`getByRole('button', { name: 'Archive Groceries' })`) so the tests survive styling changes.

## What to cover for a new feature

1. Every service rule, including one ownership case and one rollback or conflict case.
2. Parsing or formatting helpers as pure unit tests.
3. The main interaction of the screen (open dialog, submit, action called with the right arguments).
4. If the feature touches money, at least one case in a zero-decimal currency (JPY) or a three-decimal one (KWD).
