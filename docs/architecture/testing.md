# Testing

> Summary: the kinds of tests and the Vitest projects (api, web, shared, tooling), how the API route and service tests run on PGlite without Docker, the authorization matrix and OpenAPI contract snapshot, coverage floors, how component tests mock `@/api/mutations`, the Playwright end-to-end suite against the real API and web app, and what to cover when adding a feature.

## Kinds of tests

| Kind                | Tool                             | Where                                                                                                                                                                              | Runs against                                                                                                                                                                                           |
| ------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pure unit           | Vitest                           | `packages/shared/src/lib/*.test.ts`, `apps/web/src/lib/*.test.ts`, `apps/web/src/api/client.test.ts`, `apps/api/src/modules/import/preview.test.ts`, `apps/api/src/config.test.ts` | nothing external                                                                                                                                                                                       |
| API routes          | Vitest + PGlite                  | `apps/api/src/routes/*.test.ts` (`auth`, `authorization`, `catalog`, `ledger`, `openapi`)                                                                                          | the whole Fastify app (`buildApp`) on an in-memory PostgreSQL, called with `app.inject`                                                                                                                |
| Service integration | Vitest + PGlite                  | `apps/api/src/modules/services.test.ts`                                                                                                                                            | the domain services on an in-memory PostgreSQL with `apps/api/drizzle/0000_init.sql` applied                                                                                                           |
| Component           | Vitest + Testing Library (jsdom) | `apps/web/src/components/<module>/<name>/<name>.test.tsx`, one per component folder                                                                                                | rendered React with a prefilled `QueryClient`; `@/api/mutations` mocked with `vi.mock`                                                                                                                 |
| Structure           | Vitest (node)                    | `apps/web/src/components/structure.test.ts`                                                                                                                                        | the component folder contract: files present, barrels complete, stylesheets named after their component, the `ui` catalogue in `docs/architecture/components.md`                                       |
| Theme               | Vitest (node)                    | `apps/web/src/styles/theme.test.ts`                                                                                                                                                | the SCSS theme compiles, emits the brand family and the font, every `var(--…)` used in the web app is defined by the theme or assigned locally, and `Colors` / `ChartStyle` hold only theme references |
| Lint rules          | Vitest                           | `scripts/eslint-rules/*.test.mjs`, `scripts/stylelint-rules/*.test.mjs`                                                                                                            | the local ESLint and Stylelint rules on sample code                                                                                                                                                    |
| End to end          | Playwright                       | `e2e/`                                                                                                                                                                             | a running app in a real browser                                                                                                                                                                        |

Run everything once with `npm test -- --run`. The root `vitest.config.mts` runs four projects:

| Project   | Config                              | Environment                                                                                                                     |
| --------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `api`     | `apps/api/vitest.config.mts`        | node                                                                                                                            |
| `web`     | `apps/web/vitest.config.mts`        | jsdom with `apps/web/vitest.setup.ts` (the structure and theme tests opt into node with a `// @vitest-environment node` pragma) |
| `shared`  | `packages/shared/vitest.config.mts` | node                                                                                                                            |
| `tooling` | inline in the root config           | node, `scripts/**/*.test.mjs`                                                                                                   |

Run one project with `npm test -- --run --project api`. Playwright is separate (`npm run test:e2e`) and excluded from Vitest.

## Coverage floors

`npm run test:coverage` runs every project with V8 coverage, writes `coverage/lcov.info` for SonarQube and fails when coverage drops below the floors in `coverage.thresholds` of the root `vitest.config.mts`. The quality workflow (`.github/workflows/quality.yml`, which also runs for pull requests from forks) and the SonarQube workflow (`.github/workflows/sonar.yml`) both run this command, so a pull request that lowers coverage fails. The floors sit one or two points below the coverage measured when they were set:

