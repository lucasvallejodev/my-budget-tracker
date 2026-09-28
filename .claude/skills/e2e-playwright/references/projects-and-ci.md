# Projects, CI, images and flaky tests

> Summary: how to add a mobile viewport project and extend the axe accessibility and CSP specs in CoinKeeper's Playwright setup, how to run the suite against the built Docker images, what the end-to-end CI job does, and the policy for flaky tests.

## Setup to check first

Read `playwright.config.ts` and `.github/workflows/playwright.yml` before changing them. The baseline this skill assumes: specs `ledger.spec.ts`, `accessibility.spec.ts` and `content-security-policy.spec.ts` sharing `e2e/fixtures.ts`; one `chromium` project (`devices['Desktop Chrome']`), `testDir: './e2e'`, `fullyParallel`, `forbidOnly` and `retries: 2` and `workers: 1` in CI, HTML plus GitHub reporters in CI, `trace: 'on-first-retry'`, and two `webServer` entries (`npm run dev:api` waiting for `ApiHealthUrl`, readiness at `/api/v1/health/ready`, with the raised auth limit in `env`; `npm run dev:web` waiting for `/sign-in`). `.github/workflows/playwright.yml` (with `permissions: contents: read`, actions pinned to commit SHAs and `persist-credentials: false`) starts a digest-pinned `postgres:17-alpine` service, runs `npm ci`, `npm run db:migrate`, `npm run db:check` (the live schema matches the migrations), `npx playwright install --with-deps chromium`, `npm run test:e2e`, and uploads `playwright-report/` (which embeds the traces) for 30 days. Keep that hardening when editing the job; it belongs to the `container-hardening` skill.

## Mobile viewport project (when adding it)

- Use a Chromium-based device so CI keeps installing only Chromium: `{ name: 'mobile', use: { ...devices['Pixel 7'] } }`. iPhone descriptors run WebKit and need `npx playwright install --with-deps webkit` in the workflow.
- Do not run the whole suite twice: every extra test is another sign-up against the auth rate limit (`fixtures.md`). Tag the journeys that matter on small screens, `test('…', { tag: '@mobile' }, async …)`, and give the mobile project `grep: /@mobile/`; give the desktop project nothing, so it still runs everything.
- On small screens the sidebar is replaced by the header's "Open navigation" button; open it, then use `getByRole('navigation', { name: 'Main navigation' })`. Assert that key actions stay reachable (menus, dialogs fit the viewport), not pixel layout.

## Accessibility checks with axe

`@axe-core/playwright` is a root dev dependency. `e2e/accessibility.spec.ts` signs up, seeds an account with `seedAccountWithExpense`, then visits the eight screens in `MainScreens` (dashboard, transactions, review, import, analytics, budgets, accounts, settings) in both `ColorSchemes` (light and dark, through `test.use({ colorScheme })`). On each it waits for the level-1 heading, runs `new AxeBuilder({ page }).withTags(WcagTags).analyze()` with the WCAG 2.0, 2.1 and 2.2 A and AA tags, and collects violations per screen path, so one failing run lists every screen at once: `expect(violationsByScreen).toEqual({})`.

To cover a new screen, add `{ heading, path }` to `MainScreens`. To cover a state (an open dialog, a form after a failed submit, the mobile navigation), add a test in the same file that reaches the state and scans it the same way.

- Wait for the real content before `analyze()`; scanning a loading placeholder proves nothing.
- Seed data first so tables and charts render; an empty screen hides most violations.
- `exclude(...)` a region only for a third-party widget we cannot fix, and name the reason in the test title. Never disable a rule globally to get green.
- axe finds only part of WCAG failures. Keyboard flow, focus order and wording need the `ui-review` skill.

## Content-Security-Policy checks

