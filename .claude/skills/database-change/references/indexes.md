# Indexes for per-user, soft-deleted data

> Summary: the indexes CoinKeeper already has (including the partial needs-review index from migration 0001), how to order composite index columns for our queries, when a partial index on `deleted_at IS NULL` pays off, how to declare indexes in Drizzle 0.45, and how to find unused ones.

## What exists (`apps/api/src/db/schema.ts`)

| Table             | Indexes                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sessions`        | `sessions_user_idx (user_id)`, `sessions_expires_idx (expires_at)`, unique `token_hash`                                                                                                                                                                                                                                                                                                                                        |
| `accounts`        | `accounts_user_idx (user_id)`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `category_groups` | `category_groups_user_idx (user_id)`                                                                                                                                                                                                                                                                                                                                                                                           |
| `categories`      | `categories_user_idx (user_id)`, `categories_group_idx (group_id)`                                                                                                                                                                                                                                                                                                                                                             |
| `payees`          | unique `payees_user_name_key (user_id, name)`                                                                                                                                                                                                                                                                                                                                                                                  |
| `transactions`    | `transactions_user_date_idx (user_id, date)`, `transactions_account_date_idx (account_id, date)`, `transactions_user_category_idx (user_id, category_id)`, `transactions_transfer_idx (transfer_id)`, partial `transactions_needs_review_idx (user_id) WHERE needs_review AND deleted_at IS NULL`, unique partial `transactions_account_import_key (account_id, import_id) WHERE import_id IS NOT NULL AND deleted_at IS NULL` |
| `exchange_rates`  | primary key `(user_id, base, quote, date)`                                                                                                                                                                                                                                                                                                                                                                                     |
| `budgets`         | unique `budgets_category_month_currency_key (category_id, month, currency)` over live and deleted rows, `budgets_user_month_idx (user_id, month)`                                                                                                                                                                                                                                                                              |
| `rules`           | `rules_user_idx (user_id)`                                                                                                                                                                                                                                                                                                                                                                                                     |

Check the file before relying on this table; it is the source of truth.

## Column order

- Equality columns first, in the order the query fixes them: `user_id`, then `account_id` or `category_id` when the query filters on them.
- Then the range or sort column: `date` for ledger lists and reports, `month` for budgets.
- Then the keyset tie-breakers when the index should also serve the `ORDER BY`: the transactions list orders by `date DESC, created_at DESC, id DESC` (`listRows` in `apps/api/src/modules/ledger/queries.ts`). A B-tree scanned backwards serves an all-descending order, so `.desc()` is unnecessary when every column goes the same direction.
- Do not index a boolean alone (`needs_review`, `excluded`); use it as a partial-index predicate instead.
- An index on `(user_id, date)` already serves `WHERE user_id = $1`; do not add a separate `(user_id)` index next to it.

## Partial index on `deleted_at IS NULL`

Every live read filters `deleted_at IS NULL`. A partial index with that predicate:

- skips deleted rows, so the plan has no `Filter: (deleted_at IS NULL)` step and can do an index-only scan when the index covers the selected columns;
- only pays off when deleted rows are a real share of the table or the query needs an ordered or index-only scan. With few deleted rows the gain is small; do not add one without an `EXPLAIN` showing the filter cost.
- is only used when the query repeats the predicate exactly (`deleted_at IS NULL`), which our services do through `isNull(table.deletedAt)`.

The worked example is `transactions_needs_review_idx` (migration `0001`): `needsReviewCount` in `apps/api/src/modules/ledger/queries.ts` counts `user_id = $1 AND needs_review AND deleted_at IS NULL`, and the partial index on `(user_id)` with exactly that predicate answers it from a small index. If you change that query's filter, keep the predicate identical or the index stops being used.

Next candidate (measure first, see `query-plans.md`):

- Report queries filter `t.user_id`, a month range on `t.date`, `t.deleted_at IS NULL`, `t.kind = 'standard'` and `NOT t.excluded` (`spendingWhere`). A partial index on `(user_id, date) WHERE deleted_at IS NULL AND kind = 'standard' AND NOT excluded` matches that predicate exactly; `INCLUDE (amount_minor, category_id, account_id, currency)` can make it index-only.

## Declaring indexes in Drizzle 0.45

Indexes live in the third argument of `pgTable`, next to the existing ones:

```ts
index('transactions_needs_review_idx')
  .on(columns.userId)
  .where(sql`${columns.needsReview} AND ${columns.deletedAt} IS NULL`),
```

- Name every index explicitly (`<table>_<columns>_idx`, `<table>_<columns>_key` for unique ones), as the schema does.
- Do not call `.concurrently()`: the migrator runs in a transaction (see `migrations.md` › Indexes on big tables).
- Read the generated SQL: the predicate must match what the services send, and a changed predicate must appear as drop plus create.

## Unused and bloated indexes

Every index slows every write to `transactions` (CSV imports write many rows). Before adding one, check which exist and whether they are used:

```sql
SELECT relname AS table_name, indexrelname AS index_name, idx_scan, pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

Counters are per database and reset with the statistics; read them on a database that has served real traffic for a while, never on a fresh test database. Remove an unused index in its own migration.
