# Project structure

> Summary: the npm workspaces (`apps/api`, `apps/web`, `packages/shared`), what every top-level folder and the main source subfolders contain, and where to look for a given concern.

## Top level

The repository is an npm workspaces monorepo (`workspaces` in the root `package.json`). Run every command from the root; `npm run <script> -w <workspace>` targets one workspace.

| Path                                                                                                                                                                           | Contents                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/`                                                                                                                                                                    | Workspace `@coinkeeper/api`: the Fastify REST API (`src/`), which owns the database: migrations (`drizzle/`), `drizzle.config.ts`, `tsup.config.ts`, `vitest.config.mts` and database scripts (`scripts/database.mjs` for `db:check`, `schema-signature.mjs`). Details in [API service](../architecture/api.md).                                                                                            |
| `apps/web/`                                                                                                                                                                    | Workspace `@coinkeeper/web`: the Next.js client (`src/`), with no server code or database access of its own; `next.config.ts` (rewrite of `/api/*` to the API, security headers), `vitest.config.mts`, `tsconfig.json`.                                                                                                                                                                                     |
| `packages/shared/`                                                                                                                                                             | Workspace `@coinkeeper/shared`: code used by both the web app and the API. `src/schema/` (Zod request and response contracts, enum value lists), `src/lib/` (money, patterns, dates, CSV parser) and `src/constants/` (field lengths, money and time units, icon names, category-group palette). Imported by path: `@coinkeeper/shared/lib/money`. No build step; consumers compile the TypeScript sources. |
| `apps/api/drizzle/`                                                                                                                                                            | SQL migrations and Drizzle snapshots. `0000_init.sql` creates the whole schema. See [Database migrations](../reference/migrations.md).                                                                                                                                                                                                                                                                      |
| `scripts/`                                                                                                                                                                     | Repository tooling: local ESLint rules (`eslint-rules/`) and Stylelint rules (`stylelint-rules/`) with their tests.                                                                                                                                                                                                                                                                                         |
| `e2e/`                                                                                                                                                                         | Playwright end-to-end tests and their config in `playwright.config.ts`.                                                                                                                                                                                                                                                                                                                                     |
| `docs/`                                                                                                                                                                        | This documentation (Docsify). `docs/legacy/` holds the original proposal, research and migration notes. `docs/assets/` holds diagrams and screenshots.                                                                                                                                                                                                                                                      |
| `agents/`                                                                                                                                                                      | Documentation written for AI coding agents: condensed architecture, conventions, workflows. Humans can read it too, but the site above is the friendly version.                                                                                                                                                                                                                                             |
| `temp/`                                                                                                                                                                        | Scratch space for plans, throwaway diagrams and intermediate files. Git-ignored except its README.                                                                                                                                                                                                                                                                                                          |
| `apps/web/public/`                                                                                                                                                             | Static assets served by Next.js.                                                                                                                                                                                                                                                                                                                                                                            |
| `.claude/`                                                                                                                                                                     | Local tooling configuration (dev-server launch config).                                                                                                                                                                                                                                                                                                                                                     |
| `AGENTS.md`, `CLAUDE.md`                                                                                                                                                       | Instructions for AI agents working in this repository.                                                                                                                                                                                                                                                                                                                                                      |
| `docker-compose.yml`, `Dockerfile`, `.dockerignore`                                                                                                                            | Local PostgreSQL and the optional `api` and `web` containers.                                                                                                                                                                                                                                                                                                                                               |
| `tsconfig.base.json`, `tsconfig.json`, `vitest.config.mts`, `eslint.config.mjs`, `.stylelintrc.json`, `.prettierrc.js`, `knip.json`, `.jscpd.json`, `sonar-project.properties` | Repository-wide tool configuration. Every workspace has its own `tsconfig.json` (extending `tsconfig.base.json`) and `vitest.config.mts`; the root Vitest config runs them as projects (`api`, `web`, `shared`, plus `tooling` for the lint-rule tests).                                                                                                                                                    |
| `.github/workflows/`                                                                                                                                                           | CI: `quality.yml` (lint, types, tests, duplication), `sonar.yml` (SonarQube Cloud), `playwright.yml`.                                                                                                                                                                                                                                                                                                       |

## Inside `apps/api/src/`

```
apps/api/src/
├─ server.ts               Entry point: loads .env, opens the pool, builds the app, listens, purges expired sessions
├─ app.ts                  buildApp({ config, db }): plugins, services and routes (tests use it without listening)
├─ config.ts               Environment variables validated with Zod
├─ environment.ts          Reads the root .env and opens the database for the server and the CLI
├─ auth/                   passwords.ts (argon2id), sessions.ts (session store), service.ts (sign-up, sign-in, profile, password)
├─ plugins/                security.ts, authentication.ts, error-handler.ts, openapi.ts, context.ts
├─ routes/                 One Fastify plugin per resource, index.ts (public and authenticated scopes), inputs.ts, responses.ts, *.test.ts
├─ modules/                Domain services (business rules and SQL), one folder per domain
│  ├─ accounts/ budgets/ categories/ fx/ import/ ledger/ payees/ reports/ rules/
│  ├─ services.ts          createServices(db): builds every service on one database handle
│  ├─ db.ts                Db type, ServiceError, notFound(), conflict()
│  ├─ errors.ts            PostgreSQL unique and foreign-key violation checks
│  └─ services.test.ts     Service tests on PGlite
├─ db/                     schema.ts (Drizzle tables and enums), index.ts (node-postgres pool), connection.ts (DATABASE_URL checks)
├─ constants/http.ts       HTTP status codes
├─ cli/reset-password.ts   npm run user:reset-password -- <email>
└─ test/                   database.ts (PGlite with every migration, insertUser), app.ts (createTestApp, signUp)
```

## Inside `apps/web/src/`

```
apps/web/src/
├─ app/                    Next.js App Router (pages only; no route handlers or server actions)
│  ├─ (auth)/              sign-in/ and sign-up/ pages rendering AuthForm inside AuthScreen
│  ├─ (main)/              Signed-in pages (dashboard, transactions, accounts, budgets, settings, settings/deleted, …)
│  │  └─ routes.ts         Sidebar navigation entries
│  ├─ layout.tsx           Root layout with the React Query provider and the toaster
│  └─ globals.scss         Resets (in @layer reset) and the cascade-layer order
├─ api/
│  ├─ client.ts            apiRequest, apiGet, apiList, apiPages, ApiError (relative /api/v1 URLs, 401 → /sign-in)
│  └─ mutations.ts         One function per write (createAccount, deleteTransaction, signIn, …)
├─ components/             One folder per component: <name>.tsx, <name>.test.tsx, index.ts, <name>.scss
│  ├─ ui/                  Project-wide building blocks: layout, content, form controls, dialogs (Radix-based)
│  ├─ finance/             Finance components and screens, plus use-finance-data.ts (hooks, QueryKeys, FinanceKeys) and sample-data.ts
│  ├─ shell/               Application shell, auth screen and form, user menu, logo, theme toggle
│  └─ structure.test.ts    Checks the folder contract
├─ lib/                    Web-only helpers: math.ts, styles.ts (cn), appearance.ts (theme), hydration.ts (useHydrated)
├─ constants/              account.ts (type labels, grouping), icons.ts (lucide component for every shared icon name)
├─ providers/              React Query provider
├─ styles/
│  ├─ abstracts/           Breakpoint mixins, space() and radius() functions, shared mixins (@use 'abstracts' as *)
│  ├─ tokens.scss          CSS colour tokens (light, dark and theme-independent)
│  └─ theme.ts             Colours and chart styles needed from TypeScript (Colors, GroupColors, ChartStyle)
├─ types/                  Shared UI types (route-item.ts)
└─ proxy.ts                Page guard (Next.js 16 middleware): no session cookie → /sign-in?next=…
```

## Inside `packages/shared/src/`

```
packages/shared/src/
├─ schema/        Zod contracts per domain: input schemas (…FormSchema) and response schemas (…Schema) with inferred types; enums.ts feeds the database enums
├─ lib/           money.ts (minor units, parsing, formatting), patterns.ts (every regex), date-helpers.ts, csv.ts (bank export parser)
└─ constants/     field-lengths.ts, money.ts, time.ts, icon-names.ts (curated icon names), palette.ts (category-group colours)
```

## Where to look for…

| Concern                                  | Start at                                                                                                                                |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| A table or column                        | `apps/api/src/db/schema.ts`, then the matching migration in `apps/api/drizzle/`                                                         |
| A business rule (what is allowed)        | the `service.ts` of that domain in `apps/api/src/modules/`                                                                              |
| An endpoint                              | `apps/api/src/routes/<resource>.ts`; the list is in the [REST API reference](../reference/rest-api.md)                                  |
| Input validation for a form or a request | `packages/shared/src/schema/*.ts` (used by the form and by the route)                                                                   |
| Sign-in, sessions, cookies               | `apps/api/src/auth/`, `apps/api/src/plugins/authentication.ts`; in the client `apps/web/src/proxy.ts` and `components/shell/auth-form/` |
| The call behind a button                 | `apps/web/src/api/mutations.ts`                                                                                                         |
| A screen                                 | `apps/web/src/components/finance/<screen>/` and its page under `apps/web/src/app/(main)/`                                               |
| A shared layout, control or dialog       | `apps/web/src/components/ui/` (barrel: `apps/web/src/components/ui/index.ts`)                                                           |
| Breakpoints, spacing and SCSS mixins     | `apps/web/src/styles/abstracts/`                                                                                                        |
| Data fetching hooks and query keys       | `apps/web/src/components/finance/use-finance-data.ts`                                                                                   |
| Money formatting or parsing              | `packages/shared/src/lib/money.ts`                                                                                                      |
| Default categories                       | `apps/api/src/modules/categories/default-taxonomy.ts`                                                                                   |
| Available icons                          | `packages/shared/src/constants/icon-names.ts` (names) and `apps/web/src/constants/icons.ts` (lucide components)                         |
