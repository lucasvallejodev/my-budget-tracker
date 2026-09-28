# Query rules for services

> Summary: the rules every CoinKeeper service query follows (user scope, live rows, the report predicate, per-currency sums, sargable month ranges, parameters, keyset pagination, bigint handling), with the helpers that already implement them.

## Scope and liveness

- Filter `user_id` on the anchor table of every statement: `eq(transactions.userId, userId)` in the builder, `t.user_id = ${userId}` in raw `sql`. Joins through ids the user owns (`accounts.id = transactions.account_id`) do not replace that filter.
- Resolve a foreign or missing id with `notFound('<What>')` from `apps/api/src/modules/db.ts` (a `404`), never a `403`.
- Add `isNull(<table>.deletedAt)` to every live read of `transactions`, `accounts`, `rules`, `budgets` and `exchange_rates`. Deleted rows are read only by "deleted items" lists and `restore` paths.
- Archived categories, groups, payees and accounts stay valid references for existing rows; filter `archived_at` only where the UI offers choices.
- Reads that must see a consistent snapshot of several tables, and writes that touch several rows, go through `db.transaction(async tx => …)` and pass `tx` down (`DbOrTx` in `apps/api/src/modules/db.ts`).

## Reports and money

- Use `spendingWhere` (`apps/api/src/modules/reports/service.ts`) for every income or spending figure. It is `t.deleted_at IS NULL AND a.deleted_at IS NULL AND t.kind = 'standard' AND NOT t.excluded AND a.counts_in_spending`, joined with `accounts a`. Classify income and spending by `category_groups.kind`, falling back to the sign when there is no category, exactly as the existing queries do.
- Group by currency and return one figure per currency. Convert to the primary currency only for display totals, through `convertMinor` from `@coinkeeper/shared/lib/money` and the rates of `fx.getRates` (one lookup for every currency; `fx.getRate` is the single-pair wrapper).
- Transfers (`kind = 'transfer'`) and opening balances (`kind = 'opening'`) never count as spending or income; balances include them.
- `SUM(amount_minor)` on `bigint` returns `numeric`, which node-postgres returns as a string: type it as `string` in the row type and convert with `Number(...)` (safe up to 2^53 minor units).

## Dates

- Dates are `YYYY-MM-DD` strings (`date(..., { mode: 'string' })`), months `YYYY-MM`.
- Month filters use `monthRange(month)` from `apps/api/src/modules/ledger/queries.ts` (re-exported by the ledger service): `t.date >= ${start} AND t.date < ${end}`. Never wrap the column in `to_char`, `date_trunc` or `extract` in a `WHERE`; the index on `(user_id, date)` cannot be used then.
- `GROUP BY to_char(t.date, 'YYYY-MM')` in the select list is fine; only the filter must stay sargable.

## Parameters and raw SQL

- Interpolate values into `sql` templates (`${value}`): Drizzle sends them as bind parameters.
- `sql.raw` only with constants from code, never with request data. Identifiers from code go through `sql.identifier`.
- Lists of values: `inArray(column, values)` in the builder; in raw `sql`, `valueList(values)` from `modules/batch.ts` inside `IN (…)`. Guard the empty list before building `IN ()`, which is a syntax error.
- Escape user text for `LIKE` / `ILIKE` the way `escapeLike` in `ledger/queries.ts` does.

## Shape

- Select the columns the contract needs, not `select()` of whole rows, and map rows to the Zod contract from `packages/shared/src/schema/<domain>.ts`; never return `$inferSelect` rows from a route.
- Paginate transaction lists with the keyset cursor of `page` in `ledger/queries.ts` (`date`, `created_at`, `id`). Do not add `OFFSET` pagination. Cap sizes with `MAX_PAGE_SIZE` from `@coinkeeper/shared/constants/pagination`.
- Use `EXISTS` for "is there any" checks and filter in `WHERE` before `GROUP BY`; keep `HAVING` for conditions on aggregates.
- One query per request path, not one per item: see `batching-and-transactions.md`.
