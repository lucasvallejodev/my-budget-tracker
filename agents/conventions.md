# Conventions and style guide

> Summary: the coding rules an agent must follow in this repository: reuse first, formatting, TypeScript, naming, constants and colours, API route and service patterns, client patterns (API client, mutations), components, money, styling, complexity budget, tests, commits.

## Tooling gates (run before finishing any change)

```bash
npm run lint && npm run typecheck && npm test -- --run && npm run build
```

`npm run lint` runs ESLint (`eslint.config.mjs`: Next.js, type-aware typescript-eslint, SonarJS, stylistic and local rules, Prettier through `prettier/prettier`) and Stylelint (`.stylelintrc.json`). Run `npm run lint:fix` after editing: it applies Prettier, the blank-line and layout rules and every other automatic fix. `npm run lint:dupes` (jscpd) and `npm run knip` (dead code) are advisory. The human version of these rules is `docs/architecture/code-style.md`.

## Reuse first

Before writing a helper, constant, colour or style value, search for an existing one and extend it:

- helpers used by the web app and the API: `packages/shared/src/lib/` (`money.ts`, `date-helpers.ts` with `toIsoDate` / `toIsoMonth`, `patterns.ts`, `csv.ts`), imported as `@coinkeeper/shared/lib/<file>`; web-only helpers: `apps/web/src/lib/` (`math.ts`, `styles.ts`, `appearance.ts`, `hydration.ts`);
- lookup tables, limits and units: `packages/shared/src/constants/` (`field-lengths.ts`, `money.ts`, `time.ts`, `pagination.ts`, `icon-names.ts`, `palette.ts`), `apps/web/src/constants/` (`account.ts`, `icons.ts`) and `apps/api/src/constants/http.ts` (`HttpStatus`), the `*Keys` / `*Names` exports next to the feature;
- colours and chart styles in TypeScript: `Colors`, `GroupColors`, `ChartStyle` in `apps/web/src/styles/theme.ts`;
- colours, shadows and gradients in SCSS: the tokens in `apps/web/src/styles/tokens.scss`;
- breakpoints, spacing, radii and repeated SCSS patterns: `apps/web/src/styles/abstracts/` (`media-up`, `space()`, `radius()`, mixins);
- markup patterns: the components in `apps/web/src/components/ui/` (`ui/index.ts` lists them) and the module barrels.

`grep -rn "<idea>" packages/shared/src apps/web/src/lib apps/web/src/constants apps/web/src/styles apps/api/src/constants` is the minimum check. An expression that appears twice (`Math.round((a / b) * 100)`) becomes a tested helper in `packages/shared/src/lib/` (or `apps/web/src/lib/` when it is browser-only).

## Formatting and layout (fixable, run `npm run lint:fix`)

- Blank line after `'use client'`, after the imports, before every `export` / function / class / type, after a group of `const` / `let`, before and after any `const` / `let` that spans more than one line, before every `return`, around multi-line blocks.
- Object literals with three or more properties: one property per line. Type aliases with three or more members: one member per line (local rule `local/multiline-type-alias`). Prettier preserves an object you expand by hand (line break after `{`).
- `type`, never `interface`.
- Single-line guards without braces (`if (!value) return 0;`); multi-line bodies always with braces.
- Helpers in the `lib/` and `constants/` folders (of `apps/web/src/` and `packages/shared/src/`) are `const name = (...) =>` arrow functions that declare the return type (`(value: number, target: number): number =>`); ESLint enforces both there. API code in `apps/api/src/` (services, route helpers, plugins) uses the same arrow style by convention, and route plugins are `const xRoutes: FastifyPluginAsyncZod = async app => { … }`. Components and pages stay `function` declarations.

## TypeScript

- `strict` is on. No `any` except where the ESLint config already allows it; prefer `unknown` + narrowing.
- Use `import type` for types shared between the API and the web app. Inside `packages/shared` use relative imports; everywhere else import it by path (`@coinkeeper/shared/schema/accounts`). `@/` always means the `src/` folder of the current app.
- Response shapes are Zod schemas in `packages/shared/src/schema/<domain>.ts` with inferred types; API services return them, routes declare them as response schemas (unknown fields are stripped), and the web app imports the types from `@coinkeeper/shared/schema/<domain>`. Never return `$inferSelect` rows from a route (Drizzle types claim `Date` where JSON has strings) and never duplicate a shape in the web app. The web app has no database or server code; it reaches data only through `@/api/client` and `@/api/mutations`.
- Dates are `YYYY-MM-DD` strings end to end; months are `YYYY-MM`. Use `date('…', { mode: 'string' })` in the schema.

