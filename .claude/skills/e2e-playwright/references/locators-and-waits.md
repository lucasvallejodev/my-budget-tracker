# Locators, assertions and waits

> Summary: locator priority for CoinKeeper's screens (Radix menus, dialogs, selects and tabs, cmdk, sonner toasts, tables, money), web-first assertions, and the replacements for sleeps and network-idle waits.

## Locator priority

1. `getByRole(role, { name })`: buttons, links, headings, dialogs, menu items, tabs, rows. Our components give icon buttons accessible names (`'Account menu'`, `'Open navigation'`, `'Search transactions'`, `'Actions for Coffee beans'`), so almost everything has one.
2. `getByLabel(label)`: form fields; pass `{ exact: true }` when one label contains another (`'Password'` and `'Repeat the password'`).
3. `getByText(text)`: static copy and toasts.
4. `getByTestId(id)`: only when nothing above works. Check for existing `data-testid` attributes before adding one; adding one is a sign the element lacks an accessible name, which is worth fixing in the component instead.

Never select by CSS or BEM class, tag structure or `nth-child`: classes are styling and change with it.

Scope before disambiguating: the account menu exists twice (sidebar and header), which is why `e2e/ledger.spec.ts` uses `.last()`. Prefer scoping to a landmark or container (`page.getByRole('navigation', { name: 'Main navigation' })`, `page.getByRole('dialog')`, a table row found by its text) over `.first()`, `.last()` or `.nth()`.

## Our widgets

| Widget                              | How to drive it                                                                                                                                                  |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Radix dropdown menu                 | Click the trigger by name, then `getByRole('menuitem', { name })`.                                                                                               |
| Radix dialog and confirmations      | `page.getByRole('dialog')` then the button inside it (`getByRole('dialog').getByRole('button', { name: 'Delete' })`), so the page's own "Delete" is not matched. |
| Radix select                        | `getByRole('combobox', { name })`, click, then `getByRole('option', { name })`.                                                                                  |
| Radix tabs                          | `getByRole('tab', { name })`, assert `toHaveAttribute('aria-selected', 'true')` or the panel content.                                                            |
| cmdk command list, react-day-picker | Type into the input by label or role, pick `getByRole('option', { name })`; for dates prefer typing into the field over clicking calendar cells.                 |
| sonner toasts                       | `await expect(page.getByText('Transaction deleted')).toBeVisible()`; toasts disappear, so assert right after the action and do not assert their absence later.   |
| Loading states                      | Our loading placeholders use `role="status"` (`'Loading categories…'`); wait for the content you need instead of for the placeholder to vanish.                  |
| Recharts charts                     | Assert the figures in text or tables near the chart, not SVG internals.                                                                                          |

## Money and dates in assertions

- Build expected amounts with `formatMoney(amountMinor, currency)` from `@coinkeeper/shared/lib/money`, the formatter the screens use, instead of typing `'€12.50'`. Include a zero-decimal (JPY) or three-decimal (KWD) case when the journey is about money.
- Sign matters: spending is negative in the ledger and shown as a positive spent figure in reports; assert what the screen shows, not the stored sign.

## Web-first assertions

Use assertions that retry until the timeout: `toBeVisible`, `toBeHidden`, `toHaveText`, `toContainText`, `toHaveValue`, `toHaveURL`, `toHaveCount`, `toHaveAttribute`. `toHaveCount(0)` is the way to assert that a row left a list.

Do not read state and assert on it once (`expect(await locator.textContent()).toBe(…)`, `expect(await locator.isVisible()).toBe(true)`): that races the render.

For values that come from the API rather than the DOM, poll: `await expect.poll(async () => (await page.request.get('/api/v1/…')).status()).toBe(200)`.

## Waiting without sleeping

| Instead of                                | Use                                                                                                                                                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `page.waitForTimeout(…)`                  | A web-first assertion on the outcome.                                                                                                                                                                              |
| `waitForLoadState('networkidle')`         | An assertion on the element you need; TanStack Query refetches on focus, so the network is rarely idle.                                                                                                            |
| Clicking and hoping the mutation finished | `const saved = page.waitForResponse(response => response.url().includes('/api/v1/transactions') && response.request().method() === 'POST');` before the click, then `await saved` and assert `(await saved).ok()`. |
| Navigating right after a write            | Assert the toast or the updated row first, then navigate.                                                                                                                                                          |
| Retrying a flaky step with a loop         | Find why it is flaky (see `projects-and-ci.md` › Flaky tests).                                                                                                                                                     |

Start `waitForResponse` before the action that triggers the request, or the response can arrive before the wait begins.
