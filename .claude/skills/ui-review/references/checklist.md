> Summary: the review checklist for a CoinKeeper screen or component, grouped by area, with the WCAG 2.2 AA criterion behind each item, what already exists in the codebase so it is not re-flagged, and the house-style fix to propose.

# Review checklist

- [Semantics and names](#semantics-and-names)
- [Forms](#forms)
- [Keyboard and focus](#keyboard-and-focus)
- [Status messages and loading](#status-messages-and-loading)
- [Color and contrast](#color-and-contrast)
- [Motion](#motion)
- [Money, numbers and dates](#money-numbers-and-dates)
- [Destructive actions](#destructive-actions)
- [Content and copy](#content-and-copy)
- [Translating generic advice](#translating-generic-advice)

## Semantics and names

- **1.3.1 Info and Relationships, 4.1.2 Name, Role, Value.** Actions are `Button` (from `@/components/ui`), navigation is a link (`next/link` or `<a>`). Flag `div`/`span` with `onClick`, `router.push` in an `onClick` where a link fits (no Cmd-click, no middle-click), and `role="button"` on non-buttons.
- Icon-only buttons (`size="icon"`) need `aria-label`; decorative icons next to text need no label. `Spinner` already renders `role="img"` with a label.
- Headings form an outline: one `h1` per page (`PageHeading`), no skipped levels inside panels. `EmptyState` renders an `h3`; check it sits under an `h2`.
- Landmarks and the skip link exist in `shell/application-shell` (`application-shell__skip-link` to `#main-content`); a screen must not add a second `main`.
- Tables of data use `ui/table` with header cells; lists use list semantics (`ListRow` inside a list). `Table` requires a `label`: its wrapper is a `role="region"` with that `aria-label` and `tabIndex={0}`, so keyboard users can scroll a wide table (axe `scrollable-region-focusable`) and see a focus ring. Flag a label that does not name the data ("Table", "Data") and a hand-written `<table>` or scroll wrapper that bypasses it.
- Charts (`cash-flow-chart`, `analytics/analytics-charts.tsx`, `accounts-overview/net-worth-trend.tsx`) need a text alternative: a visible legend with values (as `analytics-cash-flow__legend` does) or a table (as the Cash flow page's month-by-month table), not only the SVG.
- **2.5.3 Label in Name.** A visible label and the accessible name start with the same words (`aria-label="Delete"` on a button showing "Remove" fails).

## Forms

- **1.3.1, 3.3.2 Labels or Instructions.** Every control has a label. `Field` renders a `<label>` by default, and `TextField` / `AmountField` / `DateField` in `ui/form-fields` wire label, input and error; flag hand-written inputs that bypass them. Placeholders never replace labels.
- Groups of radios or checkboxes sit in `fieldset` + `legend` (`settings-panels.tsx` does this for delivery channels). `ColorPicker` uses `role="radiogroup"` with a label; custom groups need the same.
- **3.3.1 Error Identification, 3.3.3 Error Suggestion.** Errors appear next to the field, say how to fix it, and are announced: `ui/form` renders the message with `role="alert"` and an id to reference with `aria-describedby`. Server errors come from `ApiError.message` (safe to show) in a `Notice role="alert"`, as `auth-form` does.
- **1.3.5 Identify Input Purpose.** Sign-in, sign-up and profile fields carry `autoComplete` (`email`, `current-password`, `new-password`, `name`) and the right `type`.
- **3.3.8 Accessible Authentication (Minimum).** Never block paste or password managers on auth fields.
- Amount inputs are text with `inputMode="decimal"` (house rule), never `type="number"` (it rounds, scrolls on wheel, and rejects `1,50`).
- Submit stays enabled until the request starts, then shows pending (`isPending`) and blocks double submission. After a failed submit, focus moves to the first invalid field (React Hook Form `shouldFocusError` is on by default; do not disable it).
- **3.3.7 Redundant Entry.** Multi-step flows (import wizard) keep what the user already entered when going back.

## Keyboard and focus

- **2.1.1 Keyboard, 2.1.2 No Keyboard Trap.** Everything clickable is reachable and operable by keyboard; Escape closes dialogs, popovers and menus. Radix primitives (`Dialog`, `Popover`, `Menu`, `Select`, `Tabs`, `Switch`) provide this: flag code that wraps them in extra click handlers or stops key events.
- **2.4.3 Focus Order.** Opening a dialog moves focus into it; closing returns it to the control that opened it. Radix does this for a `DialogTrigger`; dialogs opened from state (`open={editing}`, as in `account-detail` and `budget-overview`) must be checked at runtime, and fixed with `onCloseAutoFocus` and a ref when focus lands on `body`. After deleting a row, focus goes somewhere sensible (next row or the list heading), not to `body`.
- **2.4.7 Focus Visible.** `globals.scss` draws a 3 px ring on `:focus-visible` and removes it for mouse focus. Components style focus with `&:focus-visible { @include focus-ring; }`. Flag any other `outline: none` / `outline: 0`; the only sanctioned ones are in `app/globals.scss` and `styles/abstracts/_mixins.scss`.
- **2.4.11 Focus Not Obscured (Minimum).** Sticky headers, toasts (`sonner`, bottom right) and floating panels must not hide the focused control; add `scroll-margin` on the block when a sticky header exists.
- **1.4.13 Content on Hover or Focus.** Popovers and tooltips are dismissible with Escape, hoverable, and stay until dismissed.
- **2.5.7 Dragging Movements.** Any drag interaction (for example to reorder categories) needs a non-drag alternative such as move up/down buttons.

## Status messages and loading

- **4.1.3 Status Messages.** Results that appear without a focus change are announced: toasts via `sonner` (already a live region), loading via `QueryContent` (`role="status"`), counts and page changes via `aria-live="polite"` (`Pagination`, `MonthPicker` do this). Flag a new async result (import summary, "3 entries categorized") that only changes visually.
- Loading, error and empty states all exist: `QueryContent` with `loading`, `errorTitle` + `onRetry`, `empty`. Flag a screen that renders nothing or a broken table for an empty list.
- Loading copy ends with `…` ("Loading accounts…").

## Color and contrast

Colours are in `apps/web/src/styles/theme/_colors.scss` (one light theme, emitted as `--color-*` by `tokens.scss`); check each pair on white (`--color-surface`, cards) and on the canvas (`--color-canvas`, page background).

- **1.4.3 Contrast (Minimum).** Text 4.5:1, large text (24 px, or 18.66 px bold) 3:1. Known tight pairs: `--color-text-muted` is 4.97:1 on white and 4.64:1 on the canvas, so muted text must not get lighter; `--color-text-faint` is 2.58:1 on white and is only for placeholders and decoration, never for text a user must read.
- **1.4.11 Non-text Contrast.** Control boundaries and focus indicators 3:1 against the background. `--color-border` on white is about 1.2:1 and `--color-border-strong` (the `control` border of the `text-field` mixin) about 1.5:1, so an input whose only boundary is its border should be flagged unless another cue (fill, label position) identifies it.
- **1.4.1 Use of Color.** Color is never the only signal. Signed amounts use `<Amount signed />`, which adds a `+`/`−` sign through `signDisplay: 'exceptZero'` besides the tone; budget progress needs text ("120.00 € of 400.00 € · 30%", "12.00 € over", a status label), not just a red bar; chart series need labels or a legend with values. Category group colors are user data and carry no meaning on their own.
- Fixes use theme variables (`var(--color-text)`, `var(--color-negative)`, or `color(text)`) or `Colors`/`ChartStyle` from `apps/web/src/styles/theme.ts`, never literals (Stylelint and ESLint reject them).

## Motion

- `globals.scss` switches off CSS animations and transitions under `prefers-reduced-motion: reduce`. That rule does not reach JavaScript animation. The installed Recharts defaults `isAnimationActive` to `'auto'`, which honors the preference, so flag only charts that force `isAnimationActive` to `true`, and any other script-driven motion (`requestAnimationFrame`, animation libraries, auto-scrolling) that ignores it.
- Animate only `transform` and `opacity`; never `transition: all` (list the properties).
- Anything that moves for more than five seconds (carousels, auto-advancing banners) needs pause (2.2.2 Pause, Stop, Hide).

## Money, numbers and dates

- Amounts render only through `<Amount />` or `formatMoney` / `formatMajorAmount` from `@coinkeeper/shared/lib/money`. Flag `/ 100`, `toFixed`, `Intl.NumberFormat` in a component, or a currency symbol concatenated by hand: they break JPY (0 decimals) and KWD (3 decimals).
- Never show a sum across currencies; totals are per currency or explicitly converted (`showConvertedTotals`) and labeled as converted.
- Liabilities keep the ledger sign and flip only for display (`flipSign` on `Amount`).
- Money columns align: suggest `font-variant-numeric: tabular-nums` in the block that renders the column when it does not set it.
- Dates come from `YYYY-MM-DD` strings; display them with a date helper or `toLocaleDateString` with an explicit `timeZone: 'UTC'` (as `monthLabel` does) so a date never shifts by a day.

## Destructive actions

- **3.3.4 Error Prevention (Legal, Financial, Data).** Financial data is soft-deleted and restorable (Settings › Deleted items), which satisfies "reversible". The success toast should say it can be restored. Flag a destructive action whose result is not reversible and not confirmed (revoking a session, archiving a category that moves transactions) when it has no confirmation dialog.
- Destructive buttons use `variant="destructive"` and a specific label ("Delete transaction", not "OK").

## Content and copy

- Sentence case for headings, buttons and labels ("Add account", not "Add Account"). Flag Title Case in existing copy too, not only in the diff.
- Specific labels: the button says what happens ("Save budget"), errors say what to do next.
- `…` not `...`; numerals for counts ("3 accounts").
- Long names (payees, account names, memos) do not break layout: the element uses the `truncate` mixin with the full text available (title or wrapping on a detail view), and flex children that truncate have `min-width: 0` in their block.
- Brand and code tokens that must not be auto-translated (`CoinKeeper`, currency codes in tables) may carry `translate="no"`.

## Translating generic advice

Generic guidelines assume Tailwind or ad-hoc CSS. Propose fixes in our terms:

| Generic advice                                      | Here                                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------- |
| `focus-visible:ring-*`, custom outline              | `&:focus-visible { @include focus-ring; }` in the block                         |
| `truncate`, `line-clamp`, `min-w-0`                 | `@include truncate;` and `min-width: 0` on the block element                    |
| `sm:` / `md:` / `lg:` classes, `@media (max-width)` | Mobile-first base styles plus `@include media-up(tablet-landscape) { … }`       |
| Utility class or inline `style`                     | A BEM element or modifier in the component's own `.scss`                        |
| Hex color, `text-red-600`                           | A theme colour (`var(--color-negative)`), or a new one in `theme/_colors.scss`  |
| `Intl.NumberFormat` for currency                    | `<Amount />` or `formatMoney`                                                   |
| Native `<select>` styling                           | `PillSelect` / `Select` from `@/components/ui` (native `<select>` is not used)  |
| Title Case headings and buttons                     | Sentence case                                                                   |
| URL state via a new library                         | Only where filters are already in the URL; no new dependency without a decision |
| "Undo or confirm before delete"                     | Soft delete + restore already provides undo for financial data                  |
