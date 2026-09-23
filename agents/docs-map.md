# Documentation map

> Summary: which document describes which part of the code, so a change in one place tells you exactly what to update elsewhere.

## Code area → documents to update

| If you change… | Update these human docs (`docs/`) | Update these agent docs | README |
| --- | --- | --- | --- |
| `src/db/schema.ts`, `drizzle/*` | `architecture/data-model.md`, `reference/migrations.md` | `agents/data-model.md` | if a command changed |
| `src/lib/money.ts`, currency rules | `architecture/money.md`, `features/multi-currency.md` | `agents/architecture.md` (rule 1, 5) | — |
| `src/server/accounts/*` | `features/accounts.md`, `reference/api.md` | `agents/architecture.md` catalogue | — |
| `src/server/ledger/*` | `features/transactions.md`, `features/transfers-and-credit-cards.md`, `reference/api.md` | `agents/architecture.md` rules 3–4 | — |
| `src/server/categories/*` (incl. taxonomy, seed) | `features/categories.md`, `reference/default-taxonomy.md` | `agents/architecture.md` rule 6, bootstrap | — |
| `src/server/payees/*` | `features/categories.md` › payee memory | catalogue | — |
| `src/server/reports/*` | `features/dashboard.md`, `features/budgets.md` | `agents/data-model.md` › report predicate | — |
| `src/server/fx/*` | `features/multi-currency.md`, `architecture/money.md` | catalogue | — |
| `src/server/import/*`, `src/server/rules/*` | `features/import.md`, `features/rules.md`, `reference/api.md` | catalogue | — |
| `src/server/budgets/*` | `features/budgets.md`, `reference/api.md` | catalogue | — |
| `src/app/api/*`, `src/app/(main)/actions.ts` | `reference/api.md` | — | — |
| `src/components/**`, styling, hooks | `architecture/frontend.md`, the feature page of the screen | `agents/conventions.md` › Client/Styling | — |
| `src/server/auth/*`, `src/middleware.ts` | `architecture/server.md` › Authentication | `agents/architecture.md` › Bootstrap | — |
| Tests or test tooling | `architecture/testing.md` | `agents/conventions.md` › Tests | — |
| `package.json` scripts, Docker, env vars | `getting-started/setup.md`, `getting-started/commands.md` | — | **yes** (Commands / Setup) |
| Folder layout | `getting-started/project-structure.md` | `agents/README.md` if agent docs moved | **yes** (Repository layout) |
| Sidebar routes (`routes.ts`) | the feature page and `docs/_sidebar.md` if a doc page is added | — | — |

## Document → what it covers

| Document | Covers |
| --- | --- |
| `docs/README.md` | product pitch, doc organisation, quick start |
| `docs/getting-started/*` | setup, commands, folder structure |
| `docs/architecture/overview.md` | layers, request flow, principles, rule enforcement table |
| `docs/architecture/data-model.md` | tables, relationships (mermaid), invariants, legacy migration |
| `docs/architecture/money.md` | minor units, parsing, formatting, currency rules, FX provider |
| `docs/architecture/server.md` | services, conventions, errors, auth/bootstrap, adding a method |
| `docs/architecture/frontend.md` | screens, hooks, forms, pickers, styling, adding a screen |
| `docs/architecture/testing.md` | test kinds, PGlite harness, coverage expectations |
| `docs/features/*.md` | one page per feature: steps, statuses, "How it works" |
| `docs/reference/*.md` | API + actions, migrations, default taxonomy |
| `docs/legacy/*` | frozen history; never update, only add |
| `agents/*.md` | condensed versions for agents; keep in sync with the above |
| `README.md` | repository layout, setup, commands, docs pointers |
| `CLAUDE.md` / `AGENTS.md` | agent operating rules |
