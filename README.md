# CoinKeeper

Personal budget and spending tracker built with Next.js, Clerk, Drizzle ORM and PostgreSQL. It keeps a ledger of every movement of money across your accounts, in the currency of each account, and turns it into balances, net worth, spending breakdowns, budgets and a review inbox.

- **Exact money**: signed integer minor units plus a currency code; nothing is stored as a float.
- **One ledger, many views**: balances, net worth, reports and budgets are all queries over the same table.
- **Per currency, always**: every figure is shown per currency; a converted total is optional and labelled with the rate it used.
- **Transfers are not spending**: moving money between your own accounts, including paying a credit card, never appears in reports.
- **Your categories**: coloured groups and iconed categories, seeded with defaults and fully editable; archiving keeps history.
- **Review before you trust**: uncategorised and imported entries wait in an inbox; rules and payee memory pre-fill categories.

Full documentation lives in [`docs/`](docs/README.md) and is served as a Docsify site with `npm run docs`.

## Repository layout

| Folder | What is inside |
| --- | --- |
| `src/` | The application. `app/` (Next.js routes, server actions, API route handlers), `components/` (screens, primitives, shell, icons), `server/` (domain services: accounts, categories, ledger, payees, reports, fx, import, rules, budgets), `db/` (Drizzle schema and connection), `schema/` (Zod input schemas), `lib/` (money, dates, styles helpers). Details in [docs/getting-started/project-structure.md](docs/getting-started/project-structure.md). |
| `drizzle/` | SQL migrations and Drizzle snapshots. Apply with `npm run db:migrate`. |
| `scripts/` | Database schema check (`npm run db:check`) and local ESLint rules (`scripts/eslint-rules/`). |
| `e2e/` | Playwright tests (`npm run test:e2e`) and `playwright.config.ts` at the root. |
| `docs/` | Human documentation (Docsify): setup, architecture, data model, feature guides, reference. `docs/legacy/` keeps the original proposal, research and migration notes; `docs/assets/` holds diagrams and screenshots. |
| `agents/` | Documentation written for AI coding agents: condensed architecture, data model, conventions, workflows and a code-to-docs map. Start at [agents/README.md](agents/README.md). |
| `temp/` | Scratch space for plans, throwaway diagrams and intermediate files. Git-ignored except its README. |
| `public/` | Static assets. |
| `AGENTS.md`, `CLAUDE.md` | Operating rules for AI agents working in this repository. |
| `docker-compose.yml`, `Dockerfile` | Local PostgreSQL 17 and an optional app container. |

## Setup

Prerequisites: Node.js 22+, Docker Desktop, a Clerk application (publishable and secret key).

```bash
npm ci
cp .env.example .env          # set Clerk keys and a URL-safe POSTGRES_PASSWORD (also inside DATABASE_URL)
npm run db:up                 # start PostgreSQL 17 in Docker
npm run db:migrate            # apply the SQL migrations (also seeds the currencies table)
npm run db:check              # optional: verify the live schema matches the migrations
npm run dev                   # http://localhost:3000
```

Sign in through Clerk. The first request creates your settings and seeds the default categories. Step-by-step details and troubleshooting: [docs/getting-started/setup.md](docs/getting-started/setup.md).

To run the app itself in Docker after migrating from the host:

```bash
docker compose --profile app up -d --build
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server with Turbopack |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` / `npm run lint:fix` | ESLint (Next.js, type-aware TypeScript, SonarJS, layout and Prettier rules) and Stylelint; `lint:fix` applies every automatic fix |
| `npm run lint:dupes` | Duplicated code report (jscpd, fails above 3 %) |
| `npm run knip` | Unused files, exports and dependencies |
| `npm run format` / `npm run format:check` | Prettier |
| `npm test -- --run` | Vitest: unit, component and PGlite database tests |
| `npm run test:coverage` | Same with an lcov coverage report (used by the SonarQube Cloud workflow) |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run db:up` / `npm run db:down` | Start / stop the PostgreSQL container (data volume is kept) |
| `npm run db:generate` | Generate a migration from `src/db/schema.ts` changes |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:check` | Read-only schema comparison against all migrations |
| `npm run db:studio` | Drizzle Studio |
| `npm run docs` | Serve the documentation site on http://localhost:3010 |

Before committing, run the full gate:

```bash
npm run lint && npx tsc --noEmit && npm test -- --run && npm run build
```

## Documentation

| Where | For whom | Contents |
| --- | --- | --- |
| [docs/](docs/README.md) | people | setup, commands, project structure, architecture, data model, money handling, every feature step by step, API reference, migrations, default categories |
| [agents/](agents/README.md) | AI agents | condensed architecture and data model, conventions, workflows, code-to-docs map |
| [docs/legacy/](docs/legacy/README.md) | history | the redesign proposal, research reports and earlier migration notes |

Screenshots in the feature guides are placeholders (`<!-- screenshot: … -->`) until the design settles.
