> Summary: rendering rules for prerendered client components: explicit conditionals with integer money (`rendering-conditional-render`), stored look preferences without a flash (`rendering-hydration-no-flicker`), client-only values through `useHydrated()` (`rendering-hydration-suppress-warning`), `content-visibility` for long tables, `<Activity>` for toggled panels, and hoisting static JSX.

# Rendering

Pages under `apps/web/src/app/` are Server Components that render one client screen, and Next prerenders that screen to HTML. Client components therefore run twice: once to produce HTML without `window` or `localStorage`, once in the browser to hydrate. Anything that differs between the two (a stored preference, the current date, the locale) needs one of the rules below.

## rendering-conditional-render

Amounts are integers in minor units, so `0` is a normal value. `{value && <X />}` renders the text `0` when the value is zero (and `NaN` renders too). Compare explicitly or use a ternary. Do not chain ternaries (house rule): use `QueryContent` for loading, error and empty, or a small `if` helper for more than two branches.

Avoid:

```tsx
{
  budget.spentMinor && <Amount amountMinor={budget.spentMinor} currency={budget.currency} />;
}
{
  transactions.length && <TransactionTable transactions={transactions} />;
}
```

Prefer:

```tsx
{
  budget.spentMinor !== 0 ? (
    <Amount amountMinor={budget.spentMinor} currency={budget.currency} />
  ) : null;
}
{
  transactions.length > 0 ? <TransactionTable transactions={transactions} /> : null;
}
```

`&&` stays fine for real booleans (`{isLiability && …}`, `{editing && …}`).

## rendering-hydration-no-flicker

The app has one light theme and stores no look preference today. If you add one (a density, a theme), it must be applied before the first paint, or the prerendered default shows first and then flips. A `useEffect` that sets a `data-*` attribute on `<html>` runs after hydration, so the user sees the default flash.

Avoid (the prerendered HTML has the default; the effect fixes it after paint):

```tsx
useEffect(() => {
  document.documentElement.dataset.density = storedDensity();
}, []);
```

Prefer: a tiny synchronous script in `apps/web/src/app/layout.tsx` that sets the attribute on `<html>` before the body renders, built from the same constants as the helper that reads the preference, plus `suppressHydrationWarning` on `<html>` because the attribute legitimately differs from the server HTML.

```tsx
const DensityBootScript = `(() => {
  try {
    document.documentElement.dataset.density =
      localStorage.getItem('${DensityStorageKey}') ?? '${DefaultDensity}';
  } catch {
    document.documentElement.dataset.density = '${DefaultDensity}';
  }
})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: DensityBootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- The script repeats the helper that resolves the preference in `apps/web/src/lib/`; keep both in step and cover them with the same test cases.
- The script is one more inline script for the page Content-Security-Policy. The static policy in `next.config.ts` (report-only, `script-src 'self' 'unsafe-inline'`) already allows it; the policy is owned by the api-security-review skill (`csp-headers.md`). Do not add a `sha256-…` hash to `script-src`: a hash makes browsers ignore `'unsafe-inline'` and blocks the Next.js inline scripts. Run `e2e/content-security-policy.spec.ts` after adding the script.

## rendering-hydration-suppress-warning

A value that only exists in the browser (a cached query, `window`, storage) goes through `useHydrated()` from `apps/web/src/lib/hydration.ts`: the first client render matches the server HTML, the next one shows the real value. Use `suppressHydrationWarning` only on the one element whose text legitimately differs (a clock, a relative date) and never to silence a real bug.

Avoid:

```tsx
<Text as="span">Last active {new Date(session.lastUsedAt).toLocaleString()}</Text>
```

Prefer:

```tsx
const hydrated = useHydrated();

<Text as="span">
  Last active {hydrated ? new Date(session.lastUsedAt).toLocaleString() : null}
</Text>;
```

Watch for values computed at prerender time: `currentMonth()` in `use-finance-data.ts` reads the clock, so a screen prerendered in one month and opened in the next starts from the old month until it re-renders.

## rendering-content-visibility

For long lists and tables, `content-visibility: auto` lets the browser skip layout and paint for off-screen rows. Rows belong to the `table` block (`ui/table`, whose `Table` requires a `label` and renders a focusable `role="region"` scroll container), so add it there as a modifier of that block, inside `@layer ui`, with a named intrinsic size; a feature stylesheet must not style `.table__row`.

```scss
@use 'abstracts' as *;

$long-table-row-height: 56px;

@layer ui {
  .table {
    &--long &__row {
      content-visibility: auto;
      contain-intrinsic-size: auto $long-table-row-height;
    }
  }
}
```

Expose it as a prop mapped through the component's `…ClassNames` table. Pagination (`Pagination`) is still the first answer for very long lists.

## rendering-activity

React 19.2 `<Activity mode="visible" | "hidden">` hides a subtree without unmounting it, so a panel that toggles often keeps its state (form input, scroll, fetched chart) and its effects pause while hidden. Use it for tab panels or side panels that users switch back and forth; do not use it to keep large hidden trees alive forever.

```tsx
import { Activity } from 'react';

<Activity mode={isOpen ? 'visible' : 'hidden'}>
  <CategoryBreakdown month={month} />
</Activity>;
```

## rendering-hoist-jsx

Compiler. Static JSX that never depends on props can live at module scope (PascalCase name) so it is not recreated every render. Usually the better answer is an existing `ui` component (`Spinner`, `EmptyState`), which is already a module-level function.

Avoid:

```tsx
function BudgetList({ budgets }: { budgets: BudgetRow[] }) {
  return budgets.length > 0 ? (
    <BudgetRows budgets={budgets} />
  ) : (
    <EmptyState title="No budgets yet" />
  );
}
```

Prefer:

```tsx
const NoBudgets = <EmptyState title="No budgets yet" />;

function BudgetList({ budgets }: { budgets: BudgetRow[] }) {
  return budgets.length > 0 ? <BudgetRows budgets={budgets} /> : NoBudgets;
}
```