| Scope                        | Lines | Branches | Functions | Statements | Measured (lines / branches / functions / statements) |
| ---------------------------- | ----- | -------- | --------- | ---------- | ---------------------------------------------------- |
| All files                    | 85    | 74       | 76        | 84         | 87.0 / 75.9 / 78.4 / 85.8                            |
| `apps/api/src/**`            | 91    | 80       | 92        | 90         | 93.2 / 82.8 / 94.3 / 91.9                            |
| `apps/api/src/modules/**`    | 95    | 81       | 98        | 92         | 96.6 / 83.5 / 99.7 / 94.0                            |
| `apps/web/src/**`            | 76    | 65       | 64        | 74         | 77.4 / 67.0 / 65.7 / 75.9                            |
| `apps/web/src/lib/**`        | 98    | 98       | 98        | 98         | 100 / 100 / 100 / 100                                |
| `packages/shared/src/**`     | 98    | 95       | 99        | 98         | 99.7 / 96.8 / 100 / 99.7                             |
| `packages/shared/src/lib/**` | 99    | 95       | 100       | 99         | 99.4 / 96.8 / 100 / 99.5                             |

A file counts toward every scope whose glob matches it and toward "All files". When coverage rises, raise the floor in the same pull request; lower one only with a reason in the pull request description. The floors apply to the full run only: `--project` runs report no coverage totals.

## Test helpers in the API

- `apps/api/src/test/database.ts`: `createTestDatabase()` opens PGlite and applies every migration in `apps/api/drizzle/`; `insertUser(db, id)` adds a bare `users` row so service tests can own data.
- `apps/api/src/test/app.ts`: `createTestApp(env?)` builds the real app on PGlite with test configuration; `signUp(app, email, name?)` signs a user up and returns a client whose `request(method, path, body?)` sends that user's session cookie and an allowed `Origin`; `inject` and `sessionCookieOf` cover the cases that need raw requests (missing cookie, foreign origin).

Because the migration file is what gets applied, a schema change without a migration fails these tests immediately.

## API route tests

`apps/api/src/routes/*.test.ts` exercise the HTTP contract: status codes, error bodies, cookies and headers. `auth.test.ts` covers sign-up, sign-in, sign-out, the cookie attributes, the origin check, rate limiting, profile and password changes and session revocation. `ledger.test.ts` covers accounts, transactions and transfers (paging, search, soft delete and restore, restoring into an archived category); `catalog.test.ts` covers categories, payees, rules, budgets, exchange rates, reports, settings, health and CSV import. Every endpoint gets the happy path, a validation failure (`400`), another user's id (`404`) and the rule it enforces.

### Authorization matrix

`authorization.test.ts` reads the route inventory from the running app, so a new route is covered or fails the suite without anyone remembering to add a test:

- The inventory is the OpenAPI document (`app.swagger()`). A second check parses `app.printRoutes()` and requires the router and the document to list the same operations, so a route hidden from the document still fails.
- `PublicOperations` holds the only routes that answer without a session: `GET /health/live`, `GET /health/ready` and `POST /auth/sign-up`, `/auth/sign-in` and `/auth/sign-out`. Every other operation must answer `401` without a session cookie. Adding a public route means editing this list, and the reviewer should question that edit.
- `ForeignCases` lists every operation with a path parameter. User A seeds one of each resource, user B calls each operation with A's ids, and every call must answer `404`; A's lists are then compared with a copy taken before, so a handler that answered `404` but changed the row still fails. A new `{id}` route fails the "covers every operation" test until it gets a case, or an entry in `ForeignIdExemptions` with a reason that names the test covering it.
- `ForeignBodyCases` put A's ids inside B's bodies (`accountId`, `categoryId`, `payeeId`, `groupId`, `moveToId`, reorder lists, transfer links, import previews). Each must answer `404` and change nothing for either user. List filters (`accountId`, `categoryId`, `transactionIds`) must return nothing of A's.

### OpenAPI contract snapshot

`openapi.test.ts` snapshots the generated OpenAPI document: every path, method, parameter, request body and response schema. The error body shared by every `4XX` and `5XX` response is stored once as `ErrorResponse`, and a second test fails if any operation answers errors with a different schema. The snapshot lives in `apps/api/src/routes/__snapshots__/openapi.test.ts.snap` and is reviewed like code: a diff there is a contract change for the web client and any other caller.

When a change to the contract is intended, regenerate the snapshot and commit it with the change:

```bash
npx vitest --run apps/api/src/routes/openapi.test.ts -u
```

In CI a missing or different snapshot fails the run; Vitest never writes snapshots there.

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

