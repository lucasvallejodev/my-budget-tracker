# Batching and transactions

> Summary: the set-based patterns CoinKeeper's services already use instead of per-currency, per-id and per-row query loops (one grouped query, `UPDATE … FROM (VALUES …)` with RETURNING checks, chunked multi-row inserts with `ON CONFLICT`, the atomic CSV import commit, a `LATERAL` join), the shared helpers in `modules/batch.ts`, what a reviewer checks, and when to take an advisory lock.

## Where the set-based statements are

| Place                                                                                                          | Before                                                             | Now                                                                                                        |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `spentByCategory` in `apps/api/src/modules/budgets/service.ts`                                                 | `reports.breakdownByCategory` once per currency                    | one call to `reports.categorySpending(userId, month, currencies)`, grouped by currency and category        |
| `convertedTotals` in `apps/api/src/modules/reports/service.ts`                                                 | `fx.getRate` once per currency                                     | one `fx.getRates(userId, bases, quote, date)`; `ManualRateProvider.latestRates` is one `DISTINCT ON` query |
| `reorderCategories`, `reorderGroups` (`modules/categories/service.ts`), `reorder` (`modules/rules/service.ts`) | one `UPDATE` per id                                                | one `UPDATE … FROM (VALUES …) … RETURNING id`, then `assertAllFound`                                       |
| `applyToUncategorized` (`modules/rules/service.ts`)                                                            | one `UPDATE` per matched row                                       | chunked `UPDATE … FROM (VALUES …)` (`categorize`)                                                          |
| `commit` in `apps/api/src/modules/import/service.ts`                                                           | `findOrCreate` and `createStandard` per row, no shared transaction | one transaction, payees resolved in bulk, chunked inserts (see [Atomic CSV import](#atomic-csv-import))    |
| `transferSuggestions` in the same file                                                                         | a peer lookup per candidate row                                    | one query with a `JOIN LATERAL (… LIMIT 1)` per outgoing row (`suggestionCandidates`)                      |

When reviewing or writing a service, check that none of these regressed into a loop of awaited queries, and that new code with an unbounded count (ids, CSV rows, currencies) follows the same shapes. Measure first (`query-plans.md`): at a handful of items a loop is cheap; batch when the count is unbounded or the path is hot. Remaining loops are bounded on purpose: `learnPayeeDefaults` runs once per distinct payee, `resolveRates` once per rate provider.

## Helpers

`apps/api/src/modules/batch.ts` holds the pieces every set-based statement uses; reuse them rather than rebuilding them in a service:

| Helper                             | Does                                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| `rowsOf<Row>(db, statement)`       | runs a raw `sql` statement and returns its rows (typed), for node-postgres and PGlite alike |
| `valueList(values)`                | the comma-joined bind parameters for `IN (…)`                                               |
| `positionedIds(orderedIds)`        | `(id, position::int)` rows for `FROM (VALUES …)`                                            |
| `assertDistinctIds(ids)`           | `400` "List each id once" when an id repeats                                                |
| `assertAllFound(count, ids, what)` | `notFound(what)` when fewer rows came back than ids were sent                               |
| `WRITE_CHUNK_ROWS`                 | 1000 rows per multi-row statement                                                           |

`chunk(items, size)` and `hasDistinctItems(items)` are in `packages/shared/src/lib/arrays.ts` (the shared `orderSchema` uses `hasDistinctItems` too).

## One query across currencies

Pass the list and group by it, as `categorySpending` in `reports/service.ts` does:

```ts
if (!currencies.length) return [];

const rows = await rowsOf<{ category_id: string; currency: string; spent_minor: string }>(
  db,
  sql`
  SELECT t.currency, t.category_id, -SUM(t.amount_minor) AS spent_minor
  FROM transactions t
  JOIN accounts a ON a.id = t.account_id
  JOIN categories c ON c.id = t.category_id
  JOIN category_groups g ON g.id = c.group_id
  WHERE t.user_id = ${userId} AND ${spendingWhere} AND t.currency IN (${valueList(currencies)})
    AND t.date >= ${start} AND t.date < ${end}
    AND g.kind = 'expense'
  GROUP BY t.currency, t.category_id`
);
```

Return early when the list is empty (`IN ()` is a syntax error). The result stays per currency; nothing is summed across currencies. The same applies to rates: `getRates` asks each provider once for every pending base currency and falls back to the inverse quote in memory.

## Bulk update from a list

Reorders send an ordered id list. One statement replaces the loop; untyped parameters in `VALUES` are `text`, so `positionedIds` casts the position to `int`:

```ts
const moveCategories = (tx: DbOrTx, userId: string, groupId: string, orderedIds: string[]) =>
  rowsOf<{ id: string }>(
    tx,
    sql`
    UPDATE categories AS category
    SET group_id = ${groupId}, sort_order = ordered.position, updated_at = now()
    FROM (VALUES ${positionedIds(orderedIds)}) AS ordered(id, position)
    WHERE category.id = ordered.id AND category.user_id = ${userId}
    RETURNING category.id`
  );
```

The service calls `assertDistinctIds(orderedIds)` first and, inside the transaction, `assertAllFound((await moveCategories(…)).length, orderedIds, 'Category')`, so a foreign or missing id rolls the whole reorder back with `404` (`catalog.test.ts` covers repeated ids, `400`, and another user's ids, `404`). Keep these properties:

- Set `updated_at = now()` yourself: `$onUpdate` does not run for raw SQL.
- The `user_id` condition silently skips foreign ids, so compare the `RETURNING` rows (or a count of owned ids) with the ids sent and call `notFound` when they differ. Do not rely on the driver's affected-row count: node-postgres and PGlite report it differently, and `Db` covers both.
- Reject repeated ids before the statement: with a repeated id, `UPDATE … FROM` picks one of the positions arbitrarily and the `RETURNING` count no longer matches.

## Multi-row inserts

- `tx.insert(transactions).values(rows)` sends one statement. PostgreSQL accepts at most 65,535 bind parameters per statement, so chunk with `chunk(rows, WRITE_CHUNK_ROWS)`, which stays well below `65535 / columns` for our widest table.
- Use `onConflictDoNothing` with the import key instead of catching unique violations. The key is partial, so repeat its predicate, as `insertImportedRows` does:

```ts
await tx
  .insert(transactions)
  .values(slice)
  .onConflictDoNothing({
    target: [transactions.accountId, transactions.importId],
    where: sql`${transactions.importId} IS NOT NULL AND ${transactions.deletedAt} IS NULL`,
  })
  .returning({ id: transactions.id });
```

- Keep the business rules of `createStandard` (`apps/api/src/modules/ledger/standard.ts`): build rows with `standardInsertValues`, reuse the guards in `apps/api/src/modules/ledger/guards.ts` (`ownedAccount`, `assertCategory`, `assertPayee`, `assertDate`, `assertNonZeroAmount`) once per distinct value rather than skipping them, and keep `needsReview: true` and `status: 'pending'` for imported rows.

## Atomic CSV import

`commit` in `apps/api/src/modules/import/service.ts` is the reference shape for a multi-row write:

1. Before the transaction: filter the insertable rows and run `assertDate` and `assertNonZeroAmount` on each, so bad input fails before any lock is taken.
2. `service.db.transaction(async tx => …)`, and inside it, all with `tx`:
   - `ownedAccount(tx, userId, accountId)`, which selects the account `FOR UPDATE`: two imports into the same account run one after the other;
   - `applyMatchedRows`: chunked `UPDATE … FROM (VALUES …)` that stamps `import_id` only on the user's live standard rows in that account without one, guarded by `NOT EXISTS` against an import id already taken;
   - `resolvePayeesByName` (`modules/payees/service.ts`): one read of the user's payees, the missing names inserted in chunks with `onConflictDoNothing({ target: [payees.userId, payees.name] })` and read back; names match case-insensitively through `payeeNameKey` (trimmed, lower case) while the unique key `payees_user_name_key` is case-sensitive;
   - `activeCategoryIds`: one chunked read of the referenced categories that are not archived;
   - `insertImportedRows`: chunked inserts with `onConflictDoNothing` on the import key;
   - `learnPayeeDefaults` for the payees that got a category.
3. Return the counts and inserted ids.

What a reviewer checks in this or any similar write:

- **Do not catch a database error and continue inside the transaction.** After any error PostgreSQL marks the transaction aborted and rejects every later statement until rollback. Use `ON CONFLICT DO NOTHING`, or a nested `tx.transaction(…)`, which Drizzle turns into a savepoint, when a single row may legitimately fail.
- Pass `tx` to every helper (`DbOrTx`), never the outer `db`, or the statement runs outside the transaction.
- Keep the transaction short: parse and classify the CSV before opening it (`preview` already does), write inside it. `idle_in_transaction_session_timeout` (30 s, `connection-settings.md`) ends a transaction left waiting.
- A test proves the rollback: a failure part-way leaves no rows behind (`services.test.ts` › "commits an import atomically and only once").

## Advisory locks

`ensureUserBootstrap` (`apps/api/src/modules/categories/seed.ts`) serializes per-user seeding with `pg_advisory_xact_lock(hashtext(userId))`. Use the same transaction-scoped form for other per-user critical sections that have no row to lock with `FOR UPDATE` (the import locks its account row instead); it releases on commit or rollback. Session-level `pg_advisory_lock` must be unlocked explicitly and leaks across pooled connections; avoid it.
