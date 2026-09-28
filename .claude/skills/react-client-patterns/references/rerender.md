> Summary: the 14 re-render rules for React 19 client components without React Compiler: derive instead of syncing, functional updates, components at module scope, handlers over effects, transitions and deferred values for filters and month switches, primitive dependencies, lazy state, and when manual memoization is (and is not) worth it.

# Re-render optimization

- [rerender-no-inline-components](#rerender-no-inline-components)
- [rerender-derived-state-no-effect](#rerender-derived-state-no-effect)
- [rerender-functional-setstate](#rerender-functional-setstate)
- [rerender-move-effect-to-event](#rerender-move-effect-to-event)
- [rerender-use-deferred-value](#rerender-use-deferred-value)
- [rerender-transitions](#rerender-transitions)
- [rerender-defer-reads](#rerender-defer-reads)
- [rerender-dependencies](#rerender-dependencies)
- [rerender-derived-state](#rerender-derived-state)
- [rerender-lazy-state-init](#rerender-lazy-state-init)
- [rerender-memo](#rerender-memo)
- [rerender-memo-with-default-value](#rerender-memo-with-default-value)
- [rerender-simple-expression-in-memo](#rerender-simple-expression-in-memo)
- [rerender-split-combined-hooks](#rerender-split-combined-hooks)

React Compiler is off in `apps/web`. The rules marked "compiler" become unnecessary if `reactCompiler: true` is ever added to `apps/web/next.config.ts`; the others stay.

## rerender-no-inline-components

A component declared inside another is a new type on every render: React unmounts and remounts it, inputs lose focus, effects re-run. Already a house rule (React Hooks lint). Pass props to a module-level component instead; a helper used by one component is a private file in its folder.

Avoid:

```tsx
export function AccountCard({ account }: { account: AccountSummary }) {
  const Balance = () => <Amount amountMinor={account.balanceMinor} currency={account.currency} />;

  return (
    <Panel title={account.name}>
      <Balance />
    </Panel>
  );
}
```

Prefer:

```tsx
function AccountBalance({ account }: { account: AccountSummary }) {
  return <Amount amountMinor={account.balanceMinor} currency={account.currency} />;
}

export function AccountCard({ account }: { account: AccountSummary }) {
  return (
    <Panel title={account.name}>
      <AccountBalance account={account} />
    </Panel>
  );
}
```

## rerender-derived-state-no-effect

A value computable from props, state or query data is computed during render. Storing it in state and syncing it in an effect costs an extra render and drifts. Also a house rule: no synchronous `setState` in `useEffect`. To reset state when an entity changes, pass a `key`.

Avoid:

```tsx
const [remainingMinor, setRemainingMinor] = useState(0);

useEffect(() => {
  setRemainingMinor(budget.amountMinor - budget.spentMinor);
}, [budget.amountMinor, budget.spentMinor]);
```

Prefer:

```tsx
const remainingMinor = budget.amountMinor - budget.spentMinor;
```

## rerender-functional-setstate

When the next state depends on the previous one, use the updater form. It removes the state from callback dependencies and cannot read a stale value.

Avoid:

```tsx
const [selectedIds, setSelectedIds] = useState<string[]>([]);

const toggleSelected = useCallback(
  (id: string) =>
    setSelectedIds(
      selectedIds.includes(id)
        ? selectedIds.filter(selectedId => selectedId !== id)
        : [...selectedIds, id]
    ),
  [selectedIds]
);
```

Prefer:

```tsx
const [selectedIds, setSelectedIds] = useState<string[]>([]);

const toggleSelected = useCallback(
  (id: string) =>
    setSelectedIds(currentIds =>
      currentIds.includes(id)
        ? currentIds.filter(selectedId => selectedId !== id)
        : [...currentIds, id]
    ),
  []
);
```

Direct values are fine when the new state does not depend on the old one (`setSelectedIds([])`).

## rerender-move-effect-to-event

A side effect caused by a user action belongs in that action's handler. Modeling it as "set a flag, react in an effect" re-runs on unrelated changes and can fire twice. Writes go through `useEntityMutation` or `useMutation` from the handler.

Avoid:

```tsx
const [submitted, setSubmitted] = useState(false);

useEffect(() => {
  if (submitted) void applyRules().then(() => toast.success('Rules applied'));
}, [submitted]);

return <Button onClick={() => setSubmitted(true)}>Apply rules</Button>;
```

Prefer:

```tsx
const apply = useEntityMutation({
  mutationFn: applyRules,
  successMessage: result => `${result.updated} entries categorized`,
});

return (
  <Button disabled={apply.isPending} onClick={() => apply.mutate()}>
    Apply rules
  </Button>
);
```

## rerender-use-deferred-value

When typing drives expensive work (filtering hundreds of transactions, redrawing a chart), defer the derived value so the input stays responsive. `TransactionExplorer` filters every transaction on each keystroke and is the first candidate. Memoize the expensive computation on the deferred value, otherwise it still runs every render. Show staleness with a BEM modifier, never an inline style.

Avoid:

```tsx
const [search, setSearch] = useState('');
const filtered = transactions.filter(transaction => matchesSearch(transaction, search));
```

Prefer:

```tsx
const [search, setSearch] = useState('');
const deferredSearch = useDeferredValue(search);
const filtered = useMemo(
  () => transactions.filter(transaction => matchesSearch(transaction, deferredSearch)),
  [transactions, deferredSearch]
);
const isStale = search !== deferredSearch;

return (
  <div
    className={cn('transaction-explorer__results', {
      'transaction-explorer__results--stale': isStale,
    })}
  >
    <TransactionTable transactions={filtered} />
  </div>
);
```

## rerender-transitions

Updates that are not urgent (switching month, applying a filter that re-renders a large table or chart) go in `startTransition`, so clicks and typing are handled first. The update must be a state update; regular `setState` outside a transition is urgent.

```tsx
const [month, setMonth] = useState(currentMonth());
const [isSwitching, startSwitching] = useTransition();

<MonthPicker month={month} onChange={nextMonth => startSwitching(() => setMonth(nextMonth))} />;
```

Combine with `placeholderData: keepPreviousData` on the month-keyed query ([data-fetching.md](data-fetching.md)) so the old month stays visible while the new one loads.

## rerender-defer-reads

Do not subscribe to changing state that you only read inside a handler. `useSearchParams()` re-renders the component on every query-string change; read `window.location` in the handler instead.

Avoid:

```tsx
const searchParams = useSearchParams();
const exportCurrentView = () => exportTransactions(rows, searchParams.get('account'));
```

Prefer:

```tsx
const exportCurrentView = () =>
  exportTransactions(rows, new URLSearchParams(window.location.search).get('account'));
```

## rerender-dependencies

Effect and memo dependencies are the primitives the body uses, not the whole object. A query result is a new object after every refetch.

Avoid:

```tsx
useEffect(() => {
  document.title = `${account.name} · CoinKeeper`;
}, [account]);
```

Prefer:

```tsx
useEffect(() => {
  document.title = `${account.name} · CoinKeeper`;
}, [account.name]);
```

## rerender-derived-state

Subscribe to the boolean you need, not the continuous value behind it. For layout, prefer CSS: mobile-first SCSS with `@include media-up(tablet-landscape)` needs no JavaScript and no re-render. When JavaScript truly needs a breakpoint, subscribe to a media query that yields a boolean and name the query.

Avoid:

```tsx
const width = useWindowWidth();

<nav className={width < 768 ? 'navigation navigation--compact' : 'navigation'} />;
```

Prefer (SCSS, no re-render):

```scss
.navigation {
  @include flex-column(space(2));

  @include media-up(tablet-landscape) {
    @include flex-row(space(4));
  }
}
```

## rerender-lazy-state-init

Pass a function to `useState` when the initial value is expensive (parsing, building an index, reading storage). `apps/web/src/providers/root-provider.tsx` does this for the `QueryClient`.

Avoid:

```tsx
const [columnMapping, setColumnMapping] = useState(guessMapping(parseCsv(csv).headers));
```

Prefer:

```tsx
const [columnMapping, setColumnMapping] = useState(() => guessMapping(parseCsv(csv).headers));
```

Cheap literals (`useState('')`, `useState(0)`) need no function.

## rerender-memo

Compiler. Move expensive work into a memoized child so the parent can return early (loading, empty) without paying for it.

Avoid:

```tsx
export function OverspendPanel({
  budgets,
  isPending,
}: {
  budgets: BudgetRow[];
  isPending: boolean;
}) {
  const ranking = useMemo(() => rankByOverspend(budgets), [budgets]);

  if (isPending) return <Spinner />;

  return <RankingList ranking={ranking} />;
}
```

Prefer:

```tsx
const OverspendRanking = memo(function OverspendRanking({ budgets }: { budgets: BudgetRow[] }) {
  return <RankingList ranking={rankByOverspend(budgets)} />;
});

export function OverspendPanel({
  budgets,
  isPending,
}: {
  budgets: BudgetRow[];
  isPending: boolean;
}) {
  if (isPending) return <Spinner />;

  return <OverspendRanking budgets={budgets} />;
}
```

## rerender-memo-with-default-value

Compiler. A default value like `onSelect = () => {}` or `tags = []` on a memoized component is a new object on every render, so `memo` never skips. Hoist it to a named module-level constant.

Avoid:

```tsx
const AccountRow = memo(function AccountRow({
  onSelect = () => undefined,
}: {
  onSelect?: () => void;
}) {
  return <ListRow onClick={onSelect} />;
});
```

Prefer:

```tsx
const ignoreSelect = (): void => undefined;

const AccountRow = memo(function AccountRow({
  onSelect = ignoreSelect,
}: {
  onSelect?: () => void;
}) {
  return <ListRow onClick={onSelect} />;
});
```

## rerender-simple-expression-in-memo

Do not wrap a cheap expression with a primitive result in `useMemo`; the hook and dependency comparison cost more than the expression.

Avoid:

```tsx
const isLoading = useMemo(
  () => accounts.isPending || budgets.isPending,
  [accounts.isPending, budgets.isPending]
);
```

Prefer:

```tsx
const isLoading = accounts.isPending || budgets.isPending;
```

## rerender-split-combined-hooks

Compiler. A memo or effect with independent steps re-runs all of them when any dependency changes. Split it so each step depends only on its own inputs.

Avoid:

```tsx
const visibleRows = useMemo(
  () =>
    rows
      .filter(row => row.currency === currency)
      .toSorted((left, right) =>
        sortOrder === 'ascending'
          ? left.amountMinor - right.amountMinor
          : right.amountMinor - left.amountMinor
      ),
  [rows, currency, sortOrder]
);
```

Prefer:

```tsx
const AmountComparators: Record<SortOrder, (left: BudgetRow, right: BudgetRow) => number> = {
  ascending: (left, right) => left.amountMinor - right.amountMinor,
  descending: (left, right) => right.amountMinor - left.amountMinor,
};

const currencyRows = useMemo(() => rows.filter(row => row.currency === currency), [rows, currency]);
const visibleRows = useMemo(
  () => currencyRows.toSorted(AmountComparators[sortOrder]),
  [currencyRows, sortOrder]
);
```

The same applies to effects: one effect per independent side effect, each with its own dependencies.
