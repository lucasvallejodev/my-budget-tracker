# CLAUDE.md

Operating rules for AI agents in the CoinKeeper repository. `AGENTS.md` points here.

## What this project is

A personal budget and spending tracker: Next.js 16 App Router, React 19, TanStack Query, Drizzle ORM on PostgreSQL 17, Clerk auth, Zod, SCSS modules, Vitest + PGlite, Playwright. Money is stored as signed integer minor units with a currency code; balances and reports are SQL over the `transactions` ledger; transfers are paired rows that never count as spending; categories are per-user data in coloured groups.

## Where things live

| Path                                   | Purpose                                                                                                                                                                                                                       |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents/`                              | Documentation written for agents. **Start at `agents/README.md`**, an index with a one-line description per file. Every file begins with a `> Summary:` line, so `head -3 <file>` reveals its content without reading it all. |
| `docs/`                                | Human documentation, a Docsify site (`npm run docs`). `docs/_sidebar.md` is its index; every page also starts with a `> Summary:` line. `docs/legacy/` is frozen history: never edit, only add.                               |
| `temp/`                                | The only place for temporary files: plans, scratch diagrams, intermediate outputs, exports, screenshots before they are placed. Git-ignored except `temp/README.md`.                                                          |
| `README.md`                            | Repository layout, setup, commands, pointers to the docs.                                                                                                                                                                     |
| `apps/api/`, `apps/web/`, `packages/shared/` | npm workspaces: the Fastify API (`src/`, `drizzle/` migrations, `scripts/` DB check), the Next.js app and the code shared by both (Zod contracts, money/date/CSV helpers, constants). See `agents/architecture.md`. |
| `scripts/`, `e2e/`                     | Local lint rules and Playwright tests.                                                                                                                                                                                        |

## Rules for every prompt

1. **Read the index first.** Open `agents/README.md`, then only the agent docs the task needs (`architecture.md` for server or data-flow work, `data-model.md` for schema or SQL, `conventions.md` before writing code, `components.md` before creating, moving or styling a component, `workflows.md` for the checklist of the change you are making, `docs-map.md` to find which docs describe the code you touch).
2. **Temporary files go in `temp/`.** Any plan, diagram, note, generated report or scratch file that is not part of the product or its documentation must be written under `temp/` (ideally `temp/<task-name>/`). Never put such files in `docs/`, `agents/`, `apps/`, `packages/` or the repository root, and never link to `temp/` from tracked files.
3. **Keep the documentation true, as part of the same change.** Before you finish a task that changes behaviour, structure, commands, setup, data model, API or conventions, update:
   - the human docs in `docs/` (use `agents/docs-map.md` to find the pages; add a page and a `docs/_sidebar.md` entry for a new feature; keep `> Summary:` lines accurate; leave `<!-- screenshot: what to capture (docs/assets/screenshots/name.png) -->` placeholders where a screenshot belongs);
   - the agent docs in `agents/` (architecture, data model, conventions, workflows, docs map, and the index in `agents/README.md` when files are added);
   - `README.md` when folders, setup steps or commands change.
     If nothing in the docs is affected, say so explicitly in your final message. Do not leave documentation for "later".
4. **Verify before you claim.** Run `npm run lint && npm run typecheck && npm test -- --run && npm run build` for code changes; add or update tests for every rule you touch (`agents/conventions.md` › Tests). Report failures honestly.
5. **Commits.** Only commit when asked. Never add yourself as author or co-author: no `Co-Authored-By`, no "Generated with" or similar trailers, and do not change the git author. Use an imperative subject and a short body. Do not push unless explicitly told to.
6. **Do not weaken the core rules** in `agents/architecture.md` (integer minor units, ledger as truth, paired transfers, per-currency reporting, per-user scoping, soft delete or archive instead of hard delete) without being asked to change them and updating the docs and tests that state them.
7. **Reuse before you write.** Before adding a helper, constant, colour or style value, search `packages/shared/src/` (shared helpers, constants and Zod contracts), `apps/web/src/lib/`, `apps/web/src/constants/`, `apps/web/src/styles/theme.ts` and `apps/web/src/styles/tokens.scss` (`grep -rn "<idea>" packages/shared/src apps/web/src/lib apps/web/src/constants apps/web/src/styles`) and extend what exists. Colours live only in `theme.ts` and `packages/shared/src/constants/palette.ts` (TypeScript) and `tokens.scss` (SCSS); module-level constant objects are PascalCase (`Colors`, `FinanceKeys`); an expression that appears twice becomes a tested helper in `packages/shared/src/lib/` (or `apps/web/src/lib/` when browser-only). ESLint and Stylelint enforce the colour and naming rules; the style guide is `docs/architecture/code-style.md` (humans) and `agents/conventions.md` (agents). Run `npm run lint:fix` after editing. Names are descriptive (no `s`, `t`, `NONE`), numbers, meaningful strings and regular expressions are named constants (regexes only in `packages/shared/src/lib/patterns.ts`), code comments are banned (names and small helpers explain intent) except TSDoc on exported functions in the `lib/` folders, which is required, imports are grouped external / `@/` / relative and everything sortable is sorted; see `agents/conventions.md` › Naming.

8. **Components are folders; styles are BEM.** Every component lives in `apps/web/src/components/<ui|finance|shell>/<name>/` with `<name>.tsx`, `<name>.test.tsx`, `index.ts` and, only if it has its own look, `<name>.scss` holding one BEM block named after the file (`.name`, `.name__element`, `.name--modifier`); in TSX the classes are plain strings written in full (`className="name__element"`, `cn('name', VariantClassNames[variant])`). Reuse `ui` components instead of sharing stylesheets or utility classes; put a component used by several modules in `ui/`. Modules depend one way, `shell` → `finance` → `ui`; components are named exports and live only in `apps/web/src/components/` (no `_components/` under `apps/web/src/app/`). Import siblings by folder (`../panel`), other modules by barrel (`@/components/ui`), never a file inside another folder or another component's stylesheet. A new `ui` component is added to the catalogue in `docs/architecture/components.md` (a test checks it). Write SCSS mobile-first with `@use 'abstracts' as *;`, `media-up(...)`, `space()`, `radius()` and the mixins; `ui` styles sit in `@layer ui`. Stylelint, ESLint and `apps/web/src/components/structure.test.ts` enforce this; the full guide is `agents/components.md`.

## Quick commands

```bash
npm run dev            # app on :3000
npm run docs           # documentation site on :3010
npm run db:up && npm run db:migrate && npm run db:check
npm run lint && npm run typecheck && npm test -- --run && npm run build
npm run lint:fix       # apply formatting, blank-line and layout fixes
npm run lint:dupes     # duplicated code (jscpd); npm run knip for dead code
```

## Known constraints

- The app requires a Clerk sign-in; agents cannot authenticate, so UI verification is limited to tests and the build unless the user provides a session.
- `npm run db:generate` may need an interactive terminal for ambiguous schema diffs; write the SQL by hand in that case and keep `apps/web/drizzle/meta` consistent.
- For diagram creation, use the `diagram-design@diagram-design` plugin ([cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design/tree/main)) when it is available; fall back to hand-written SVG only when it is not installed.
- Diagram sources are in `docs/legacy/diagrams/*.html` (diagram-design plugin); exported SVGs used by the docs are in `docs/assets/diagrams/`.
