# CoinKeeper

Personal budget tracker built with Next.js, Clerk, Drizzle ORM and PostgreSQL.

## What it does

- **Ledger of signed integer amounts** (minor units + ISO currency) per account; balances, net worth and monthly reports are SQL aggregates, never stored counters.
- **Multi-currency**: each account has one currency; every figure is shown per currency. Optional converted totals use manually entered exchange rates (Settings → Currencies) behind a pluggable `RateProvider`.
- **Transfers and credit cards**: a transfer is two linked legs (one per account) with no category, so paying a card never counts as spending. Cards and loans are liabilities shown as amounts owed, with a "Pay card" shortcut.
- **User-managed categories** in coloured groups, seeded from a default taxonomy on first sign-in; categories carry an icon from a curated registry, groups carry the colour. Archive with "move transactions to…" instead of deleting.
- **Review inbox** for uncategorised or imported entries, with payee memory and text rules.
- **CSV import** with column mapping, idempotent import ids, matching against manual entries and transfer-pair suggestions.
- **Budgets**: monthly limits per category and currency compared with the ledger.

The design rationale, data model and roadmap are in [docs/redesign-proposal.md](docs/redesign-proposal.md); research notes are in [docs/research](docs/research).

## Local setup

1. Install Node.js 22+ and Docker Desktop (with the Docker engine running).
2. Run `npm ci`.
3. Copy `.env.example` to `.env` if you do not already have a local environment. Set the Clerk keys and choose a URL-safe PostgreSQL password. Use the same password in `POSTGRES_PASSWORD` and `DATABASE_URL`.
4. Start PostgreSQL: `npm run db:up`.
5. Apply the schema to the new local database: `npm run db:migrate`.
6. Verify it: `npm run db:check`.
7. Start the app: `npm run dev` and open http://localhost:3000.

The local environment has been configured for PostgreSQL at `localhost:5432`. No hosted records are automatically imported. The app uses a normal pooled PostgreSQL connection; no ORM proxy or generated client is needed.

## Database commands

| Command               | Purpose                                                            |
| --------------------- | ------------------------------------------------------------------ |
| `npm run db:up`       | Start the PostgreSQL Compose service                               |
| `npm run db:down`     | Stop Compose services; preserve the named data volume              |
| `npm run db:generate` | Generate reviewed SQL migrations after changing `src/db/schema.ts` |
| `npm run db:migrate`  | Apply pending SQL migrations                                       |
| `npm run db:check`    | Read-only check that the live schema matches all migrations        |
| `npm run db:studio`   | Open Drizzle Studio                                                |

Migrations are plain SQL under `drizzle/`. Migration `0001_ledger` introduced the current schema (integer minor units, per-account currency, user-managed categories, paired transfers) and migrates rows from the legacy `Account`/`Payee`/`Transaction` tables when they exist; legacy rows land in the review inbox because their hard-coded category slugs no longer apply.

PostgreSQL runs as `postgres:17-alpine`, binds only to `127.0.0.1`, and persists data in the `budget-postgres-data` named volume. Changing credentials in `.env` does not rotate credentials in an already initialized volume. Do not remove the volume to change a password or upgrade the database; manage those changes explicitly.

## Run the app in Docker

After initializing the database using the host-side migration commands above:

```sh
docker compose --profile app up -d --build
```

The app container connects to the `postgres` service over the Compose network. It waits for database health but does not run migrations on startup. Public Clerk configuration is supplied at image build time; private keys are supplied at runtime. Local `.env` files are excluded from Docker build context.

## Checks

```sh
npm run lint
npm test -- --run
npm run build
```

Database integration tests use isolated PostgreSQL via PGlite. They do not connect to the configured database or require Docker.

See [DRIZZLE_MIGRATION.md](./DRIZZLE_MIGRATION.md) for the ORM migration record and [STYLE_MIGRATION.md](./STYLE_MIGRATION.md) for the SCSS component migration.