## Naming

- Files: kebab-case (`transaction-dialog.tsx`, `service.ts`). One service per domain folder under `apps/api/src/modules/<domain>/`; one route file per resource in `apps/api/src/routes/`.
- Database: snake_case tables and columns; Drizzle properties camelCase. Enums are singular nouns (`account_type`).
- Write functions in `apps/web/src/api/mutations.ts` are verb-first and name the resource (`createTransfer`, `restoreRule`, `setAccountArchived`). Hooks start with `use`. Zod schemas end in `Schema`, their types in `Values`.
- Money fields end in `Minor` (`amountMinor`, `balanceMinor`, `spentMinor`).
- Every name says what the value is for. No one-letter or abbreviated identifiers (`s`, `t`, `a`/`b`, `f`, `n`, `NONE`): lookup tables of class names end in `ClassNames` (`ToneClassNames`), callback parameters are named after the item (`transaction => transaction.amountMinor`), comparators use `(left, right)`, loop indexes `index`, and a sentinel says what it stands for (`UnmappedColumnValue`, not `NONE`). ESLint enforces a minimum length of two characters (`id-length`); the meaning is a review rule.
- No magic values. Every number, string with meaning beyond display text, and regular expression gets a named `const` that says what it is (`MaxCsvRows`, `UnmappedColumnValue`, `Patterns.isoDate`), placed next to its use or in `packages/shared/src/constants/` when shared. `@typescript-eslint/no-magic-numbers` allows only -1, 0, 1, array indexes and default values; regular expressions may appear only in `packages/shared/src/lib/patterns.ts` (`Patterns` plus `isIsoDate`, `isDigitsOnly`, `isHexColor`, `isIsoMonth` helpers), which ESLint enforces everywhere else. Sentinel and lookup strings become constants; user-facing copy (labels, messages) stays inline. Exception: values Next.js parses at build time (`export const config = { matcher: [...] }` in `apps/web/src/proxy.ts`, route segment config) must stay inline literals, since the compiler cannot follow a constant.
- No code comments. `local/no-comments` rejects every comment except tool directives (`eslint-`, `@ts-`, `@vitest-environment`), the `keep order` marker and, in the `lib/` folders only, a TSDoc block directly above an exported declaration (see Documentation comments). When something needs explaining, express it with a better name, a small named helper or a type; if an external quirk genuinely cannot be named, write a test that documents it.
- Imports: external packages first, then internal modules (`@/…` and `@coinkeeper/…`), then relative files, each group separated by a blank line and sorted naturally; named imports and exports, object properties, destructured parameters and type members are sorted alphabetically (`perfectionist/*`, fixable). When order carries meaning (a display sequence), put a `// keep order` comment above the first entry; the sorter leaves everything after it as written. Ordinary comments travel with their property. Nothing but imports goes in the import block: types and constants come after it.
- Module-level constant objects and arrays (lookup tables, palettes, key lists) are PascalCase: `Colors`, `FinanceKeys`, `QueryKeys`, `DefaultTaxonomy`, `AccountTypes`. ESLint rejects camelCase or UPPER_CASE for them (Next.js reserved exports such as `metadata` and `config` are exempt). Primitive constants stay UPPER_CASE (`MIN_YEAR`).

## Documentation comments (TSDoc, `lib/` folders only)

Every exported function in `packages/shared/src/lib/` and `apps/web/src/lib/` has a TSDoc block; ESLint (`jsdoc/*`, `tsdoc/syntax`) fails without it. Shape:

````ts
/**
 * One sentence: what it returns or does.
 *
 * @remarks
 * Units, accepted formats, rounding, fallbacks, caveats. Omit when nothing is surprising.
 *
 * @param name - What the value means (no `{type}`; TypeScript owns types).
 * @returns What comes back, with units.
 * @throws `Error` when … (required whenever the function throws).
 *
 * @example
 * ```ts
 * helper(input); // result
 * ```
 */
````

- Hyphen after every `@param` name; options objects are described on the `options` line (no `options.field` params).
- Every `@example` result is asserted in the colocated test; change both together.
- Use `{@link helper}` for cross-references. Escape a literal `{` or `}` in prose, or put it in backticks.
- No TSDoc on private helpers, inside bodies or outside the `lib/` folders; the rule reports it as a floating doc comment.
- When behaviour changes, update the TSDoc in the same edit; `jsdoc/check-param-names` catches renamed parameters, not stale prose.

## Server patterns (`apps/api`)

