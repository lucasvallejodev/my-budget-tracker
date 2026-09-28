---
name: database-change
description: Changes CoinKeeper's PostgreSQL 17 schema and SQL safely with Drizzle ORM 0.45 in apps/api. Covers migrations that survive a live database (expand/contract, NOT NULL in steps, CREATE INDEX CONCURRENTLY versus the migrator's single transaction, new enum values, hand-written SQL with a consistent drizzle/meta), indexes for per-user and soft-deleted data, EXPLAIN (ANALYZE, BUFFERS) review, N+1 queries and batched writes, transactions for multi-row writes such as the CSV import, statement and idle-in-transaction timeouts, and pg_stat_statements. Use when editing apps/api/src/db/schema.ts or apps/api/drizzle, adding a column, table, index, constraint or enum value, writing or reviewing a service query, or when a list, report, budget page or import is slow. Not for routes, plugins, health checks or server timeouts (use fastify-api), hanging or flaky Vitest runs and CPU profiling (use node-diagnostics), or the Postgres container and compose file (use container-hardening).
---

# Database change

CoinKeeper's API owns one PostgreSQL 17 database, described by `apps/api/src/db/schema.ts` and migrated from `apps/api/drizzle/`. The ledger is the only source of truth for balances and reports, so a bad migration or a careless query is a data-integrity bug, not only a performance one. This skill covers what generic PostgreSQL and Drizzle advice gets wrong here: how our migrator runs, which schema changes are safe on a live database, how to index per-user soft-deleted data, and how to replace per-row loops with one statement.

## Before you start

- [agents/data-model.md](../../../agents/data-model.md): every table and column, the constraints on `transactions`, the report predicate.
- [agents/architecture.md](../../../agents/architecture.md) › invariants: integer minor units, ledger as truth, paired transfers, per-currency reports, per-user scoping, soft delete.
- [agents/workflows.md](../../../agents/workflows.md) › feature checklist, step 1 (Schema), and [docs/reference/migrations.md](../../../docs/reference/migrations.md) for the generate / review / migrate / check cycle.
- [agents/conventions.md](../../../agents/conventions.md) before writing service code (named constants, no comments, `ServiceError`).

Facts that change the usual advice:

- **Money is `bigint('amount_minor', { mode: 'number' })` plus a `char(3)` currency.** Reject any advice to use `NUMERIC(12, 2)`, `real` or `double precision` for amounts. The only `numeric` column is `exchange_rates.rate` (a rate, not money). `SUM` over `bigint` comes back from node-postgres as a string; convert with `Number(...)` as `apps/api/src/modules/reports/service.ts` does.
- **Soft delete, not `DELETE`.** `transactions`, `accounts`, `rules`, `budgets` and `exchange_rates` have `deleted_at`; `accounts`, `category_groups`, `categories` and `payees` have `archived_at`. Only `sessions` rows are hard-deleted. A migration or service that deletes financial rows, or adds `ON DELETE CASCADE` to them, breaks a core rule.
- **Every statement is scoped by `user_id`**, subqueries included. A foreign id resolves to "not found" (`notFound` in `apps/api/src/modules/db.ts`), never to another user's row.
- **Reports reuse `spendingWhere`** in `apps/api/src/modules/reports/service.ts`, never a hand-copied predicate, and group by currency; nothing sums across currencies.
- **All pending migrations run in one transaction.** `migrate()` from `drizzle-orm/node-postgres/migrator` (used by `apps/api/src/cli/migrate.ts`, `drizzle-kit migrate` and the PGlite tests through `drizzle-orm/pglite/migrator`) wraps the whole batch in a single `BEGIN … COMMIT`. So `CREATE INDEX CONCURRENTLY` fails, a new enum value cannot be used by a later migration in the same batch, and every lock is held until the whole batch commits.
- **The migrator compares only against the newest applied migration.** A journal entry whose `when` is older than the last applied one is skipped silently. Editing an applied migration changes fresh databases (tests, CI) but not existing ones.
- **Migrations run automatically at deploy time**, before the new API serves traffic: the one-shot `migrate` service in `docker-compose.yml` runs `node dist/cli/migrate.js` and `api` starts only after it exits successfully (`service_completed_successfully`; the container-hardening skill owns that wiring). The migrator opens its pool with `NO_STATEMENT_TIMEOUT`, so a long migration is not cut off by the request `statement_timeout`. CI (`.github/workflows/playwright.yml`) runs `npm run db:migrate` and `npm run db:check` against PostgreSQL 17. Rolling back the image does not roll back the schema, so the previous release must keep working on the new schema: that is why schema changes are expand/contract here.
- **`updatedAt` uses `$onUpdate`**, which only fires for Drizzle `.update()`. Raw `sql` updates must set `updated_at = now()` themselves.

