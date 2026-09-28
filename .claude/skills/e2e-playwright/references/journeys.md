# Journeys worth an end-to-end test

> Summary: the CoinKeeper user journeys to cover in `e2e/`, the screen each one uses, how to seed it through the API, and the user-visible outcome to assert; plus what the existing specs already cover.

## Already covered

| Test                                                               | Asserts                                                                           |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| redirects signed-out visitors to sign-in and back after signing in | `/budgets` → `/sign-in?next=%2Fbudgets` → back to `/budgets` after signing in     |
| deletes a transaction, keeps it out of the list and restores it    | soft delete from `/transactions`, "Deleted items" at `/settings/deleted`, restore |
| refuses a write from another origin                                | `POST /api/v1/accounts` with `origin: https://evil.example` answers `403`         |

`e2e/accessibility.spec.ts` (axe on eight screens in both themes) and `e2e/content-security-policy.spec.ts` (headers and console violations) cover cross-cutting checks; see `projects-and-ci.md`.

## Journeys to add

Seed with `page.request` against the endpoints in `docs/reference/rest-api.md`; request bodies are the Zod schemas in `packages/shared/src/schema/<domain>.ts`. Assert what the user sees, not the API response alone.

| Journey                   | Screen                           | Seed through the API                       | Assert                                                                                                                                                                       |
| ------------------------- | -------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sign up and land          | `/sign-up`                       | none                                       | the dashboard heading "Dashboard Overview"; the seeded category groups exist on `/settings/categories`.                                                                      |
| Create an account         | `/accounts`                      | none                                       | the account appears with its opening balance formatted in its currency; a JPY account shows no decimals.                                                                     |
| Record income and expense | `/transactions`, `/`             | account (`POST /accounts`)                 | the row appears; the account balance changes by the signed amount; the dashboard totals follow.                                                                              |
| Transfer between accounts | `/transactions`                  | two accounts                               | both legs appear, each account's balance moves, the transfer does not appear in spending on `/analytics`.                                                                    |
| CSV import                | `/import`                        | account                                    | preview classifies rows; commit shows the inserted count; re-importing the same file inserts nothing; rows land in `/review`.                                                |
| Review queue              | `/review`                        | imported or uncategorized transactions     | categorising a row removes it from the queue; the dashboard notice ("N transactions need a category") updates or disappears.                                                 |
| Budget a month            | `/budgets`                       | account, expense transaction in a category | the budget shows spent versus planned for that category, per currency.                                                                                                       |
| Reports                   | `/analytics`                     | transactions in two currencies             | figures stay per currency; excluded rows and transfers are not counted.                                                                                                      |
| Rules                     | `/settings/rules`                | category                                   | a rule applies its category to a matching imported row.                                                                                                                      |
| Sessions                  | `/settings` (session list panel) | sign in from a second browser context      | revoking the other session signs that context out (its next navigation lands on `/sign-in`).                                                                                 |
| Change password           | `/settings` (password panel)     | sign in from a second browser context      | the old password stops working; the second context is signed out (every session is replaced); the current page stays signed in, because the API sets a fresh session cookie. |
| Archive a category        | `/settings/categories`           | category with transactions                 | the category disappears from pickers; its transactions stay and are flagged for review when archived without a move.                                                         |

Keep one journey per test. When a journey needs a second user (sessions, isolation), create a second browser context with `browser.newContext()` and sign it up separately.

## What not to test here

- Validation messages and status codes for every field: the API route tests (`apps/api/src/routes/*.test.ts`) and the component tests already cover them.
- Open-redirect variants of `?next=` (`//host`, `/\host`, absolute URLs): `safeNextPath` in `apps/web/src/lib/navigation.ts` is unit-tested in `navigation.test.ts`; the browser suite keeps only the one redirect journey above.
- Per-route authorization: `apps/api/src/routes/authorization.test.ts` checks every API operation for `401` and foreign ids; the browser suite keeps the one foreign-origin write above.
- Visual styling: Stylelint and component tests own it.
- The component gallery at `/test`.
