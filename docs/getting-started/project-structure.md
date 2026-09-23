# Project structure

> Summary: what every top-level folder and the main `src/` subfolders contain, and where to look for a given concern.

## Top level

| Path | Contents |
| --- | --- |
| `src/` | Application source (Next.js App Router, components, server layer, database schema). |
| `drizzle/` | SQL migrations and Drizzle snapshots. `0000_initial.sql` is the legacy schema, `0001_ledger.sql` the current one. |
| `scripts/` | Node scripts: `database.mjs` (schema check), `schema-signature.mjs` (its helper) and `eslint-rules/` (local ESLint rules). |
| `e2e/` | Playwright end-to-end tests and their config in `playwright.config.ts`. |
| `docs/` | This documentation (Docsify). `docs/legacy/` holds the original proposal, research and migration notes. `docs/assets/` holds diagrams and screenshots. |
| `agents/` | Documentation written for AI coding agents: condensed architecture, conventions, workflows. Humans can read it too, but the site above is the friendly version. |
| `temp/` | Scratch space for plans, throwaway diagrams and intermediate files. Git-ignored except its README. |
| `public/` | Static assets served by Next.js. |
| `.claude/` | Local tooling configuration (dev-server launch config). |
| `AGENTS.md`, `CLAUDE.md` | Instructions for AI agents working in this repository. |
| `docker-compose.yml`, `Dockerfile`, `.dockerignore` | Local PostgreSQL and the optional app container. |
| `drizzle.config.ts`, `next.config.ts`, `vitest.config.mts`, `eslint.config.mjs`, `.stylelintrc.json`, `.prettierrc.js`, `sonar-project.properties`, `tsconfig.json` | Tool configuration. |
| `.github/workflows/` | CI: `quality.yml` (lint, types, tests, duplication), `sonar.yml` (SonarQube Cloud), `playwright.yml`. |

## Inside `src/`

```
src/
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
├─ schema/                 Zod schemas for form and action input
├─ lib/                    Pure helpers: money.ts (minor units, parsing, formatting), math.ts, date-helpers.ts, patterns.ts (every regex), styles.ts (cn), appearance.ts (theme)
├─ constants/              Named values: account.ts (types, grouping), field-lengths.ts, http.ts, icons.ts (curated lucide registry), money.ts, time.ts
├─ providers/              React Query provider
├─ styles/
│  ├─ abstracts/           Breakpoint mixins, space() and radius() functions, shared mixins (@use 'abstracts' as *)
│  ├─ tokens.scss          CSS colour tokens (light, dark and theme-independent)
│  └─ theme.ts             Colours and chart styles needed from TypeScript (Colors, GroupColors, ChartStyle)
└─ middleware.ts           Clerk route protection
```

## Where to look for…

| Concern | Start at |
| --- | --- |
| A table or column | `src/db/schema.ts`, then the matching migration in `drizzle/` |
| A business rule (what is allowed) | the `service.ts` of that domain in `src/server/` |
| Input validation for a form | `src/schema/*.ts` and the action in `src/app/(main)/actions.ts` |
| A read endpoint | `src/app/api/**/route.ts` |
| A screen | `src/components/finance/<screen>/` and its page under `src/app/(main)/` |
| A shared layout, control or dialog | `src/components/ui/` (barrel: `src/components/ui/index.ts`) |
| Breakpoints, spacing and SCSS mixins | `src/styles/abstracts/` |
| Data fetching hooks and query keys | `src/components/finance/use-finance-data.ts` |
| Money formatting or parsing | `src/lib/money.ts` |
| Default categories | `src/server/categories/default-taxonomy.ts` |
| Available icons | `src/constants/icons.ts` |