- Routes: one `FastifyPluginAsyncZod` per resource in `apps/api/src/routes/<resource>.ts`, registered in `routes/index.ts` inside the authenticated scope (the `requireSession` hook) unless it is health or sign-up/in/out. Each route declares `schema: { params, querystring, body, response: withErrors({ [HttpStatus.ok]: … }), tags }` with Zod schemas from `@coinkeeper/shared/schema/<domain>`; deletes and empty commands answer `204` with `noContent`. The handler takes the user with `userIdOf(request)` and calls one service (`app.services.<domain>.<fn>`). Parse money strings in the route with the helpers in `routes/inputs.ts` (`parseAmount(text, currency)`, `toStandardInput`, …), never in the schema. Paths and verbs follow `docs/reference/rest-api.md` › Conventions.
- Service functions (`apps/api/src/modules/<domain>/service.ts`): `(userId, …)` first; validate ownership before any write; throw `ServiceError(message, status, code?)` from `modules/db.ts` (or `notFound()` / `conflict()`); wrap multi-row writes in `db.transaction` with `FOR UPDATE` where rows are read-then-written. `plugins/error-handler.ts` turns errors into `{ error: { code, message, fields? } }`.
- Deletes of financial rows are soft: set `deleted_at`, filter `deleted_at IS NULL` in every read, add a `restore` that re-checks the rules. Categories, groups and payees are archived.
- Reports: raw SQL via `db.execute` through the `query<T>()` helper; keep the shared `spendingWhere` predicate.
- Correlated subqueries in unjoined selects must qualify columns literally (`"accounts"."id"`).

## Client patterns

- Screens are `'use client'` components in `apps/web/src/components/finance/<screen>/`; pages under `apps/web/src/app/(main)/` only render them and import from `@/components/finance`. Folder, placement, import and BEM rules: `agents/components.md`.
- Reads via hooks in `apps/web/src/components/finance/use-finance-data.ts`, which call `apiGet` / `apiList` / `apiPages` from `@/api/client` (never `fetch` directly); a new endpoint gets a hook, a key in `QueryKeys` and, if writes should refresh it, an entry in `FinanceKeys`.
- Writes via a function in `apps/web/src/api/mutations.ts` (`apiRequest(method, path, body)`); components import it from `@/api/mutations`. After a write call `useRefreshFinance()` (invalidates every `FinanceKeys` query) instead of writing the loop again. `ApiError.message` is safe to show in a toast.
- Mutations from a dialog form: `useEntityMutation({ mutationFn: createSomething, successMessage, errorMessage, onSuccess: reset + close })` (`apps/web/src/components/finance/use-entity-mutation.ts`); it toasts, invalidates every `FinanceKeys` query and then runs `onSuccess`. Elsewhere use `useMutation` with the same toast + invalidate shape.
- Forms: React Hook Form + `zodResolver`; amount inputs are text with `inputMode="decimal"`. Build dialog forms from `TextField` / `AmountField` / `DateField` (`apps/web/src/components/ui/form-fields/`) inside a `FormStack`, and end them with `DialogFormFooter` + `saveLabel(editing)` (`apps/web/src/components/ui/dialog-form/`); do not hand-write a `FormField` + `FormItem` block for a plain input, and do not nest ternaries for the submit label.
- Default values and create/update branching live in small module-level helpers (`standardDefaults`, `accountDefaults`, `saveAccount`), not inline in the component.
- Define every component at module scope; never create components inside another component's body (React Compiler rule). Do not call `setState` synchronously inside `useEffect`; derive state or reset on user events instead.
- Accessible names on every interactive control (`aria-label` on icon buttons) so tests can query by role.
- Loading / error / empty rendering goes through `QueryContent` (`apps/web/src/components/ui/query-content/`); no `a ? x : b ? y : z` chains in JSX. Label selection with more than two branches becomes a small `if` helper (`TransactionStatus`, `budgetStatus`, `suggestionLabel`).

## Components

Full rules and the enforcement table: `agents/components.md`. In short:

- One folder per component (`finance/budget-card/` with `budget-card.tsx`, `budget-card.test.tsx`, `index.ts`, optional `budget-card.scss`); modules `ui/`, `finance/`, `shell/`, each with a named-export barrel.
- Placement: used by one component → private file in its folder; by two in a module → own folder in the module; domain-free or cross-module → `ui/`.
- Imports: siblings by folder (`../panel`), other modules by barrel (`@/components/ui`); never a file inside another folder, never a stylesheet that is not your own.
- Shared looks are shared components (`Stack`, `Cluster`, `Panel`, `Text`, `Field`, `ListRow`, `Table`, …), never shared stylesheets or utility classes.

