# Database migrations

> Summary: how migrations are written, generated and applied, and what each existing migration did.

## Two histories during the move to the API

The Fastify API (`apps/api`) owns the database from now on. Its schema is `apps/api/src/db/schema.ts` and its history starts again at `apps/api/drizzle/0000_init.sql`, which creates the whole schema (including `users` and `sessions`) and seeds the currencies; there was no production data to carry over. Run its commands with `npm run db:generate -w @coinkeeper/api`, `npm run db:migrate -w @coinkeeper/api` and `npm run db:check -w @coinkeeper/api`. The web app's history below (`apps/web/drizzle/`) is used only by the web app's own server code until the web app is switched to the API; point the two at different databases in the meantime.

| File (`apps/api/drizzle/`) | What it does |
| --- | --- |
| `0000_init.sql` | Every table, enum, constraint and index of the current model: `users`, `sessions`, `currencies`, `user_settings`, `accounts`, `category_groups`, `categories`, `payees`, `transactions`, `exchange_rates`, `budgets`, `rules`. Every `user_id` references `users(id) ON DELETE CASCADE`; `rules`, `budgets` and `exchange_rates` gain `deleted_at`; the import de-duplication index ignores deleted rows. Seeds 27 currencies. |

## Workflow

1. Edit `apps/web/src/db/schema.ts`.
2. `npm run db:generate` writes `apps/web/drizzle/000N_<name>.sql` and a snapshot in `apps/web/drizzle/meta/`. Drizzle Kit needs an interactive terminal when a change is ambiguous (for example an enum rename); in that case answer its prompts, or write the SQL by hand and keep the snapshot consistent.
3. Read the SQL. Add data migrations (`UPDATE`, backfills) by hand where needed; keep every statement separated by `--> statement-breakpoint`.
4. `npm run db:migrate` applies it locally. `npm test -- --run` applies every migration to PGlite from scratch, so a broken migration fails the suite.
5. Never edit a migration that has already been applied somewhere; add a new one.

`npm run db:check` compares the live schema with the result of applying all migrations to an in-memory database and reports any drift without changing anything.

## Existing migrations

| File | What it does |
| --- | --- |
| `0000_initial.sql` | The Prisma-era schema: `Account`, `Payee`, `Transaction`, `MonthlyHistory`, `MonthlyCategoryGroupHistory` with double-precision amounts. Kept so existing databases can be upgraded in order. |
| `0001_ledger.sql` | Creates the current schema (enums, `currencies`, `user_settings`, `accounts`, `category_groups`, `categories`, `payees`, `transactions`, `exchange_rates`, `budgets`, `rules`, constraints and indexes), seeds 27 currencies, migrates legacy rows when the old tables exist, then drops the old tables and enums. |

### Legacy row migration (in `0001_ledger.sql`)

- `Account` → `accounts`: type mapped to the new enum, `classification` set to liability for credit cards, currency `EUR`, soft-delete flags converted to `deleted_at`. A `user_settings` row with primary currency EUR is created per user.
- `Payee` → `payees`: names and soft-delete state.
- `Transaction` → `transactions`: `amount_minor = round(amount × 100)` negated for expenses, currency `EUR`, `date` truncated to a day, `kind = 'standard'`, `status = 'cleared'`, `needs_review = true` (the old category slugs pointed at constants and are dropped), description kept as `memo`.
- The two monthly history tables are dropped without migration; their content is recomputed from the ledger.

The detailed reasoning behind the redesign is in the [legacy proposal](../legacy/redesign-proposal.md).
