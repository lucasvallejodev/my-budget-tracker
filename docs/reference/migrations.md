# Database migrations

> Summary: how migrations are written, generated, checked and applied in the API workspace, what the existing migrations create, why they run without a statement timeout and in one transaction, and how to reset a local database created with the old web-app history.

The API (`apps/api`) owns the database. Its schema is `apps/api/src/db/schema.ts`, its Drizzle Kit configuration `apps/api/drizzle.config.ts` (it reads `DATABASE_URL` from the root `.env`) and its migrations `apps/api/drizzle/`. The root scripts `npm run db:generate`, `db:migrate`, `db:check` and `db:studio` run in that workspace.

## Existing migrations

| File (`apps/api/drizzle/`)                 | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0000_init.sql`                            | Every table, enum, constraint and index of the current model: `users`, `sessions`, `currencies`, `user_settings`, `accounts`, `category_groups`, `categories`, `payees`, `transactions`, `exchange_rates`, `budgets`, `rules`. Every `user_id` references `users(id) ON DELETE CASCADE`; `transactions`, `accounts`, `rules`, `budgets` and `exchange_rates` have `deleted_at`; the import de-duplication index ignores deleted rows. Seeds 27 currencies. |
| `0001_transactions_needs_review_index.sql` | Partial index `transactions_needs_review_idx` on `transactions (user_id) WHERE needs_review AND deleted_at IS NULL`, which answers the review badge count from the index. Written as `CREATE INDEX IF NOT EXISTS` after `SET LOCAL lock_timeout = '5s'`, so it fails fast instead of queueing writes, and a large live database can get the index by hand with `CREATE INDEX CONCURRENTLY` before the deploy.                                              |

The history starts at `0000_init.sql` because no production data existed when the API took over the database. The earlier web-app history (`0000_initial.sql`, the Prisma-era schema, and `0001_ledger.sql`, the ledger schema with its legacy row migration) was removed; it is still in the git history, and the reasoning behind that schema is in the [legacy proposal](../legacy/redesign-proposal.md).

## Workflow

1. Edit `apps/api/src/db/schema.ts`.
2. `npm run db:generate` writes `apps/api/drizzle/000N_<name>.sql` and a snapshot in `apps/api/drizzle/meta/`. Drizzle Kit needs an interactive terminal when a change is ambiguous (for example an enum rename); in that case answer its prompts, or write the SQL by hand and keep the snapshot consistent.
3. Read the SQL. Add data migrations (`UPDATE`, backfills) by hand where needed; keep every statement separated by `--> statement-breakpoint`.
4. `npm run db:migrate` applies it locally. `npm test -- --run` applies every migration to PGlite from scratch (`apps/api/src/test/database.ts`), so a broken migration fails the suite.
5. Never edit a migration that has already been applied somewhere; add a new one.

Hand-written SQL goes in a file created with `npm run db:generate -w @coinkeeper/api -- --custom --name <name>`, so the journal and the snapshot chain stay valid; `npm exec -w @coinkeeper/api -- drizzle-kit check` validates them.

All pending migrations run in one transaction, whichever runner applies them (`npm run db:migrate`, the `migrate` service with `node dist/cli/migrate.js`, or the PGlite tests). So `CREATE INDEX CONCURRENTLY` cannot be used in a migration, locks are held until the whole batch commits (start a migration that alters an existing table with `SET LOCAL lock_timeout`), and a new enum value cannot be used by a later migration in the same batch. The API's pool limits every statement to just under the request timeout, but `cli/migrate.ts` opens it without that limit, so a long migration is not cancelled.

`npm run db:check` (`apps/api/scripts/database.mjs`) compares the live schema with the result of applying all migrations to an in-memory database and reports any drift without changing anything. In the Docker setup, the one-shot `migrate` service applies pending migrations before the API container starts; restarting the API does not run them again.

## Resetting a database created with the old history

A local database that was migrated with the old web-app files has a different `drizzle.__drizzle_migrations` table and tables without `users`, so `npm run db:migrate` fails (typically with `relation "…" already exists`). There is nothing to keep in such a database, so drop both schemas and migrate again:

```bash
docker compose exec postgres psql -U budget_tracker -d budget_tracker \
  -c 'DROP SCHEMA drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
npm run db:migrate
```

Use your `POSTGRES_USER` and `POSTGRES_DB` if they differ from the defaults. Removing the volume (`docker compose down -v`, then `npm run db:up`) has the same effect.