jsdom lacks two browser APIs that cmdk (under `Combobox` and `Command`) calls: `apps/web/vitest.setup.ts`, loaded through `setupFiles`, stubs `ResizeObserver` and `Element.prototype.scrollIntoView` with no-ops. Add further browser stubs there rather than in each test. To drive a `Combobox` in a test, click its trigger button (named "<label>: <value>", such as `Category: Choose category`), change the search box (labelled `Search <label>`) and click the option text.

## End to end

Playwright runs against the real API and web app (`npm run test:e2e`). `playwright.config.ts` starts both through `webServer` (`npm run dev:api`, waiting for readiness at `/api/v1/health/ready`, and `npm run dev:web`, waiting for `/sign-in`), or reuses servers that are already running outside CI. The API it starts allows 200 sign-ups and sign-ins per minute (`AUTH_ATTEMPTS_PER_MINUTE` in the `webServer` env) because every test signs up from the same address; a reused local API keeps its own limit of 10. The database is the one in `DATABASE_URL`, migrated beforehand. Before the suite starts, `e2e/global-setup.ts` runs the demo seed (`apps/api/src/cli/seed-demo.ts`) so the [demo account](../getting-started/demo-account.md) exists with data up to today; it reads `.env` when present and generates a random `DEMO_USER_PASSWORD` when none is set, as in CI. Only Chromium runs.

Every test signs up a fresh user (`e2e-<uuid>@example.com`). `e2e/fixtures.ts` holds the shared setup: the `signedInPage` fixture (sign-up through the API, so the page carries the session cookie), `signUpThroughForm`, `apiPost` (sends the app's `Origin`) and `seedAccountWithExpense`. Import `test` and `expect` from it.

`e2e/ledger.spec.ts` covers:

- the route guard and `next` redirect: sign out, open `/budgets`, land on `/sign-in?next=%2Fbudgets`, sign in, return to `/budgets`;
- soft delete: create an account and a transaction through the API with the page's cookie, delete it from the transactions table, find it in Settings › Deleted items, restore it and see it back in the list;
- the origin check: a write with `Origin: https://evil.example` answers `403`.

`e2e/accessibility.spec.ts` seeds an account and a transaction, opens the ten main screens (Home, transactions, review, import, analytics, budgets, upcoming, accounts, settings, transaction templates) in the app's one light theme, waits for each level-one heading and for animations to finish, and runs `@axe-core/playwright` with the WCAG 2.0, 2.1 and 2.2 A and AA tags on each. Any violation fails the test with the screen path, the rule id and the elements. axe finds only part of the WCAG failures; keyboard flow, focus order and wording still need a manual review.

`e2e/demo-account.spec.ts` signs in as the demo user through the form and checks that Home shows the review notice and the seeded accounts.

`e2e/content-security-policy.spec.ts` checks that pages send the enforced and the report-only policy, and that the main screens log no Content Security Policy violation in the browser console ([Security headers](security-headers.md)).

Tests leave their users in the database; use a throwaway local database. In CI (`.github/workflows/playwright.yml`) a PostgreSQL service container is migrated with `npm run db:migrate` before the run.

## What to cover for a new feature

1. Every service rule, including one ownership case and one rollback or conflict case.
2. Every new endpoint in a route test: happy path, `400`, `404` for another user's id.
3. Parsing or formatting helpers as pure unit tests.
4. The main interaction of the screen (open dialog, submit, mutation called with the right arguments).
5. If the feature touches money, at least one case in a zero-decimal currency (JPY) or a three-decimal one (KWD).
6. A new route gets a case in `authorization.test.ts` (the suite fails until it does) and a regenerated OpenAPI snapshot.

## Money helpers

`packages/shared/src/lib/money.test.ts` checks the parse and format helpers with example cases and with table-driven round trips, without a property-testing library: every amount from 0 to 20 major units in JPY, EUR and KWD parses back exactly in each sign and separator style; edge and seeded pseudo-random amounts up to `Number.MAX_SAFE_INTEGER` survive `minorToDecimalString` then `parseAmountInput`; amounts that drift as floats (`0.29`, `4.35`, `1.005` KWD) parse to exact integers; and `formatMoney` output reads back exactly below 10^15 minor units.
