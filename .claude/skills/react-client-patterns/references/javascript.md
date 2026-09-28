> Summary: the eight JavaScript rules worth applying in `apps/web` and `packages/shared`: never mutate shared arrays (`toSorted`), reuse `Intl` formatters, index maps and sets for lookups, early exits, `flatMap`, one-pass min/max, and regular expressions only in `Patterns`.

# JavaScript performance

These rules apply to components and to the helpers in `apps/web/src/lib/` and `packages/shared/src/lib/`. A helper you add there follows the `lib/` rules: `const name = (…): Type =>`, TSDoc on the export, a colocated test.

## js-tosorted-immutable

`.sort()`, `.reverse()` and `.splice()` mutate in place. Props and query data are shared: the array in a `useQuery` result is the cached object every other component reads. Use `toSorted`, `toReversed`, `toSpliced`, `with`.

Avoid:

```tsx
const sortedAccounts = useMemo(
  () => accounts.sort((left, right) => left.name.localeCompare(right.name)),
  [accounts]
);
```

Prefer:

```tsx
const sortedAccounts = useMemo(
  () => accounts.toSorted((left, right) => left.name.localeCompare(right.name)),
  [accounts]
);
```

`[...new Set(values)].sort(…)` on a fresh array is safe.

## js-cache-function-results

Creating an `Intl.NumberFormat` or `Intl.DateTimeFormat` is far slower than calling `format` on one, and a transaction table formats per cell. The money helpers already reuse theirs: `formatMoney` and `formatMajorAmount` in `packages/shared/src/lib/money.ts` get a formatter from `cachedFormatter`, a module-level `Formatters` map keyed by locale, currency code and sign option. `formatMoney` also formats the exact decimal string from `minorToDecimalString` (typed as `Intl.StringNumericLiteral`) instead of dividing minor units by a power of ten, so large amounts keep every digit. Keep both properties when touching those helpers; `money.test.ts` covers JPY, KWD and large values.

For the rest of the app:

- Money is shown only through `formatMoney` or the `Amount` component; never build a currency formatter in a component.
- Any other formatter (dates, percentages, rates) is created once: a module-level constant when its options are fixed, or a module-level `Map` keyed by everything that changes the output when they vary. The key space (locales × currencies × options) is small; never key a cache by unbounded user input.

Avoid (a new formatter per render and per row):

```tsx
export function RateCell({ rate }: { rate: number }) {
  return (
    <td>{new Intl.NumberFormat(undefined, { maximumFractionDigits: RATE_DIGITS }).format(rate)}</td>
  );
}
```

Prefer:

```tsx
const RateFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: RATE_DIGITS });

export function RateCell({ rate }: { rate: number }) {
  return <td>{RateFormat.format(rate)}</td>;
}
```

A formatter used in more than one place becomes a tested helper in `packages/shared/src/lib/` or `apps/web/src/lib/`, following the `cachedFormatter` shape.

## js-index-maps

Repeated `.find()` by id inside a loop is O(n × m). Build a `Map` once.

Avoid:

```ts
const rows = transactions.map(transaction => ({
  ...transaction,
  account: accounts.find(account => account.id === transaction.accountId),
}));
```

Prefer:

```ts
const accountsById = new Map(accounts.map(account => [account.id, account]));
const rows = transactions.map(transaction => ({
  ...transaction,
  account: accountsById.get(transaction.accountId),
}));
```

In a component, build the map in `useMemo` keyed on the list, or in the query's `select`.

## js-set-map-lookups

Repeated `.includes()` on an array is a linear scan each time. Use a `Set` for membership.

Avoid:

```ts
const selected = transactions.filter(transaction => selectedIds.includes(transaction.id));
```

Prefer:

```ts
const selectedIdSet = new Set(selectedIds);
const selected = transactions.filter(transaction => selectedIdSet.has(transaction.id));
```

## js-early-exit

Return as soon as the answer is known instead of finishing the loop and deciding at the end. Single-line guards without braces are the house style.

Avoid:

```ts
const firstInvalidRow = (rows: PreviewRow[]): string | null => {
  let message: string | null = null;

  for (const row of rows) {
    if (!row.date && !message) message = `Row ${row.index}: date is missing`;
    if (row.amountMinor === null && !message) message = `Row ${row.index}: amount is missing`;
  }

  return message;
};
```

Prefer:

```ts
const firstInvalidRow = (rows: PreviewRow[]): string | null => {
  for (const row of rows) {
    if (!row.date) return `Row ${row.index}: date is missing`;
    if (row.amountMinor === null) return `Row ${row.index}: amount is missing`;
  }

  return null;
};
```

## js-flatmap-filter

`.map(…).filter(Boolean)` walks twice and loses the type narrowing. `flatMap` maps and drops in one pass.

Avoid:

```ts
const payeeNames = transactions
  .map(transaction => (transaction.payeeName ? transaction.payeeName : null))
  .filter(Boolean);
```

Prefer:

```ts
const payeeNames = transactions.flatMap(transaction =>
  transaction.payeeName ? [transaction.payeeName] : []
);
```

## js-min-max-loop

Finding the smallest or largest item needs one pass, not a sort.

Avoid:

```ts
const latestTransaction = (transactions: TransactionRow[]): TransactionRow | undefined =>
  transactions.toSorted((left, right) => right.date.localeCompare(left.date))[0];
```

Prefer:

```ts
const latestTransaction = (transactions: TransactionRow[]): TransactionRow | undefined =>
  transactions.reduce<TransactionRow | undefined>(
    (latest, transaction) => (!latest || transaction.date > latest.date ? transaction : latest),
    undefined
  );
```

For plain numbers, `Math.max(...values)` is fine for short arrays; spreading a very large array can exceed the argument limit.

## js-hoist-regexp

In this repository regular expressions live only in `Patterns` (`packages/shared/src/lib/patterns.ts`); ESLint rejects them anywhere else. That also removes the per-render cost upstream warns about.

- Need a new pattern: add a named entry to `Patterns` (and an `is…` helper with TSDoc and a test if it is a check).
- Need a pattern built from user input (search highlighting): add an escape helper to `patterns.ts`, and build the `RegExp` in `useMemo` keyed on the input, never on every render.
- A pattern with the `g` flag keeps `lastIndex` between calls: `.test()` or `.exec()` on a shared global regex alternates between `true` and `false`. The global entries in `Patterns` (`amountSignWrapper`, `thousandsSeparator`, `whitespace`, `reactIdColon`) are only safe with `replace` or `replaceAll`.

Avoid:

```ts
const isMonth = (text: string): boolean => /^\d{4}-\d{2}$/.test(text);
```

Prefer:

```ts
import { isIsoMonth } from '@coinkeeper/shared/lib/patterns';

isIsoMonth(text);
```
