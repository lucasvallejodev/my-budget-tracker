# Testing

> Summary: the three kinds of tests, how the database tests run without Docker, and what to cover when adding a feature.

## Kinds of tests

| Kind | Tool | Where | Runs against |
| --- | --- | --- | --- |
| Pure unit | Vitest | `packages/shared/src/lib/*.test.ts`, `apps/web/src/lib/*.test.ts`, `apps/web/src/server/import/preview.test.ts` | nothing external |
| Service integration | Vitest + PGlite | `apps/web/src/server/services.test.ts` | an in-memory PostgreSQL with every migration in `apps/web/drizzle/` applied |
| Component | Vitest + Testing Library (jsdom) | `apps/web/src/components/<module>/<name>/<name>.test.tsx`, one per component folder | rendered React with a prefilled `QueryClient`; server actions mocked with `vi.mock` |
| Structure | Vitest (node) | `apps/web/src/components/structure.test.ts` | the component folder contract: files present, barrels complete, stylesheets named after their component |
| Lint rules | Vitest | `scripts/eslint-rules/*.test.mjs`, `scripts/stylelint-rules/*.test.mjs` | the local ESLint and Stylelint rules on sample code |
| End to end | Playwright | `e2e/` | a running app in a real browser |

Run everything once with `npm test -- --run`. The root `vitest.config.mts` runs three projects: `web` (`apps/web/vitest.config.mts`, jsdom by default; database and structure tests opt into node with a `// @vitest-environment node` pragma), `shared` (`packages/shared/vitest.config.mts`, node) and `tooling` (the lint-rule tests in `scripts/`). Run one project with `npm test -- --run --project web`. Playwright is separate (`npm run test:e2e`) and excluded from Vitest.

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
