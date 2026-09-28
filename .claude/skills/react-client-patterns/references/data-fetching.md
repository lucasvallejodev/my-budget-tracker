> Summary: how the web app reads and writes server data with TanStack Query 5 (`client-query-hooks`: keys, `isPending`, `staleTime`/`gcTime`, `keepPreviousData`, `queryOptions`, invalidation, optimistic updates through `@/api/mutations`), plus the client rules for browser storage and global event listeners.

# Data fetching and browser APIs

- [client-query-hooks](#client-query-hooks)
- [client-localstorage-schema](#client-localstorage-schema)
- [client-event-listeners](#client-event-listeners)
- [client-passive-event-listeners](#client-passive-event-listeners)

## client-query-hooks

House rule (replaces the upstream SWR rule). TanStack Query 5 already deduplicates requests that share a key; the job is to keep one key per resource and one place per read.

### Reads

1. Every read is a hook in `apps/web/src/components/finance/use-finance-data.ts` that calls `apiGet`, `apiList` or `apiPages` from `@/api/client` with a key from `QueryKeys`. Never `fetch` in a component, never copy server data into `useState`, never load data in `useEffect`.
2. A new endpoint gets a hook, a `QueryKeys` entry and, if ledger writes should refresh it, an entry in `FinanceKeys`. The key contains every parameter the `queryFn` sends (`QueryKeys.budgets(month)`), otherwise two months share one cache entry.
3. v5 takes one options object: `useQuery({ queryFn, queryKey, … })`. Positional arguments, `cacheTime`, `keepPreviousData: true` and `suspense: true` are v4 and do not compile.
4. `isPending` means "no data yet"; it is what `QueryContent` takes (`pending={budgets.isPending}`). A query with `enabled: false` and no data stays pending forever, so for a disabled query branch on `enabled` or use `isLoading` (`isPending && isFetching`).
5. `staleTime` defaults to 0 (refetch on mount and window focus). Reference data that only changes on deploy or sign-in uses `staleTime: Infinity`, as `useCurrencies` and `useCurrentUser` do. `gcTime` (formerly `cacheTime`, default five minutes) only controls how long unused data stays in memory; do not raise it to hide loading states.
6. Queries keyed by a month or by filters use `placeholderData: keepPreviousData`, so switching month keeps the previous numbers on screen instead of flashing "Loading budgets…". Show that the data is stale through `isPlaceholderData` and a BEM modifier, never by hiding amounts.
7. When a query is needed in more than one place (the hook, a `prefetchQuery` on hover, a `setQueryData` in a test or an optimistic update), define it once with `queryOptions()` next to the hook. The key and the data type then travel together. The file does not use `queryOptions` yet; introduce it when you add the second use.
8. Derived slices use `select` with a module-level function (a new inline function per render re-runs the selector).

Avoid:

```tsx
export function BudgetList({ month }: { month: string }) {
  const [rows, setRows] = useState<BudgetRow[]>([]);

  useEffect(() => {
    fetch(`/api/v1/budgets?month=${month}`)
      .then(response => response.json())
      .then(body => setRows(body.items));
  }, [month]);

  return <BudgetTable rows={rows} />;
}
```

Prefer:

```ts
export const budgetsQuery = (month: string) =>
  queryOptions({
    queryFn: () => apiList<BudgetRow>('/budgets', { month }),
    queryKey: QueryKeys.budgets(month),
  });

export function useBudgets(month: string) {
  return useQuery({ ...budgetsQuery(month), placeholderData: keepPreviousData });
}
```

```tsx
function PreviousMonthButton({
  month,
  onChange,
}: {
  month: string;
  onChange: (month: string) => void;
}) {
  const queryClient = useQueryClient();
  const previousMonth = shiftMonth(month, -1);
  const prefetchPreviousMonth = () => queryClient.prefetchQuery(budgetsQuery(previousMonth));

  return (
    <Button
      aria-label="Previous month"
      size="icon"
      variant="outline"
      onClick={() => onChange(previousMonth)}
      onFocus={prefetchPreviousMonth}
      onMouseEnter={prefetchPreviousMonth}
    >
      <ChevronLeft />
    </Button>
  );
}
```

### Writes and invalidation

1. Each write is a function in `apps/web/src/api/mutations.ts` (`apiRequest(method, path, body)`), verb-first and named after the resource.
2. From a dialog form use `useEntityMutation` (`components/finance/use-entity-mutation.ts`): it toasts, invalidates every `FinanceKeys` query, then runs `onSuccess`. Elsewhere use `useMutation` with the same toast + invalidate shape.
3. Invalidate broadly by default. A ledger write moves balances, net worth, the summary, budgets and the review count, which are all SQL over `transactions`; `useRefreshFinance()` is the correct call.
4. Invalidate one key only when the write provably touches nothing in the ledger, as `session-list` and `password-form` do with `queryClient.invalidateQueries({ queryKey: QueryKeys.sessions })`.
5. `invalidateQueries` resolves after the active queries have refetched. Awaiting it before closing a dialog makes the user wait for every refetch; see `async-defer-await` in [waterfalls.md](waterfalls.md).
6. When changing `QueryClient` defaults in `apps/web/src/providers/root-provider.tsx`, do not retry 4xx answers: `ApiError` carries `status`, and three retries of a 404 only delay the error state. Name the retry limit.

### Optimistic updates

Only for fields the row owns and the server echoes back unchanged: a payee name, a memo, the review flag. Never compute balances, totals or budget progress on the client: they come from the ledger and are per currency. Snapshot, write, roll back on error, then refresh everything that may depend on the row.

```tsx
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { updatePayee } from '@/api/mutations';

import { PayeeRow, QueryKeys, useRefreshFinance } from '../use-finance-data';

type PayeeRename = {
  id: string;
  name: string;
};

const withRenamedPayee = (payees: PayeeRow[] | undefined, { id, name }: PayeeRename) =>
  payees?.map(payee => (payee.id === id ? { ...payee, name } : payee));

export function useRenamePayee() {
  const queryClient = useQueryClient();
  const refresh = useRefreshFinance();

  return useMutation({
    mutationFn: ({ id, name }: PayeeRename) => updatePayee(id, { name }),
    onError: (error: Error, rename, previousPayees) => {
      queryClient.setQueryData(QueryKeys.payees, previousPayees);
      toast.error(error.message);
    },
    onMutate: async (rename: PayeeRename) => {
      await queryClient.cancelQueries({ queryKey: QueryKeys.payees });

      const previousPayees = queryClient.getQueryData<PayeeRow[]>(QueryKeys.payees);

      queryClient.setQueryData<PayeeRow[]>(QueryKeys.payees, payees =>
        withRenamedPayee(payees, rename)
      );

      return previousPayees;
    },
    onSettled: () => refresh(),
    onSuccess: () => toast.success('Payee renamed'),
  });
}
```

Test it like any screen: seed `client.setQueryData(QueryKeys.payees, …)`, mock `@/api/mutations`, assert the new name renders before the promise resolves and the old one returns when it rejects.

## client-localstorage-schema

`localStorage` throws in private windows, when full or when disabled, and anything in it is readable by any script on the origin. Guard every access, version the key when the stored shape changes, store only UI preferences. Never store tokens, the session (it is an HttpOnly cookie on purpose) or financial data.

Avoid:

```ts
export const storedTheme = (): string => localStorage.getItem(ThemeStorageKey) || DefaultTheme;
```

Prefer:

```ts
const readStoredValue = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStoredValue = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);

    return true;
  } catch {
    return false;
  }
};

export const storedTheme = (): string => readStoredValue(ThemeStorageKey) ?? DefaultTheme;
```

`ThemeStorageKey` lives in `apps/web/src/lib/appearance.ts`. Renaming the key resets every user's theme, so only add a version suffix together with a migration that reads the old key once.

## client-event-listeners

N components that each add a `window` listener cost N listeners and N handler runs. Keep one listener at module level and a registry of handlers. For a shared value (color scheme, online state) use `useSyncExternalStore` with a module-level `subscribe`, as `apps/web/src/lib/hydration.ts` does.

Avoid:

```tsx
export function useKeyboardShortcut(key: string, handler: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey && event.key === key) handler();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, handler]);
}
```

Prefer:

```tsx
const ShortcutHandlers = new Map<string, Set<() => void>>();

const runShortcut = (event: KeyboardEvent): void => {
  if (!event.metaKey) return;

  ShortcutHandlers.get(event.key)?.forEach(handler => handler());
};

const addShortcut = (key: string, handler: () => void): (() => void) => {
  if (!ShortcutHandlers.size) window.addEventListener('keydown', runShortcut);

  const handlers = ShortcutHandlers.get(key) ?? new Set<() => void>();

  handlers.add(handler);
  ShortcutHandlers.set(key, handlers);

  return () => {
    handlers.delete(handler);
    if (!handlers.size) ShortcutHandlers.delete(key);
    if (!ShortcutHandlers.size) window.removeEventListener('keydown', runShortcut);
  };
};

export function useKeyboardShortcut(key: string, handler: () => void) {
  const onShortcut = useEffectEvent(handler);

  useEffect(() => addShortcut(key, () => onShortcut()), [key]);
}
```

## client-passive-event-listeners

Touch and wheel listeners block scrolling until the browser knows they will not call `preventDefault()`. Pass `{ passive: true }` to every touch or wheel listener that only reads the event. Leave it out only for custom gestures that must cancel scrolling, and give those a keyboard alternative (see ui-review).

```ts
useEffect(() => {
  const trackWheel = (event: WheelEvent) => setScrolledDown(event.deltaY > 0);

  document.addEventListener('wheel', trackWheel, { passive: true });

  return () => document.removeEventListener('wheel', trackWheel);
}, []);
```