## Workflow

1. **Classify the change**: schema change, new or changed query, slow query, or multi-row write. Read only the matching reference.
2. **Schema change**:
   1. Edit `apps/api/src/db/schema.ts`. Enum values come from the `*Values` arrays in `packages/shared/src/schema/enums.ts`, so adding one there changes the database enum.
   2. Run `npm run db:generate` and read the SQL against the table in [references/migrations.md](references/migrations.md). Split the change if it needs more than one release (expand, migrate code, contract).
   3. Never let a rename be generated as drop plus add: that deletes the column's data. Generate the add and the drop in separate steps so Drizzle Kit never asks.
   4. For hand-written SQL (backfills, `NOT VALID` constraints, `lock_timeout`), create the file with `npm run db:generate -w @coinkeeper/api -- --custom --name <name>` so the journal and snapshot stay consistent, then write the SQL in it, separating statements with `--> statement-breakpoint`.
   5. Run `npm run db:migrate`, `npm run db:check` and `npm exec -w @coinkeeper/api -- drizzle-kit check`.
   6. Update the Zod contract in `packages/shared/src/schema/<domain>.ts`, the service and the tests in the same change.
3. **Query**: follow the rules in [references/query-rules.md](references/query-rules.md): user scope, live-row filter, `spendingWhere`, sargable date ranges from `monthRange`, parameters rather than `sql.raw`, keyset pagination through `page` in `apps/api/src/modules/ledger/queries.ts`.
4. **Slow query**: measure before changing anything. Seed a throwaway database, capture `EXPLAIN (ANALYZE, BUFFERS)`, change one thing (index, query shape), capture again. See [references/query-plans.md](references/query-plans.md) and [references/indexes.md](references/indexes.md).
5. **Multi-row write or loop of queries**: replace per-row statements with one set-based statement inside one transaction, reusing the helpers in `apps/api/src/modules/batch.ts` (`rowsOf`, `valueList`, `positionedIds`, `assertDistinctIds`, `assertAllFound`, `WRITE_CHUNK_ROWS`) and `chunk` from `packages/shared/src/lib/arrays.ts`. See [references/batching-and-transactions.md](references/batching-and-transactions.md).
6. **Tests**: add or update a PGlite service or route test for every rule touched: an ownership case (other user's id is not found), a rollback case for multi-row writes, and a JPY or KWD case when money is involved (`agents/conventions.md` › Tests).

## References

| File                                                                               | Read it when                                                                                                                                                                                        |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [references/migrations.md](references/migrations.md)                               | Adding or changing columns, constraints, indexes or enum values; writing a backfill; hand-editing `apps/api/drizzle/`.                                                                              |
| [references/indexes.md](references/indexes.md)                                     | Adding, replacing or dropping an index; choosing column order; considering a partial index on `deleted_at IS NULL`.                                                                                 |
| [references/query-plans.md](references/query-plans.md)                             | A list, report or page is slow; reading `EXPLAIN (ANALYZE, BUFFERS)`; seeding test volume; enabling `pg_stat_statements`.                                                                           |
| [references/query-rules.md](references/query-rules.md)                             | Writing or reviewing any service query, raw `sql` fragment or report.                                                                                                                               |
| [references/batching-and-transactions.md](references/batching-and-transactions.md) | Loops that run one query per currency, per id or per CSV row; the set-based reorders, grouped budget and rate queries and atomic CSV import already in place; advisory locks.                       |
| [references/connection-settings.md](references/connection-settings.md)             | Checking or changing the pool's `statement_timeout` (derived from `HANDLER_TIMEOUT_MS`), `idle_in_transaction_session_timeout`, `application_name` or `pool.on('error')` listener; sizing the pool. |
| [references/source.md](references/source.md)                                       | Crediting upstream material.                                                                                                                                                                        |

## Verify

```bash
npm run db:migrate
npm run db:check
npm exec -w @coinkeeper/api -- drizzle-kit check
npm run lint && npm run typecheck && npm test -- --run && npm run build
```

`npm test -- --run` applies every migration to a fresh PGlite database, so a broken migration fails the suite. For performance work, put the `EXPLAIN (ANALYZE, BUFFERS)` output before and after the change in the pull request. Report failures as they are.

## Keep the docs true

Use [agents/docs-map.md](../../../agents/docs-map.md). A schema change updates `agents/data-model.md`, `docs/architecture/data-model.md` and the table in `docs/reference/migrations.md` in the same change; a changed command also updates `README.md`. If nothing in the docs is affected, say so.
