# Users, data and fixtures

> Summary: how CoinKeeper end-to-end tests create a throwaway user and seed data through the API with the page's cookie, how to share that setup with `test.extend`, and how to stay under the per-IP sign-up and sign-in rate limit and the per-account failed sign-in limit as the suite grows.

## Throwaway users only

- Every test signs up its own user with a generated address (`e2e-${crypto.randomUUID()}@example.com`) and a fixed test password of 12 to 128 characters (the `newPasswordSchema` limits in `packages/shared/src/schema/auth.ts`). `e2e/fixtures.ts` exports it as `Password`.
- Never read credentials from the user, a `.env` file or a password manager, and never sign in to an account that existed before the test. If a journey needs "an existing user", create it in the same test.
- Users stay in the database after the run; point `DATABASE_URL` at a throwaway local database. Do not add cleanup that deletes users or financial rows through SQL: it would bypass the soft-delete rules the suite is meant to exercise.

## Sign up through the UI or the API

- Through the UI (`signUpThroughForm` in `e2e/fixtures.ts`: `/sign-up`, fields "Name", "Email", "Password" (`exact: true`), "Repeat the password", button "Create account", then the "Dashboard Overview" heading) when the sign-up form is part of the journey.
- Through the API otherwise (the `signedInPage` fixture): `POST /api/v1/auth/sign-up` with `{ email, name, password }` answers `201` and sets the session cookie. Called with `page.request`, the cookie lands in the page's browser context, so the next `page.goto` is signed in. It skips a page load and an argon2 hash on the UI path.

## Seeding data

`page.request` goes to `baseURL` (`http://localhost:3000`), through the Next.js `/api/*` rewrite, with the page's cookies. `e2e/fixtures.ts` holds the shared setup; import `test` and `expect` from it, never from `@playwright/test`, in every spec:

| Export                                   | What it does                                                                                                            |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `test`, `expect`                         | `base.extend` with the `signedInPage` fixture: a page whose context signed up a fresh user through `POST /auth/sign-up` |
| `apiPost(page, path, body)`              | `page.request.post('/api/v1' + path)` with `Origin: AppOrigin`; fails the test with the response body when not ok       |
| `signUpThroughForm(page, email)`         | the UI sign-up, ending on the "Dashboard Overview" heading                                                              |
| `seedAccountWithExpense(page, memo)`     | a EUR checking account and one 12.50 expense dated today                                                                |
| `uniqueEmail()`, `Password`, `AppOrigin` | the generated address, the shared test password, the web origin                                                         |

- A fixture callback's second parameter is named `runTest`, not `use`: `react-hooks/rules-of-hooks` treats a function called `use` as a React hook and fails lint.
- Add a helper to `fixtures.ts` when a second spec needs it; keep one-off setup inside the spec. Keep helpers small and named for what they do; no comments.
- Request bodies are the Zod input schemas in `packages/shared/src/schema/<domain>.ts` (for example the account body in the existing spec: `currency`, `name`, `openingBalance` as a string, `type`). Amounts are decimal strings, never numbers.
- Use `localIsoDate(new Date())` from `@coinkeeper/shared/lib/date-helpers` for "today" and `formatMoney(amountMinor, currency)` from `@coinkeeper/shared/lib/money` for expected amounts. The app treats dates as the user's local calendar day: the transaction dialog defaults to `localIsoDate`, and the screens open on `currentMonth()` (`localIsoMonth`) in `apps/web/src/components/finance/use-finance-data.ts`. Playwright's browser uses the machine's time zone, so seeds built with `localIsoDate` always land in the month on screen. Never seed or assert with `toIsoDate(new Date())` (the UTC day): near midnight it is a different day, and on the 1st a different month. To test a fixed moment, set `timezoneId` in the project's `use` and pin the clock with `page.clock`.
- Seed a second user in a second context (`browser.newContext()`) when the test is about isolation or sessions; a context's `request` has its own cookie jar.

## The auth rate limit

`/auth/sign-up` and `/auth/sign-in` each allow `AUTH_ATTEMPTS_PER_MINUTE` requests per minute per client IP (default 10, `apps/api/src/config.ts`), with a separate counter per route. Every test runs from the same machine, so the eleventh sign-up within a minute answers `429` and the test fails in setup, looking flaky.

How the suite stays under it:

1. `playwright.config.ts` raises the limit for the end-to-end API only: the API `webServer` entry's `env` sets `AUTH_ATTEMPTS_PER_MINUTE` to the named `E2E_AUTH_ATTEMPTS_PER_MINUTE` (200). CI starts that server itself, so the workflow needs no extra variable. Never change the default in `apps/api/src/config.ts` or `.env.example`.
2. Locally, `reuseExistingServer` reuses an API you started yourself with `npm run dev`, which keeps the default limit of 10; stop it before a full run or start it with the same variable. A `429` in setup on your machine usually means this.
3. Do not work around the limit by spoofing `X-Forwarded-For` or sharing one user across tests. With `TRUST_PROXY` at its default `false` the API ignores that header anyway (`auth.test.ts` proves it).

Failed sign-ins have a second, softer limit: `auth/sign-in-throttle.ts` counts wrong passwords per account (normalized email) and, after `SIGN_IN_FAILURES_PER_ACCOUNT` (default 5) failures, makes each further attempt wait for its slot (1 s growing to 5 s apart). `playwright.config.ts` does not raise it. It never locks the account: the right password still signs in, just late, and `429` ("Too many sign-in attempts for this account. Try again in a few seconds.") appears only when attempts pile up past a 15-second queue. In a browser test the symptom is a slow sign-in, which can push a web-first assertion past its timeout. Failures are forgotten 15 minutes after the last one, on an API restart (in memory) or on a successful sign-in. The per-IP limit locks no account either. A test that enters a wrong password on purpose uses its own throwaway user, so it never throttles another test's account; its attempts still count against the shared per-IP counter.

Rate-limit and throttle tests belong in the API route tests (`apps/api/src/routes/auth.test.ts` covers the per-minute limit, the per-account slowdown across addresses and the forged `X-Forwarded-For` case), not in the browser suite. To show the user-visible `429` message, fulfil a `429` response with `page.route` or write a component test of the auth form.
