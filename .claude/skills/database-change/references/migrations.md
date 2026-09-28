# Migrations that survive a live database

> Summary: how Drizzle Kit 0.31 and the Drizzle 0.45 migrator apply CoinKeeper's migrations, which PostgreSQL 17 schema changes are safe in one step and which need expand/contract, how to write hand-written SQL without breaking `apps/api/drizzle/meta`, and the traps of the single-transaction migrator.

## How migrations run here

- Files: `apps/api/drizzle/000N_<name>.sql`, `apps/api/drizzle/meta/_journal.json` (one entry per file: `idx`, `version`, `when`, `tag`, `breakpoints`) and `apps/api/drizzle/meta/<NNNN>_snapshot.json` (the schema after that migration, chained by `prevId`). Today: `0000_init` and `0001_transactions_needs_review_index`.
- Runners: `npm run db:migrate` (`drizzle-kit migrate`), the one-shot `migrate` Compose service (`node dist/cli/migrate.js`, which calls `migrate()` from `drizzle-orm/node-postgres/migrator` on a pool opened with `NO_STATEMENT_TIMEOUT`) and the PGlite tests (`apps/api/src/test/database.ts`). All three:
  - read the journal, split each file on `--> statement-breakpoint`;
  - look up the newest row in `drizzle.__drizzle_migrations` and apply every file whose `when` is greater;
  - run the whole pending batch inside one transaction.
- `npm run db:check` (`apps/api/scripts/database.mjs`) applies all migrations to an in-memory PGlite and compares its schema signature with the live database. `drizzle-kit check` validates the journal and snapshot chain. CI (`.github/workflows/playwright.yml`) runs `db:migrate` then `db:check` against a PostgreSQL 17 service; keep both steps.

Consequences of the single transaction:

