# Workflows

> Summary: checklists for the recurring kinds of change (feature across api/web/shared, API endpoint, screen, component, migration, docs) including the documentation each one must update.

## Start of any task

1. Read `CLAUDE.md`, then `agents/README.md`, then only the agent docs the task needs.
2. Write plans, scratch diagrams and intermediate output to `temp/` (never to `docs/`, `agents/` or the source tree).
3. Check the existing tests for the area you touch; they encode the invariants.
4. Before writing a helper, constant, colour or style value, search `packages/shared/src/lib/`, `packages/shared/src/constants/`, `apps/web/src/lib/`, `apps/web/src/constants/`, `apps/web/src/styles/theme.ts`, `apps/web/src/styles/tokens.scss` and `apps/web/src/styles/abstracts/` and extend what exists (`agents/conventions.md` > Reuse first). Before writing markup, check `apps/web/src/components/ui/index.ts`.

## Add a feature (end to end)

1. **Schema** (if needed): edit `apps/api/src/db/schema.ts` → `npm run db:generate` (runs in the API workspace) → review and, if needed, hand-edit the SQL in `apps/api/drizzle/` → `npm run db:migrate`. Update `agents/data-model.md` and `docs/architecture/data-model.md`, and add the migration to `docs/reference/migrations.md`.
2. **Contracts**: request and response Zod schemas in `packages/shared/src/schema/<domain>.ts` (inputs `…Schema` / `…Values`, responses with inferred types).
3. **Service**: add functions to `apps/api/src/modules/<domain>/service.ts` (new domains: create the folder, register in `apps/api/src/modules/services.ts`). Enforce ownership, invariants and soft deletes there.
4. **Endpoint**: follow "Add an API endpoint" below.
5. **Client**: write function in `apps/web/src/api/mutations.ts`; read hook + key in `use-finance-data.ts` (`QueryKeys`, and `FinanceKeys` if writes should refresh it); screen in `apps/web/src/components/finance/<screen>/` built from `ui` components (`agents/components.md`); page in `apps/web/src/app/(main)/`; sidebar entry in `routes.ts` if needed.
6. **Tests**: service test(s) in `apps/api/src/modules/services.test.ts`, route test(s) in `apps/api/src/routes/*.test.ts`, helper unit tests, a component test for the main interaction (`vi.mock('@/api/mutations', …)`).
7. **Gates**: `npm run lint && npm run typecheck && npm test -- --run && npm run build`. To see it work, run `npm run dev` and sign up a local account in the browser (or `POST /api/v1/auth/sign-up`).
8. **Docs**: feature page in `docs/features/` (step-by-step + "How it works" + screenshot placeholders), sidebar entry in `docs/_sidebar.md`, rows in `docs/reference/rest-api.md`, `agents/architecture.md` service catalogue if a service changed, `agents/docs-map.md` if new code areas appeared. Update `README.md` if commands or folders changed.
9. **Commit** (only if asked): one commit, imperative subject, no author/co-author trailers.

## Change an existing rule

1. Find where it is enforced (`agents/architecture.md` › "Core rules", or the "Where each rule is enforced" table in `docs/architecture/overview.md`).
2. Change the service (and DB constraint if applicable) and the test that asserts the old behaviour.
3. Update the sentence describing the rule in `docs/architecture/overview.md`, the feature page, and `agents/architecture.md`.

## Add an API endpoint

