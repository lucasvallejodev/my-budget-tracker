> Summary: the four waterfall rules (`async-parallel`, `async-defer-await`, `async-dependencies`, `async-cheap-condition-before-await`) for web event handlers, mutation callbacks and query functions, with the one trap that matters in the API: queries inside a transaction never run in parallel.

# Eliminating waterfalls

Each sequential `await` of a request adds a full round trip through the Next.js rewrite to the API. In the web app waterfalls hide in `queryFn`s that call two endpoints, in handlers that write several rows one by one, and in mutation callbacks that await refetches before closing a dialog.

The same rules apply to services in `apps/api` (see the fastify-api skill), with one exception: inside `db.transaction(...)` all statements share one connection and run one after another, and rows are locked in the order you touch them. Do not `Promise.all` inside a transaction; keep lock order deterministic. `apps/api/src/routes/reports.ts` shows the allowed case: independent reads outside a transaction, in one `Promise.all`.

## async-parallel

Independent requests start together.

- Two independent reads in a screen are two hooks: `useAccounts()` and `useCategories()` already run in parallel. Do not merge them into one `queryFn` that awaits one after the other.
- Several writes of the same kind from one action go out together.

Avoid:

```ts
const restoreSelected = async (ruleIds: string[]) => {
  for (const ruleId of ruleIds) {
    await restoreRule(ruleId);
  }

  await refresh();
};
```

Prefer:

```ts
const restoreSelected = async (ruleIds: string[]) => {
  await Promise.all(ruleIds.map(ruleId => restoreRule(ruleId)));
  await refresh();
};
```

Use `Promise.allSettled` when one failure must not hide the others, and report every rejected id. Keep batches small: every request passes the API's origin check and session lookup.

## async-defer-await

Await a value only in the branch that uses it, and do not make the user wait for work they are not looking at.

Check whether `useEntityMutation` awaits `invalidate()` (every `FinanceKeys` refetch) before running `onSuccess`. If it does, a dialog stays open until all active queries have reloaded. When the dialog only needs the write to succeed, close it first and let the refetch update the screen behind it.

Avoid:

```ts
onSuccess: async (data: TData) => {
  toast.success(successMessage);
  await invalidate();
  await onSuccess?.(data);
},
```

Prefer:

```ts
onSuccess: async (data: TData) => {
  toast.success(successMessage);
  await onSuccess?.(data);
  await invalidate();
},
```

Changing `useEntityMutation` changes every dialog: update its test and check the screens that read fresh data inside `onSuccess`.

## async-dependencies

When some requests depend on others, start each promise as soon as its input exists and await them all once. Do not add `better-all` or similar; plain promise chaining is enough.

Avoid:

```ts
const accounts = await apiList<AccountSummary>('/accounts');
const currencies = await apiList<Currency>('/currencies');
const firstAccountPage = await apiGet<PageResponse<TransactionRow>>('/transactions', {
  accountId: accounts[0]?.id,
});
```

Prefer:

```ts
const accountsRequest = apiList<AccountSummary>('/accounts');
const firstAccountPageRequest = accountsRequest.then(accounts =>
  apiGet<PageResponse<TransactionRow>>('/transactions', { accountId: accounts[0]?.id })
);

const [accounts, currencies, firstAccountPage] = await Promise.all([
  accountsRequest,
  apiList<Currency>('/currencies'),
  firstAccountPageRequest,
]);
```

In components, express the dependency with `enabled` on the second query instead of chaining inside one `queryFn`; each query then caches on its own key.

## async-cheap-condition-before-await

When a branch needs both an awaited value and a cheap synchronous condition, test the synchronous one first.

Avoid:

```ts
const settings = await apiGet<UserSettings>('/settings');

if (settings.showConvertedTotals && account.currency !== primaryCurrency) {
  showConversion(account);
}
```

Prefer:

```ts
if (account.currency !== primaryCurrency) {
  const settings = await apiGet<UserSettings>('/settings');

  if (settings.showConvertedTotals) showConversion(account);
}
```

Keep the original order when the synchronous check is expensive, depends on the awaited value, or side effects must happen in a fixed order.
