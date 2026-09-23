# Workflows

> Summary: checklists for the recurring kinds of change (feature, table, endpoint, screen, migration, docs) including the documentation each one must update.

## Start of any task

1. Read `CLAUDE.md`, then `agents/README.md`, then only the agent docs the task needs.
2. Write plans, scratch diagrams and intermediate output to `temp/` (never to `docs/`, `agents/` or the source tree).
3. Check the existing tests for the area you touch; they encode the invariants.

## Add a feature (end to end)

1. **Schema** (if needed): edit `src/db/schema.ts` → `npm run db:generate` → review and, if needed, hand-edit the SQL → `npm run db:migrate`. Update `agents/data-model.md` and `docs/architecture/data-model.md`, and add the migration to `docs/reference/migrations.md`.
2. **Service**: add functions to `src/server/<domain>/service.ts` (new domains: create the folder, register in `src/server/services.ts`). Enforce ownership and invariants there.
3. **Validation + entry points**: Zod schema in `src/schema/`, server action in `src/app/(main)/actions.ts`, route handler in `src/app/api/...` for reads.
4. **Client**: hook + query key in `use-finance-data.ts` (add to `FINANCE_KEYS`), screen in `src/components/finance/`, page in `src/app/(main)/`, sidebar entry in `routes.ts` if needed.
5. **Tests**: service test(s) in `services.test.ts`, helper unit tests, a component test for the main interaction.
6. **Gates**: `npm run lint && npx tsc --noEmit && npm test -- --run && npm run build`.
7. **Docs**: feature page in `docs/features/` (step-by-step + "How it works" + screenshot placeholders), sidebar entry in `docs/_sidebar.md`, `docs/reference/api.md` rows, and `agents/architecture.md` service catalogue if a service changed. Update `README.md` if commands or folders changed.
8. **Commit** (only if asked): one commit, imperative subject, no author/co-author trailers.

## Change an existing rule

1. Find where it is enforced (`agents/architecture.md` › "Core rules", or the "Where each rule is enforced" table in `docs/architecture/overview.md`).
2. Change the service (and DB constraint if applicable) and the test that asserts the old behaviour.
3. Update the sentence describing the rule in `docs/architecture/overview.md`, the feature page, and `agents/architecture.md`.

## Add a read endpoint

`src/app/api/<name>/route.ts` using `handle()` → hook in `use-finance-data.ts` → row in `docs/reference/api.md`.

## Add a server action

Zod schema → function in `actions.ts` inside `run()` → row in `docs/reference/api.md` → component wiring with toast + invalidation.

## Add a screen

Component in `src/components/finance/` → page → optional `routes.ts` entry → component test → `docs/features/<name>.md` with `<!-- screenshot: … -->` placeholders → `docs/_sidebar.md`.

## Add default categories or icons

Icons: add the lucide import and key to `src/components/icons/registry.ts`. Taxonomy: edit `src/server/categories/default-taxonomy.ts`, bump `DEFAULT_TAXONOMY_VERSION`, update `docs/reference/default-taxonomy.md`. The seeding test validates icon names.

## Add an exchange-rate provider

Implement `RateProvider` (`src/server/fx/provider.ts`), register it in the list passed to `createFxService` in `src/server/services.ts`, add a test in `services.test.ts`, document it in `docs/features/multi-currency.md` › "Automating rates later" and `docs/architecture/money.md`.

## Take screenshots for the docs (when asked)

Search for `<!-- screenshot:` in `docs/`, capture each described view at desktop width, save to the path in the comment, replace the comment with `![alt](../assets/screenshots/<name>.png)`.

## Documentation-only change

Edit the page, keep the `> Summary:` line accurate, update `docs/_sidebar.md` if pages were added or renamed, and `agents/docs-map.md` if the mapping changed.
