# Caching

> Summary: CoinKeeper's rules for caching on the server: what may never be cached (anything derived from the ledger), what already is, the checklist a cache must pass, and the cheaper alternatives to try first.

## Never cache across requests

- Balances, net worth, reports, cash flow, budget spending and converted totals. They are SQL over `transactions` (`agents/architecture.md` rule 2); a cached value is wrong after the next write, restore, import or exchange-rate change, and the user sees money that does not add up.
- Anything per user in a process-wide structure without the user id in the key (rule 8: every query filters by `user_id`). A cache hit with the wrong key is a data leak between users.
- Sessions. `sessions.resolve` runs on every authenticated request so that revocation (sign-out, password change, "sign out other sessions") takes effect immediately.
- Exchange rates. They live in the per-user `exchange_rates` table and providers are called with a `userId` (`RateProvider.latestRates(userId, currencies, counterpart, date)` in `modules/fx/provider.ts`); they are user data, not shared reference data.

## Already cached, correctly

| What                                 | How                                                                                                                                                                                                                              |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| per-request lookups                  | local `Map`s inside one service call (the rates `fx.getRates` resolves for `convertedTotals`, spending keyed by currency and category in `modules/budgets/service.ts`), discarded when it returns                                |
| the currency list                    | HTTP `cache-control: private, max-age=…` on the settings route (`routes/settings.ts`)                                                                                                                                            |
| the reference hash for timing parity | one module-level promise in `auth/passwords.ts`; same for every request, no user data                                                                                                                                            |
| number formatters                    | `Formatters` in `packages/shared/src/lib/money.ts` keeps one `Intl.NumberFormat` per locale, currency and sign option for `formatMoney` and `formatMajorAmount`; no user data, and the key space is bounded by the currency list |
| everything the web app reads         | TanStack Query in the browser, invalidated after writes (`useRefreshFinance`); owned by react-client-patterns                                                                                                                    |

## Before adding a cache

Try, in order:

1. Fewer queries: batch the N+1 or group the report (database-change).
2. A better index or plan (database-change, `EXPLAIN (ANALYZE, BUFFERS)`).
3. Smaller responses: pagination (`pageOf`, `pageSizeSchema`) or fewer columns in the shared schema.
4. Client-side caching settings (`staleTime`) for data that rarely changes.

## If a server cache is still justified

It must pass every item, with a test for each:

1. The data is not derived from the ledger, or the cache lives only for one request.
2. The key contains `userId` when the value is per user; a test proves user B never gets user A's value.
3. It is bounded (maximum entries, named constant) and has a time-to-live (named constant).
4. Every write path that changes the source invalidates it in the same service call; a test writes and then reads the fresh value.
5. It is per process: with several replicas, each has its own copy, so invalidation on one replica does not reach the others. If that matters, it is not an in-memory cache. The same holds for the in-memory limiters (`@fastify/rate-limit`, the per-account sign-in throttle in `auth/sign-in-throttle.ts`).
6. No new dependency (`lru-cache`, `async-cache-dedupe`) without an explicit decision; a small bounded `Map` wrapper with a test is often enough.

Request coalescing (deduplicating identical concurrent calls) is the least risky in-memory technique for ledger reads, because it shares one in-flight promise rather than a stored result. It can still hand a caller a result that started before that caller's own write, so it never applies to a read that follows a write in the same flow; key it by `userId` and every query parameter, and measure first.
