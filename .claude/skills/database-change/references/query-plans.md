# Reading query plans

> Summary: how to measure a slow CoinKeeper query: seed realistic volume in a throwaway database, get the SQL Drizzle sends, run `EXPLAIN (ANALYZE, BUFFERS)` in the compose Postgres, read the signs that matter, and use `pg_stat_statements` once it is enabled.

## 1. Seed volume in a throwaway database

Plans on a few rows are meaningless: PostgreSQL prefers a sequential scan on tiny tables. Use a local database you can throw away (never one with real data). Sign up a user in the app, create an account, then add rows for it:

```sql
INSERT INTO transactions (id, user_id, account_id, amount_minor, currency, date, memo)
SELECT gen_random_uuid()::text, account.user_id, account.id, -(1 + (random() * 10000)::int), account.currency,
       CURRENT_DATE - (series % 1095), 'seed ' || series
FROM accounts AS account, generate_series(1, 50000) AS series
WHERE account.id = '<account id>';
ANALYZE transactions;
```

Add a second user with a similar volume so `user_id` selectivity is realistic. Run `ANALYZE` after bulk loads; the planner relies on fresh statistics.

## 2. Get the SQL

- Raw `sql` queries (reports) are already in `apps/api/src/modules/reports/service.ts`.
- For query-builder code, call `.toSQL()` on the builder in a scratch test, or pass `logger: true` to `drizzle(...)` temporarily and read the API log. Do not commit either.
- Replace `$1`, `$2` with literal values, or run `PREPARE q AS …; EXPLAIN (ANALYZE, BUFFERS) EXECUTE q('<user id>', …);` so the plan uses real parameters.

## 3. Run it

```bash
docker compose exec postgres psql -U budget_tracker -d budget_tracker
```

```sql
EXPLAIN (ANALYZE, BUFFERS) <query>;
```

`ANALYZE` executes the statement. Wrap anything that writes in `BEGIN; … ROLLBACK;`.

## 4. What to look for

| Sign                                                                             | Meaning                                                                                        |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `Seq Scan on transactions` with a large `Rows Removed by Filter`                 | No usable index for the user and date filter; check column order (`indexes.md`).               |
| `Filter: (deleted_at IS NULL)` removing many rows after an index scan            | Candidate for a partial index.                                                                 |
| Estimated `rows=` far from `actual rows=`                                        | Stale statistics (`ANALYZE`) or correlated predicates; fix the estimate before adding indexes. |
| `Sort Method: external merge` or `Sort` above a big scan for the list page       | The `ORDER BY date DESC, created_at DESC, id DESC` is not served by an index.                  |
| `Buffers: shared read=` large, `hit=` small                                      | Cold cache or too much data read; compare on a second run.                                     |
| `Index Only Scan` with high `Heap Fetches`                                       | Visibility map is stale; `VACUUM` the table.                                                   |
| `Nested Loop` whose inner side runs thousands of loops                           | Missing index on the join key, or an N+1 shape moved into SQL.                                 |
| Function on the column in the filter (`to_char(date, …)`, `date_trunc(…, date)`) | Not sargable; compare with the `[start, end)` range from `monthRange` instead.                 |

Change one thing, run the same statement again, and keep both outputs for the pull request.

## 5. CTEs

PostgreSQL 17 inlines a CTE referenced once. Add `AS MATERIALIZED` only when you want it computed once (for example a per-month total reused by several joins), and `AS NOT MATERIALIZED` to force inlining of a CTE referenced twice. Check the plan either way.

## 6. `pg_stat_statements` (when enabling it)

Check `docker-compose.yml` for `shared_preload_libraries`. When enabling it for local or production profiling:

1. Start Postgres with the library preloaded. The compose change is owned by the `container-hardening` skill (its `compose-runtime.md` has the `command:` line); make it there.
2. Create the extension once with psql: `CREATE EXTENSION IF NOT EXISTS pg_stat_statements;`. Do not put it in a Drizzle migration: PGlite, which runs every migration in the tests, does not provide it.
3. Read the top statements:

```sql
SELECT calls, round(mean_exec_time::numeric, 2) AS mean_ms, round(total_exec_time::numeric, 2) AS total_ms, rows, query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

Reset between experiments with `SELECT pg_stat_statements_reset();`.