## Styling

- One stylesheet per component (`import './budget-card.scss'`), named like it, holding one BEM block: `.budget-card`, `.budget-card__actions`, `.budget-card--compact`. Class names are written in full as plain strings (`className="budget-card__actions"`), combined with `cn()`; variant props map through a typed `Record<Variant, string>` named `…ClassNames`. Stylesheets are global, so block names must be unique.
- No tag selectors (except `svg`), IDs, `@extend`, `!important` or classes of other blocks; nesting depth 2; blank line between rules. `ui/` stylesheets live in `@layer ui` (atoms in `@layer ui.base`), so feature classes override them without specificity hacks.
- Mobile-first: base styles for phones, then `@include media-up(tablet-landscape)` (breakpoints `phone-landscape` 481, `tablet` 601, `tablet-landscape` 769, `laptop` 1025, `desktop` 1281, `wide` 1441). Every stylesheet starts with `@use 'abstracts' as *;` and reuses `space()`, `radius()` and the mixins in `apps/web/src/styles/abstracts/`.
- Colours in SCSS come only from `apps/web/src/styles/tokens.scss` (`var(--muted)`, `var(--surface)`, `var(--on-accent)`, gradients, overlay); Stylelint rejects hex, named and `rgb()` colours in any other stylesheet. Add a token rather than a literal.
- Colours in TypeScript come only from `Colors` in `apps/web/src/styles/theme.ts` (chart palette, category-group palette `Colors.group`, `Colors.uncategorizedFallback`) and, for values the server also needs, from `packages/shared/src/constants/palette.ts` (`GroupPalette`, `UNCATEGORIZED_COLOR`), which `theme.ts` re-exports; ESLint rejects hex, `rgb()` and `hsl()` literals elsewhere. In JSX prefer `var(--token)` strings when a CSS token exists. Recharts style objects come from `ChartStyle`; the colour-picker swatches from `GroupColors`.
- Group colours chosen by users are data and are applied inline (`style={{ background: group.color }}`).
- Icons: add the name to `packages/shared/src/constants/icon-names.ts` (used by the category schema) and the lucide component to `apps/web/src/constants/icons.ts` (TypeScript fails if the two disagree), render with `<Icon icon={name} />` from `@/components/ui`. Never `import * as` from lucide.

## Money

- Store and transfer `amountMinor` + `currency`. Display with `formatMoney` or `<Amount />`. Convert only through `services.fx`.
- Never sum amounts of different currencies; group by currency instead.
- Liabilities: keep the ledger sign, flip only for display (`flipSign` on `Amount`).

## Complexity budget (warnings today, errors once the backlog is gone)

Cyclomatic complexity 10 and cognitive complexity 15 per function, 80 lines per function, 400 per file, nesting depth 3, four parameters. Never add a warning; remove one when you touch the function. `sonarjs/no-nested-conditional` is part of the same budget.

## Tests

- Service rules → `apps/api/src/modules/services.test.ts` (PGlite; truncates, `insertUser` and bootstraps two users before each test). Always add an ownership case.
- Endpoints → `apps/api/src/routes/*.test.ts` with `createTestApp()` and `signUp(app, email)` from `apps/api/src/test/app.ts` (the client's `request(method, path, body?)` sends the session cookie and an allowed `Origin`): happy path, `400`, another user's id → `404`, the rule enforced.
- Pure helpers → colocated `*.test.ts`.
- Components → `<name>/<name>.test.tsx`, required for every component folder (`apps/web/src/components/structure.test.ts` fails otherwise). Query by role and label, not by class names.
- Screens → `*.test.tsx` with `QueryClientProvider`, `client.setQueryData(QueryKeys.…, data)` for fixtures and `vi.mock('@/api/mutations', () => ({ … }))` for writes.
- Playwright specs in `e2e/` are excluded from Vitest.

## Documentation

Every behaviour change updates the matching page in `docs/` (see `agents/docs-map.md`), the agent docs when architecture or conventions change, and `README.md` when setup, commands or folders change. Screenshots are placeholders: leave an HTML comment `<!-- screenshot: <what to capture> (docs/assets/screenshots/<name>.png) -->` where one belongs.

## Git

- One commit per phase or logical change, written in the imperative with a short body listing what changed.
- Never add yourself as author or co-author (no `Co-Authored-By`, no "Generated with" trailers).
- Do not push unless explicitly asked.
