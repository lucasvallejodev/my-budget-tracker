# Database migrations

> Summary: how migrations are written, generated and applied, and what each existing migration did.

## Workflow

1. Edit `src/db/schema.ts`.
2. `npm run db:generate` writes `drizzle/000N_<name>.sql` and a snapshot in `drizzle/meta/`. Drizzle Kit needs an interactive terminal when a change is ambiguous (for example an enum rename); in that case answer its prompts, or write the SQL by hand and keep the snapshot consistent.
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