`e2e/content-security-policy.spec.ts` asserts the page headers on `/sign-in` (enforced `Content-Security-Policy: frame-ancestors 'none'`, and a `Content-Security-Policy-Report-Only` policy with `default-src 'self'` and `object-src 'none'`) and visits the main screens as a signed-in user, collecting console messages that contain "Content Security Policy"; the list must stay empty. The policy itself is owned by the api-security-review skill (`csp-headers.md`). When a screen is added, add its path to `ScreenPaths`; when the policy moves to enforcement, switch the header the first test reads.

## Against the built images (when adding it)

The suite runs against development servers. Running it once against the production images catches build-only problems (the Next.js standalone output, the `/api` rewrite baked in at build time with `API_URL`, production cookies, the one-shot `migrate` service, the read-only containers). The `stack` job in `.github/workflows/docker.yml` already starts the images with `docker compose --profile app up -d --build --wait` and checks `/sign-in` with `curl`, a backup and restore and a clean `SIGTERM` stop; it does not run Playwright.

- Start the stack: `docker compose --profile app up -d --build --wait`, with `POSTGRES_PASSWORD` set in `.env` or the job's environment. The web container answers on `127.0.0.1:3000`; the API is not published to the host.
- The compose API keeps `AUTH_ATTEMPTS_PER_MINUTE` at 10 unless the environment sets it; the raised limit in `playwright.config.ts` only reaches the API Playwright starts. Set `AUTH_ATTEMPTS_PER_MINUTE` (for example to 200) for the image run.
- Compose defaults `COOKIE_SECURE` to `true`, so the session cookie is `__Host-ck_session` with `Secure`; Chromium accepts it on `http://localhost`, but not on another plain-HTTP host name.
- The `webServer` entries wait for `ApiHealthUrl` (`http://127.0.0.1:4000/api/v1/health/ready`), which the compose stack does not expose, so Playwright would start a development API next to the containers. Add an explicit switch (for example an `E2E_TARGET` variable whose `images` value sets `webServer` to `undefined`) instead of relying on `reuseExistingServer`.
- Wait until `http://localhost:3000/sign-in` answers before starting the tests. Both images have a `HEALTHCHECK` (`api` on `/api/v1/health/live`, `web` on `/sign-in`), so `docker compose up --wait` returns once both are healthy.
- Use a separate compose project (`docker compose -p coinkeeper-e2e …`) or `docker compose down -v` afterwards: tests leave users in the database volume.
- In CI, add it as a separate job (build, start, test, upload the report, `docker compose logs` on failure). Container and workflow hardening (digests, pinned actions, `permissions:`) belong to the `container-hardening` skill.

## Flaky tests

`retries: 2` in CI turns a flaky test green silently. Policy:

1. Reproduce: `npx playwright test <file> --repeat-each=20 --workers=4 --trace on`. Read the trace of a failing run before changing code.
2. Fix the cause. The usual ones here:

   | Symptom                                              | Cause and fix                                                                                                  |
   | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
   | Setup fails with `429`                               | Auth rate limit; see `fixtures.md`.                                                                            |
   | Passes alone, fails in parallel                      | Shared user or shared data; give each test its own user.                                                       |
   | Fails near midnight or on the first of the month     | A seed or assertion built with the UTC day (`toIsoDate`) while the app uses the local day; use `localIsoDate`. |
   | Clicks before the list refetched                     | Missing `waitForResponse` or web-first assertion on the updated row.                                           |
   | Toast assertion misses                               | Asserted too late or after navigation; assert right after the action.                                          |
   | Strict-mode violation (locator matched two elements) | Scope to a landmark, dialog or row.                                                                            |

3. If it cannot be fixed now, mark it `test.fixme()` with a tracking issue named in the test title and list it in the pull request. Do not add per-test `retries`, longer timeouts or `waitForTimeout` to hide it.
4. When the suite is stable, set `failOnFlakyTests: !!process.env.CI` in `playwright.config.ts` so a test that passes only on retry fails the job, and keep the traces.