Follow `docs/architecture/api.md` › Adding an endpoint: Zod schemas in `packages/shared/src/schema/<domain>.ts` → service function in `apps/api/src/modules/<domain>/service.ts` (`userId` first, `ServiceError`) → route in `apps/api/src/routes/<resource>.ts` with `schema: { params, querystring, body, response: withErrors({ … }), tags }` and `userIdOf(request)` (a new resource file is registered in `routes/index.ts`, inside the authenticated scope unless it must be public) → route test with `createTestApp()` / `signUp()` (happy path, `400`, other user's id → `404`, the rule) → row in `docs/reference/rest-api.md`. In the web app: a hook in `use-finance-data.ts` for reads, a function in `apps/web/src/api/mutations.ts` for writes, wired with a toast and `useRefreshFinance()`.

## Add a screen

Folder `apps/web/src/components/finance/<screen>/` (component, test with `QueryKeys` fixtures and `vi.mock('@/api/mutations', …)`, `index.ts`, stylesheet only if it needs its own look) → data through hooks in `use-finance-data.ts` and writes through `@/api/mutations` (add an API endpoint first if one is missing) → export it from `finance/index.ts` → page under `apps/web/src/app/(main)/` importing `@/components/finance` (the `proxy.ts` guard covers it automatically) → optional `routes.ts` entry → `docs/features/<name>.md` with `<!-- screenshot: … -->` placeholders → `docs/_sidebar.md`.

## Add or change a component

Follow the checklist in `agents/components.md`: search `ui/` first, pick the module by the placement rule, create the folder (`<name>.tsx`, `<name>.test.tsx`, `index.ts`, optional `<name>.scss` with one BEM block, `@use 'abstracts' as *;`, `@layer ui` for `ui/`), write mobile-first with `media-up`, add it to the module barrel, run `npm run lint:fix` and the gates. A new `ui` component, mixin, function or breakpoint goes into the catalogue in `docs/architecture/components.md`.

## Add default categories or icons

Icons: add the name to `packages/shared/src/constants/icon-names.ts` and the lucide import and key to `apps/web/src/constants/icons.ts`. Taxonomy: edit `apps/api/src/modules/categories/default-taxonomy.ts` (seeded at sign-up), bump `DEFAULT_TAXONOMY_VERSION`, update `docs/reference/default-taxonomy.md`. The seeding test validates icon names.

## Add a helper or constant

Search first (`grep -rn "<idea>" packages/shared/src apps/web/src/lib apps/web/src/constants apps/web/src/styles`). Name it for what it is (no one-letter or abbreviated identifiers). Helpers go in `packages/shared/src/lib/<topic>.ts` when the API or both sides need them, otherwise `apps/web/src/lib/<topic>.ts`, as `export const name = (...): Type => {}` with a TSDoc block (`agents/conventions.md` › Documentation comments) and a colocated `*.test.ts` that asserts every `@example`. Constant tables go in `packages/shared/src/constants/`, `apps/web/src/constants/` or next to the feature as a PascalCase `const` (`Colors`, `FinanceKeys`). Then run `npm run lint:fix` and, if the helper replaces duplicated code, `npm run lint:dupes`.

## Add a colour or style value

SCSS: add a `--token` to `apps/web/src/styles/tokens.scss` (light and dark, or the theme-independent block) and use `var(--token)`. Spacing, radii, breakpoints and repeated declaration groups belong in `apps/web/src/styles/abstracts/` (`_functions.scss`, `_breakpoints.scss`, `_mixins.scss`), each documented in `docs/architecture/components.md`. TypeScript: add it to `Colors` / `ChartStyle` in `apps/web/src/styles/theme.ts`. Never write a literal colour anywhere else; `npm run lint` rejects it. Document new tokens in `docs/architecture/code-style.md` only if they introduce a new concept.

## Add an exchange-rate provider

Implement `RateProvider` (`apps/api/src/modules/fx/provider.ts`), register it in the list passed to `createFxService` in `apps/api/src/modules/services.ts`, add a test in `apps/api/src/modules/services.test.ts`, document it in `docs/features/multi-currency.md` › "Automating rates later" and `docs/architecture/money.md`.

## Take screenshots for the docs (when asked)

Search for `<!-- screenshot:` in `docs/`, run `npm run dev`, sign up a local account with sample data, capture each described view at desktop width, save to the path in the comment, replace the comment with `![alt](../assets/screenshots/<name>.png)`.

## Documentation-only change

Edit the page, keep the `> Summary:` line accurate, update `docs/_sidebar.md` if pages were added or renamed, and `agents/docs-map.md` if the mapping changed.

## Write a pull request description

Use the `pr-description` skill (`.claude/skills/pr-description/SKILL.md`): it reads the branch, runs the gates, and fills the house template (Changelog with ADDED/REMOVED/MODIFIED lines, TL;DR, breaking changes, review focus, real check results, out of scope, collapsible screen and endpoint preview). It writes the draft to `temp/pr/<branch>.md` and opens the PR with `gh` only when asked.
