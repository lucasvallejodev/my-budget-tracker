---
name: e2e-playwright
description: Writes and stabilizes Playwright end-to-end tests for CoinKeeper's user journeys (sign-up, accounts, transactions, transfers, CSV import, budgets, reports, sessions, soft delete and restore) in e2e/. Covers a throwaway account per test and never real credentials, seeding through the API with the page's cookie, locator priority, web-first assertions, waiting on responses instead of timeouts, the auth rate limit, a mobile viewport project, axe accessibility checks, running the suite against the built Docker images, and the flaky-test policy. Use when adding or fixing an e2e or Playwright test, when a browser test is flaky or slow, when changing playwright.config.ts or the end-to-end CI job, or when asked to check a flow end to end in a real browser. Not for Vitest component or API route tests (see agents/conventions.md › Tests), hanging Vitest runs (use node-diagnostics), a manual accessibility or responsive review of a screen (use ui-review), or Dockerfile and compose changes (use container-hardening).
---

# End-to-end tests with Playwright

The Playwright suite in `e2e/` drives the real web app and the real API against a real PostgreSQL database. It is the only place where the cookie session, the Next.js `/api` rewrite, the origin check and the screens are tested together, so each test should cover a journey a user actually takes and assert what the user sees. This skill holds what a generic Playwright guide does not know about this repository: how users and data are created, which limits bite, and how the suite runs locally and in CI.

## Before you start

- [docs/architecture/testing.md](../../../docs/architecture/testing.md) › End to end: how the suite starts the servers, which database it uses, what `e2e/ledger.spec.ts` covers.
- `CLAUDE.md` › Known constraints: sign up a throwaway account (`/sign-up` or `POST /api/v1/auth/sign-up` with `Origin: http://localhost:3000`); never use or ask for the user's real credentials.
- [agents/conventions.md](../../../agents/conventions.md) › Tests and Naming. In `e2e/`, `local/no-comments` still applies; magic numbers and regex literals are allowed.
- `e2e/fixtures.ts`, `e2e/ledger.spec.ts` and `playwright.config.ts`: the house style to copy.

Facts that change the usual advice:

- **Setup**: `@playwright/test` 1.63, Chromium only, `fullyParallel`, `retries: 2` and `workers: 1` in CI, `trace: 'on-first-retry'`, `forbidOnly` in CI. `webServer` starts `npm run dev:api` (waits for `ApiHealthUrl`, readiness at `http://127.0.0.1:4000/api/v1/health/ready`, because the suite needs the database too) and `npm run dev:web` (waits for `/sign-in`), or reuses running servers outside CI. Specs import `test` and `expect` from `e2e/fixtures.ts`.
- **Database**: the one in `DATABASE_URL`, migrated beforehand. Tests leave their users behind, so run locally against a throwaway database.
- **Users**: one fresh `e2e-<uuid>@example.com` user per test. Never a shared or real account.
- **Auth rate limits**: `/auth/sign-up` and `/auth/sign-in` each allow `AUTH_ATTEMPTS_PER_MINUTE` requests per minute per IP, and every test comes from the same address. The API that Playwright starts runs with 200 (`E2E_AUTH_ATTEMPTS_PER_MINUTE` in `playwright.config.ts`); a dev API you started yourself and Playwright reuses keeps the default of 10 and answers `429` after ten sign-ups in a minute. Failed sign-ins also count per account: after `SIGN_IN_FAILURES_PER_ACCOUNT` (default 5, not raised for e2e) wrong passwords, attempts for that email are slowed 1 s growing to 5 s apart, never locked. See [references/fixtures.md](references/fixtures.md).
- **`page.request` shares the page's cookies**: after the page signs up, `page.request.post('/api/v1/…')` acts as that user through the same-origin `/api` rewrite. Seed data that way, not through the UI, unless the UI step is what the test is about.
- **Origin check**: writes with a foreign `Origin` answer `403 ORIGIN_NOT_ALLOWED`. Send `Origin: http://localhost:3000` on API writes so the test does not depend on the check's handling of a missing header.
- **Money and dates**: amounts go to the API as strings (`'12.50'`) and come back as minor units; dates are `YYYY-MM-DD`. Build expected text with `formatMoney` and `localIsoDate` (the user's local day, which the app uses; never `toIsoDate`, the UTC day) from `@coinkeeper/shared` (they resolve in specs) rather than hand-typed strings.

## Workflow

1. **Pick the journey and its visible outcome** from [references/journeys.md](references/journeys.md). One test per outcome; do not re-test API rules the Vitest route tests already cover.
2. **Arrange with fixtures**: a signed-up page, then data through `page.request` (accounts, transactions, budgets). Keep each test independent; no `test.describe.serial`, no data shared between tests.
3. **Act through the UI** with locators in this order: `getByRole` with a name, `getByLabel`, `getByText` for static copy, `getByTestId` only when there is no accessible name (and then consider fixing the accessibility gap). Never CSS or BEM classes; they are styling.
4. **Assert with web-first assertions** (`toBeVisible`, `toHaveText`, `toHaveURL`, `toHaveCount(0)`), and wait for a mutation with `page.waitForResponse` when the screen gives no visible signal. Never `page.waitForTimeout`, never `waitForLoadState('networkidle')`. Details: [references/locators-and-waits.md](references/locators-and-waits.md).
5. **Run the new test many times** before trusting it: `npx playwright test e2e/<file>.spec.ts --repeat-each=10`. Then the whole suite with `npm run test:e2e`.
6. **Debug with evidence**: `npx playwright test --ui`, `--trace on`, then `npx playwright show-trace test-results/<test>/trace.zip`. In CI, download the `playwright-report` artifact.
7. **When changing the config or CI** (mobile project, axe and CSP specs, built images, flaky policy), follow [references/projects-and-ci.md](references/projects-and-ci.md).

## References

| File                                                                 | Read it when                                                                                                                                                   |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [references/journeys.md](references/journeys.md)                     | Choosing what to test: the journeys, their screens, the API calls that seed them and what each should assert.                                                  |
| [references/fixtures.md](references/fixtures.md)                     | Creating users and data, the auth rate limit, sharing helpers between specs with `test.extend`.                                                                |
| [references/locators-and-waits.md](references/locators-and-waits.md) | Writing locators for Radix menus and dialogs, toasts, tables and money; replacing sleeps; waiting for responses.                                               |
| [references/projects-and-ci.md](references/projects-and-ci.md)       | Adding a mobile project, extending the axe or CSP specs, running against the built images, changing `.github/workflows/playwright.yml`, handling a flaky test. |
| [references/source.md](references/source.md)                         | Crediting upstream material.                                                                                                                                   |

## Verify

```bash
npx playwright test e2e/<file>.spec.ts --repeat-each=10
npm run test:e2e
npm run lint && npm run typecheck && npm test -- --run && npm run build
```

`npm run test:e2e` needs a migrated database in `DATABASE_URL` (`npm run db:up && npm run db:migrate`). Report the real `N passed` line; if the suite cannot run, say why instead of claiming it passed.

## Keep the docs true

Use [agents/docs-map.md](../../../agents/docs-map.md). New journeys, projects or commands update `docs/architecture/testing.md` › End to end; new scripts or prerequisites also update `README.md`. If nothing in the docs is affected, say so.
