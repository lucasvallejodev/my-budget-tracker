# Project structure

> Summary: the npm workspaces (`apps/web`, `packages/shared`), what every top-level folder and the main source subfolders contain, and where to look for a given concern.

## Top level

The repository is an npm workspaces monorepo (`workspaces` in the root `package.json`). Run every command from the root; `npm run <script> -w <workspace>` targets one workspace.

| Path | Contents |
| --- | --- |
| `apps/web/` | Workspace `@coinkeeper/web`: the Next.js application (`src/`), its migrations (`drizzle/`), `next.config.ts`, `drizzle.config.ts`, `vitest.config.mts`, `tsconfig.json` and database scripts (`scripts/database.mjs` for `db:check`, `schema-signature.mjs`). |
| `packages/shared/` | Workspace `@coinkeeper/shared`: code used by both the client and the server. `src/schema/` (Zod request and response contracts, enum value lists), `src/lib/` (money, patterns, dates, CSV parser) and `src/constants/` (field lengths, money and time units, icon names, category-group palette). Imported by path: `@coinkeeper/shared/lib/money`. No build step; consumers compile the TypeScript sources. |
| `apps/web/drizzle/` | SQL migrations and Drizzle snapshots. `0000_initial.sql` is the legacy schema, `0001_ledger.sql` the current one. |
| `scripts/` | Repository tooling: local ESLint rules (`eslint-rules/`) and Stylelint rules (`stylelint-rules/`) with their tests. |
| `e2e/` | Playwright end-to-end tests and their config in `playwright.config.ts`. |
| `docs/` | This documentation (Docsify). `docs/legacy/` holds the original proposal, research and migration notes. `docs/assets/` holds diagrams and screenshots. |
| `agents/` | Documentation written for AI coding agents: condensed architecture, conventions, workflows. Humans can read it too, but the site above is the friendly version. |
| `temp/` | Scratch space for plans, throwaway diagrams and intermediate files. Git-ignored except its README. |
| `apps/web/public/` | Static assets served by Next.js. |
| `.claude/` | Local tooling configuration (dev-server launch config). |
| `AGENTS.md`, `CLAUDE.md` | Instructions for AI agents working in this repository. |
| `docker-compose.yml`, `Dockerfile`, `.dockerignore` | Local PostgreSQL and the optional app container. |
| `tsconfig.base.json`, `tsconfig.json`, `vitest.config.mts`, `eslint.config.mjs`, `.stylelintrc.json`, `.prettierrc.js`, `knip.json`, `.jscpd.json`, `sonar-project.properties` | Repository-wide tool configuration. Every workspace has its own `tsconfig.json` (extending `tsconfig.base.json`) and `vitest.config.mts`; the root Vitest config runs them as projects (`web`, `shared`, plus `tooling` for the lint-rule tests). |
| `.github/workflows/` | CI: `quality.yml` (lint, types, tests, duplication), `sonar.yml` (SonarQube Cloud), `playwright.yml`. |

## Inside `apps/web/src/`

```
apps/web/src/
├─ app/                    Next.js App Router
│  ├─ (auth)/              Clerk sign-in and sign-up pages
│  ├─ (main)/              Authenticated pages (dashboard, transactions, accounts, …)
│  │  ├─ actions.ts        Every server action (mutations), grouped by domain
│  │  └─ routes.ts         Sidebar navigation entries
│  ├─ api/                 Route handlers (read endpoints consumed by React Query)
│  ├─ layout.tsx           Root layout with Clerk and React Query providers
│  └─ globals.scss         Resets (in @layer reset) and the cascade-layer order
├─ components/             One folder per component: <name>.tsx, <name>.test.tsx, index.ts, <name>.scss
│  ├─ ui/                  Project-wide building blocks: layout, content, form controls, dialogs (Radix-based)
│  ├─ finance/             Finance components and screens, plus use-finance-data.ts and sample-data.ts
│  ├─ shell/               Application shell, auth screen, logo, theme toggle
│  └─ structure.test.ts    Checks the folder contract
├─ server/                 Domain services (business rules and SQL), one folder per domain
│  ├─ accounts/ categories/ ledger/ payees/ reports/ fx/ import/ rules/ budgets/
│  ├─ auth/require-user.ts Resolves the Clerk user and bootstraps their data
│  ├─ services.ts          Builds every service on top of one database handle
│  ├─ http.ts              Route-handler wrapper (auth, JSON, error mapping)
│  └─ db.ts                Shared Db type and ServiceError
├─ db/
│  ├─ schema.ts            Drizzle schema: tables, enums, relations
│  ├─ index.ts             Lazy node-postgres pool
│  └─ connection.ts        DATABASE_URL validation
├─ lib/                    Web-only helpers: math.ts, styles.ts (cn), appearance.ts (theme)
├─ constants/              Web and server values: account.ts (type labels, grouping), http.ts (status codes), icons.ts (lucide component for every shared icon name)
├─ providers/              React Query provider
├─ styles/
│  ├─ abstracts/           Breakpoint mixins, space() and radius() functions, shared mixins (@use 'abstracts' as *)
│  ├─ tokens.scss          CSS colour tokens (light, dark and theme-independent)
│  └─ theme.ts             Colours and chart styles needed from TypeScript (Colors, GroupColors, ChartStyle)
└─ middleware.ts           Clerk route protection
```

## Inside `packages/shared/src/`

```
packages/shared/src/
├─ schema/        Zod contracts per domain: input schemas (…FormSchema) and response schemas (…Schema) with inferred types; enums.ts feeds the database enums
├─ lib/           money.ts (minor units, parsing, formatting), patterns.ts (every regex), date-helpers.ts, csv.ts (bank export parser)
└─ constants/     field-lengths.ts, money.ts, time.ts, icon-names.ts (curated icon names), palette.ts (category-group colours)
```

## Where to look for…

| Concern | Start at |
| --- | --- |
| A table or column | `apps/web/src/db/schema.ts`, then the matching migration in `apps/web/drizzle/` |
| A business rule (what is allowed) | the `service.ts` of that domain in `apps/web/src/server/` |
| Input validation for a form | `packages/shared/src/schema/*.ts` and the action in `apps/web/src/app/(main)/actions.ts` |
| A read endpoint | `apps/web/src/app/api/**/route.ts` |
| A screen | `apps/web/src/components/finance/<screen>/` and its page under `apps/web/src/app/(main)/` |
| A shared layout, control or dialog | `apps/web/src/components/ui/` (barrel: `apps/web/src/components/ui/index.ts`) |
| Breakpoints, spacing and SCSS mixins | `apps/web/src/styles/abstracts/` |
| Data fetching hooks and query keys | `apps/web/src/components/finance/use-finance-data.ts` |
| Money formatting or parsing | `packages/shared/src/lib/money.ts` |
| Default categories | `apps/web/src/server/categories/default-taxonomy.ts` |
| Available icons | `packages/shared/src/constants/icon-names.ts` (names) and `apps/web/src/constants/icons.ts` (lucide components) |
