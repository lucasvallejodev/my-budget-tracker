# Database migrations

> Summary: how migrations are written, generated, checked and applied in the API workspace, what the existing migration creates, and how to reset a local database created with the old web-app history.

The API (`apps/api`) owns the database. Its schema is `apps/api/src/db/schema.ts`, its Drizzle Kit configuration `apps/api/drizzle.config.ts` (it reads `DATABASE_URL` from the root `.env`) and its migrations `apps/api/drizzle/`. The root scripts `npm run db:generate`, `db:migrate`, `db:check` and `db:studio` run in that workspace.

## Existing migrations

| File (`apps/api/drizzle/`) | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0000_init.sql`            | Every table, enum, constraint and index of the current model: `users`, `sessions`, `currencies`, `user_settings`, `accounts`, `category_groups`, `categories`, `payees`, `transactions`, `exchange_rates`, `budgets`, `rules`. Every `user_id` references `users(id) ON DELETE CASCADE`; `transactions`, `accounts`, `rules`, `budgets` and `exchange_rates` have `deleted_at`; the import de-duplication index ignores deleted rows. Seeds 27 currencies. |

The history starts at `0000_init.sql` because no production data existed when the API took over the database. The earlier web-app history (`0000_initial.sql`, the Prisma-era schema, and `0001_ledger.sql`, the ledger schema with its legacy row migration) was removed; it is still in the git history, and the reasoning behind that schema is in the [legacy proposal](../legacy/redesign-proposal.md).

## Workflow

1. Edit `apps/api/src/db/schema.ts`.
2. `npm run db:generate` writes `apps/api/drizzle/000N_<name>.sql` and a snapshot in `apps/api/drizzle/meta/`. Drizzle Kit needs an interactive terminal when a change is ambiguous (for example an enum rename); in that case answer its prompts, or write the SQL by hand and keep the snapshot consistent.
3. Read the SQL. Add data migrations (`UPDATE`, backfills) by hand where needed; keep every statement separated by `--> statement-breakpoint`.
4. `npm run db:migrate` applies it locally. `npm test -- --run` applies every migration to PGlite from scratch (`apps/api/src/test/database.ts`), so a broken migration fails the suite.
5. Never edit a migration that has already been applied somewhere; add a new one.

`npm run db:check` (`apps/api/scripts/database.mjs`) compares the live schema with the result of applying all migrations to an in-memory database and reports any drift without changing anything. In the Docker setup, the API container applies pending migrations when it starts.

## Resetting a database created with the old history

A local database that was migrated with the old web-app files has a different `drizzle.__drizzle_migrations` table and tables without `users`, so `npm run db:migrate` fails (typically with `relation "…" already exists`). There is nothing to keep in such a database, so drop both schemas and migrate again:

```bash
docker compose exec postgres psql -U budget_tracker -d budget_tracker \
  -c 'DROP SCHEMA drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
npm run db:migrate
```

Use your `POSTGRES_USER` and `POSTGRES_DB` if they differ from the defaults. Removing the volume (`docker compose down -v`, then `npm run db:up`) has the same effect.
