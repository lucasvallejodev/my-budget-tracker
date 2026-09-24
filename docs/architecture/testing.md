# Testing

> Summary: the kinds of tests and the Vitest projects (api, web, shared, tooling), how the API route and service tests run on PGlite without Docker, how component tests mock `@/api/mutations`, and what to cover when adding a feature.

## Kinds of tests

| Kind                | Tool                             | Where                                                                                                                                                                              | Runs against                                                                                                                                                     |
| ------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pure unit           | Vitest                           | `packages/shared/src/lib/*.test.ts`, `apps/web/src/lib/*.test.ts`, `apps/web/src/api/client.test.ts`, `apps/api/src/modules/import/preview.test.ts`, `apps/api/src/config.test.ts` | nothing external                                                                                                                                                 |
| API routes          | Vitest + PGlite                  | `apps/api/src/routes/*.test.ts` (`auth`, `catalog`, `ledger`)                                                                                                                      | the whole Fastify app (`buildApp`) on an in-memory PostgreSQL, called with `app.inject`                                                                          |
| Service integration | Vitest + PGlite                  | `apps/api/src/modules/services.test.ts`                                                                                                                                            | the domain services on an in-memory PostgreSQL with `apps/api/drizzle/0000_init.sql` applied                                                                     |
| Component           | Vitest + Testing Library (jsdom) | `apps/web/src/components/<module>/<name>/<name>.test.tsx`, one per component folder                                                                                                | rendered React with a prefilled `QueryClient`; `@/api/mutations` mocked with `vi.mock`                                                                           |
| Structure           | Vitest (node)                    | `apps/web/src/components/structure.test.ts`                                                                                                                                        | the component folder contract: files present, barrels complete, stylesheets named after their component, the `ui` catalogue in `docs/architecture/components.md` |
| Lint rules          | Vitest                           | `scripts/eslint-rules/*.test.mjs`, `scripts/stylelint-rules/*.test.mjs`                                                                                                            | the local ESLint and Stylelint rules on sample code                                                                                                              |
| End to end          | Playwright                       | `e2e/`                                                                                                                                                                             | a running app in a real browser                                                                                                                                  |

Run everything once with `npm test -- --run`. The root `vitest.config.mts` runs four projects:

| Project   | Config                              | Environment                                                                           |
| --------- | ----------------------------------- | ------------------------------------------------------------------------------------- |
| `api`     | `apps/api/vitest.config.mts`        | node                                                                                  |
| `web`     | `apps/web/vitest.config.mts`        | jsdom (the structure test opts into node with a `// @vitest-environment node` pragma) |
| `shared`  | `packages/shared/vitest.config.mts` | node                                                                                  |
| `tooling` | inline in the root config           | node, `scripts/**/*.test.mjs`                                                         |

Run one project with `npm test -- --run --project api`. Playwright is separate (`npm run test:e2e`) and excluded from Vitest.

## Test helpers in the API

- `apps/api/src/test/database.ts`: `createTestDatabase()` opens PGlite and applies every migration in `apps/api/drizzle/`; `insertUser(db, id)` adds a bare `users` row so service tests can own data.
- `apps/api/src/test/app.ts`: `createTestApp(env?)` builds the real app on PGlite with test configuration; `signUp(app, email, name?)` signs a user up and returns a client whose `request(method, path, body?)` sends that user's session cookie and an allowed `Origin`; `inject` and `sessionCookieOf` cover the cases that need raw requests (missing cookie, foreign origin).

Because the migration file is what gets applied, a schema change without a migration fails these tests immediately.

## API route tests

`apps/api/src/routes/*.test.ts` exercise the HTTP contract: status codes, error bodies, cookies and headers. `auth.test.ts` covers sign-up, sign-in, sign-out, the cookie attributes, the origin check, rate limiting, profile and password changes and session revocation. `ledger.test.ts` covers accounts, transactions and transfers (paging, search, soft delete and restore, restoring into an archived category); `catalog.test.ts` covers categories, payees, rules, budgets, exchange rates, reports, settings, health and CSV import. Every endpoint gets the happy path, a validation failure (`400`), another user's id (`404`) and the rule it enforces.

## Service tests

`services.test.ts` migrates a fresh PGlite database once, truncates every table before each test and inserts two users with `insertUser` (`user_owner`, `user_other`) before bootstrapping them. Tests assert:

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

## Component tests

Render inside `QueryClientProvider`, prefill the cache with `client.setQueryData(QueryKeys.categories…, tree)` (keys from `use-finance-data.ts`) and mock the write functions with `vi.mock('@/api/mutations', () => ({ archiveCategory: vi.fn(async () => undefined) }))` to assert calls. Query by accessible role and name (`getByRole('button', { name: 'Archive Groceries' })`) so the tests survive styling changes. `apps/web/src/api/client.test.ts` covers the client itself with a stubbed `fetch`.

## End to end

Playwright runs against a real app (`npm run test:e2e`). Because authentication is local, a test can create its own user through the sign-up page or with `POST /api/v1/auth/sign-up` and keep the cookie. `e2e/` currently holds only the Playwright example spec.

## What to cover for a new feature

1. Every service rule, including one ownership case and one rollback or conflict case.
2. Every new endpoint in a route test: happy path, `400`, `404` for another user's id.
3. Parsing or formatting helpers as pure unit tests.
4. The main interaction of the screen (open dialog, submit, mutation called with the right arguments).
5. If the feature touches money, at least one case in a zero-decimal currency (JPY) or a three-decimal one (KWD).