| Trap                                                                                                                                                                                                       | What to do                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CREATE INDEX CONCURRENTLY` / `DROP INDEX CONCURRENTLY` fail inside a transaction. `index(...).concurrently()` in the schema makes Drizzle Kit emit exactly that.                                          | Do not use `.concurrently()`. See "Indexes on big tables" below.                                                                                                                   |
| `ALTER TYPE … ADD VALUE` works in a transaction, but the new value cannot be used until that transaction commits.                                                                                          | Ship the enum value in one release and its first use (a default, a backfill, a check) in a later release, so they are in different migrator runs.                                  |
| Locks taken by the first statement are held until the last migration of the batch commits.                                                                                                                 | Keep each migration small; put a `SET LOCAL lock_timeout` first so a blocked `ALTER` fails fast instead of queueing every request behind it.                                       |
| `ADD CONSTRAINT … NOT VALID` followed by `VALIDATE CONSTRAINT` in the same batch still holds the strong lock of the `ADD` during validation.                                                               | Validate in a later release, when the add has already committed.                                                                                                                   |
| The API pool sets `statement_timeout` (see `connection-settings.md`), but `cli/migrate.ts` opens its pool with `NO_STATEMENT_TIMEOUT`, so a long statement is not canceled; a blocked one waits for locks. | Rely on `SET LOCAL lock_timeout` to fail fast on locks; no `SET LOCAL statement_timeout = 0` is needed. Keep the migrator on `NO_STATEMENT_TIMEOUT` if you touch `cli/migrate.ts`. |

## Safe on PostgreSQL 17 or not

| Change                                                              | Cost on a live table                                          | Safe way                                                                                                                                                                                                        |
| ------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add a nullable column, or one with a constant default               | Catalog change only, brief `ACCESS EXCLUSIVE`                 | One step. A constant default (`false`, `0`, `''`) does not rewrite the table.                                                                                                                                   |
| Add a column with a volatile default (`now()`, `gen_random_uuid()`) | Full table rewrite                                            | Add it nullable, backfill, then set the default.                                                                                                                                                                |
| Make a column `NOT NULL`                                            | Full scan under `ACCESS EXCLUSIVE`                            | Release 1: `ADD CONSTRAINT <name> CHECK (<col> IS NOT NULL) NOT VALID`. Release 2: `VALIDATE CONSTRAINT`, then `SET NOT NULL` (PostgreSQL skips the scan when a valid check proves it), then `DROP CONSTRAINT`. |
| Add a foreign key                                                   | Scan plus `SHARE ROW EXCLUSIVE` on both tables                | `ADD CONSTRAINT … FOREIGN KEY … NOT VALID`, validate in a later release.                                                                                                                                        |
| Add a `CHECK`                                                       | Scan under `ACCESS EXCLUSIVE`                                 | `NOT VALID`, validate later.                                                                                                                                                                                    |
| Add a unique constraint                                             | Index build blocks writes                                     | Build the unique index (see below), then `ADD CONSTRAINT … UNIQUE USING INDEX <name>`, or keep it as a unique index as the schema already does (`payees_user_name_key`).                                        |
| Change a column type                                                | Usually a rewrite                                             | New column, dual write, backfill, switch reads, drop the old column later.                                                                                                                                      |
| Rename a column or table                                            | Instant, but the running release still uses the old name      | Expand/contract: add the new column, write both, backfill, read the new one, drop the old one in a later release.                                                                                               |
| Drop a column                                                       | Instant, but the previous release may still select it         | Stop using it in code and contracts first; drop it one release later.                                                                                                                                           |
| Remove or rename an enum value                                      | Drizzle Kit recreates the type with casts                     | Avoid. Stop writing the value, keep it in the type.                                                                                                                                                             |
| Add an index                                                        | `CREATE INDEX` blocks writes to the table for the whole build | Small tables (everything except `transactions` at scale): plain `CREATE INDEX` in the migration. Big tables: see below.                                                                                         |

Expand/contract matters even with one API container: the image can be rolled back but the schema cannot, and a web container from the previous release may still send the old contract for a moment.

## Indexes on big tables

`CREATE INDEX CONCURRENTLY` cannot run through the migrator. When `transactions` is large enough that a blocking build matters:

1. Build it by hand on the live database before deploying: `CREATE INDEX CONCURRENTLY IF NOT EXISTS <name> ON … ;` (`docker compose exec postgres psql -U budget_tracker -d budget_tracker`). If it fails, it leaves an `INVALID` index: `DROP INDEX CONCURRENTLY <name>` and retry.
2. Declare the same index in `schema.ts` (without `.concurrently()`), generate, and edit the generated statement to `CREATE INDEX IF NOT EXISTS …` so fresh databases (tests, CI, new installs) build it and the live one skips it.
3. Replacing an index: add the new one in one release, drop the old one in the next.

## Hand-written SQL

- Create the file with `npm run db:generate -w @coinkeeper/api -- --custom --name <name>`. Drizzle Kit writes an empty `000N_<name>.sql`, a journal entry and a snapshot copy, so the chain stays valid. The root `npm run db:generate -- …` does not forward the flags to the workspace.
- When `db:generate` needs an interactive terminal (a drop and an add in the same diff), do not fake the answer: split the schema change so each generate is unambiguous, or ask the user to run it in a terminal. If SQL must be written by hand without `--custom`, add the journal entry with a `when` greater than every existing one and a snapshot whose `prevId` is the previous snapshot's `id`, then run `drizzle-kit check` and `npm run db:check`.
- Separate statements with `--> statement-breakpoint`.
- Put `SET LOCAL lock_timeout = '5s';` first in any migration that alters an existing table (tune the value; the setting lasts until the batch commits). `0001_transactions_needs_review_index.sql` is the house example: `SET LOCAL lock_timeout`, then `CREATE INDEX IF NOT EXISTS` for a partial index, so a database where it was built by hand skips it.
- Backfills: one `UPDATE … WHERE <new_col> IS NULL` is fine at our size. When a table is large, run the backfill in batches outside the migrator (a script or psql loop) and keep only the constraint steps in migrations; one huge `UPDATE` inside the batch holds row locks until the batch commits.
- Never `DELETE` financial rows in a data migration. Set `deleted_at` or `archived_at` instead.
- Never edit a migration that has run anywhere; add a new one.

## Example: make an existing nullable column mandatory in two releases

Release 1 (`--custom` migration after adding the nullable column and backfilling):

```sql
SET LOCAL lock_timeout = '5s';
--> statement-breakpoint
UPDATE "transactions" SET "original_payee" = '' WHERE "original_payee" IS NULL;
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_original_payee_not_null" CHECK ("original_payee" IS NOT NULL) NOT VALID;
```

Release 2:

```sql
SET LOCAL lock_timeout = '5s';
--> statement-breakpoint
ALTER TABLE "transactions" VALIDATE CONSTRAINT "transactions_original_payee_not_null";
--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "original_payee" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_original_payee_not_null";
```

The column is only an illustration; `original_payee` is intentionally nullable today. Mirror the final state in `schema.ts` (`.notNull()`) in release 2 and confirm `npm run db:check` reports no drift.
