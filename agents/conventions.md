# Conventions and style guide

> Summary: the coding rules an agent must follow in this repository: reuse first, formatting, TypeScript, naming, constants and colours, server and client patterns, components, money, styling, complexity budget, tests, commits.

## Tooling gates (run before finishing any change)

```bash
npm run lint && npx tsc --noEmit && npm test -- --run && npm run build
```

`npm run lint` runs ESLint (`eslint.config.mjs`: Next.js, type-aware typescript-eslint, SonarJS, stylistic and local rules, Prettier through `prettier/prettier`) and Stylelint (`.stylelintrc.json`). Run `npm run lint:fix` after editing: it applies Prettier, the blank-line and layout rules and every other automatic fix. `npm run lint:dupes` (jscpd) and `npm run knip` (dead code) are advisory. The human version of these rules is `docs/architecture/code-style.md`.

## Reuse first

Before writing a helper, constant, colour or style value, search for an existing one and extend it:

- helpers: `src/lib/` (`money.ts`, `math.ts`, `date-helpers.ts` with `toIsoDate` / `toIsoMonth`, `patterns.ts`, `styles.ts`);
- lookup tables, limits and units: `src/constants/` (`account.ts`, `field-lengths.ts`, `http.ts`, `money.ts`, `time.ts`), the `*Keys` / `*Names` exports next to the feature;
- colours and chart styles in TypeScript: `Colors`, `GroupColors`, `ChartStyle` in `src/styles/theme.ts`;
- colours, shadows and gradients in SCSS: the tokens in `src/styles/tokens.scss`;
- breakpoints, spacing, radii and repeated SCSS patterns: `src/styles/abstracts/` (`media-up`, `space()`, `radius()`, mixins);
- markup patterns: the components in `src/components/ui/` (`ui/index.ts` lists them) and the module barrels.

`grep -rn "<idea>" src/lib src/constants src/styles` is the minimum check. An expression that appears twice (`Math.round((a / b) * 100)`) becomes a tested helper in `src/lib/`.

## Formatting and layout (fixable, run `npm run lint:fix`)

- Blank line after `'use client'`, after the imports, before every `export` / function / class / type, after a group of `const` / `let`, before and after any `const` / `let` that spans more than one line, before every `return`, around multi-line blocks.
- Object literals with three or more properties: one property per line. Type aliases with three or more members: one member per line (local rule `local/multiline-type-alias`). Prettier preserves an object you expand by hand (line break after `{`).
- `type`, never `interface`.
- Single-line guards without braces (`if (!value) return 0;`); multi-line bodies always with braces.
- Helpers in `src/lib/`, `src/constants/` and `src/server/` are `const name = (...) =>` arrow functions; `src/lib/` and `src/constants/` declare the return type (`(value: number, target: number): number =>`). Components, pages, route handlers and actions stay `function` declarations.

## TypeScript

- `strict` is on. No `any` except where the ESLint config already allows it; prefer `unknown` + narrowing.
- Use `import type` for types shared between server and client.
- Derive row types from Drizzle (`typeof table.$inferSelect`) or export DTO types from the service file; never duplicate shapes on the client.
- Dates are `YYYY-MM-DD` strings end to end; months are `YYYY-MM`. Use `date('…', { mode: 'string' })` in the schema.

## Naming

- Files: kebab-case (`transaction-dialog.tsx`, `service.ts`). One service per domain folder under `src/server/<domain>/`.
- Database: snake_case tables and columns; Drizzle properties camelCase. Enums are singular nouns (`account_type`).
- Server actions end in `Action` (`createTransferAction`). Hooks start with `use`. Zod schemas end in `Schema`, their types in `Values`.
- Money fields end in `Minor` (`amountMinor`, `balanceMinor`, `spentMinor`).
- Every name says what the value is for. No one-letter or abbreviated identifiers (`s`, `t`, `a`/`b`, `f`, `n`, `NONE`): lookup tables of class names end in `ClassNames` (`ToneClassNames`), callback parameters are named after the item (`transaction => transaction.amountMinor`), comparators use `(left, right)`, loop indexes `index`, and a sentinel says what it stands for (`UnmappedColumnValue`, not `NONE`). ESLint enforces a minimum length of two characters (`id-length`); the meaning is a review rule.
- No magic values. Every number, string with meaning beyond display text, and regular expression gets a named `const` that says what it is (`MaxCsvRows`, `UnmappedColumnValue`, `Patterns.isoDate`), placed next to its use or in `src/constants/` when shared. `@typescript-eslint/no-magic-numbers` allows only -1, 0, 1, array indexes and default values; regular expressions may appear only in `src/lib/patterns.ts` (`Patterns` plus `isIsoDate`, `isDigitsOnly`, `isHexColor`, `isIsoMonth` helpers), which ESLint enforces everywhere else. Sentinel and lookup strings become constants; user-facing copy (labels, messages) stays inline. Exception: values Next.js parses at build time (`export const config = { matcher: [...] }` in `middleware.ts`, route segment config) must stay inline literals, since the compiler cannot follow a constant.
- No code comments. `local/no-comments` rejects every comment except tool directives (`eslint-`, `@ts-`, `@vitest-environment`), the `keep order` marker and, in `src/lib/` only, a TSDoc block directly above an exported declaration (see Documentation comments). When something needs explaining, express it with a better name, a small named helper or a type; if an external quirk genuinely cannot be named, write a test that documents it.
- Imports: external packages first, then `@/` modules, then relative files, each group separated by a blank line and sorted naturally; named imports and exports, object properties, destructured parameters and type members are sorted alphabetically (`perfectionist/*`, fixable). When order carries meaning (a display sequence), put a `// keep order` comment above the first entry; the sorter leaves everything after it as written. Ordinary comments travel with their property. Nothing but imports goes in the import block: types and constants come after it.
- Module-level constant objects and arrays (lookup tables, palettes, key lists) are PascalCase: `Colors`, `FinanceKeys`, `QueryKeys`, `DefaultTaxonomy`, `AccountTypes`. ESLint rejects camelCase or UPPER_CASE for them (Next.js reserved exports such as `metadata` and `config` are exempt). Primitive constants stay UPPER_CASE (`MIN_YEAR`).

## Documentation comments (TSDoc, `src/lib/` only)

Every exported function in `src/lib/` has a TSDoc block; ESLint (`jsdoc/*`, `tsdoc/syntax`) fails without it. Shape:

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
- No TSDoc on private helpers, inside bodies or outside `src/lib/`; the rule reports it as a floating doc comment.
- When behaviour changes, update the TSDoc in the same edit; `jsdoc/check-param-names` catches renamed parameters, not stale prose.

## Server patterns

- Service functions: `(userId, …)` first; validate ownership before any write; throw `ServiceError(message, status)`; wrap multi-row writes in `db.transaction` with `FOR UPDATE` where rows are read-then-written.
- Actions: `run(async () => { const { userId, services } = await requireUser(); const data = parse(schema, form); … refresh(); })`. Parse money strings with `parseAmountInput(text, account.currency)` inside the action, never in the schema.
- Route handlers: `export const GET = handle(({ userId, services, request }) => …)`; read params with `param(request, 'name')`.
- Reports: raw SQL via `db.execute` through the `query<T>()` helper; keep the shared `spendingWhere` predicate.
- Correlated subqueries in unjoined selects must qualify columns literally (`"accounts"."id"`).

## Client patterns

- Screens are `'use client'` components in `src/components/finance/<screen>/`; pages under `src/app/(main)/` only render them and import from `@/components/finance`. Folder, placement, import and BEM rules: `agents/components.md`.
- Data via hooks in `src/components/finance/use-finance-data.ts`; new endpoints get a hook and their key is added to `FinanceKeys`. After a mutation call `useRefreshFinance()` (invalidates every `FinanceKeys` query) instead of writing the loop again.
- Mutations from a dialog form: `useEntityMutation({ mutationFn: someAction, successMessage, errorMessage, onSuccess: reset + close })` (`src/app/(main)/_components/use-entity-mutation.ts`); it toasts, invalidates every `FinanceKeys` query and then runs `onSuccess`. Elsewhere use `useMutation` with the same toast + invalidate shape.
- Forms: React Hook Form + `zodResolver`; amount inputs are text with `inputMode="decimal"`. Build dialog forms from `TextField` / `AmountField` / `DateField` (`src/components/ui/form-fields/`) inside a `FormStack`, and end them with `DialogFormFooter` + `saveLabel(editing)` (`src/components/ui/dialog-form/`); do not hand-write a `FormField` + `FormItem` block for a plain input, and do not nest ternaries for the submit label.
- Default values and create/update branching live in small module-level helpers (`standardDefaults`, `accountDefaults`, `saveAccount`), not inline in the component.
- Define every component at module scope; never create components inside another component's body (React Compiler rule). Do not call `setState` synchronously inside `useEffect`; derive state or reset on user events instead.
- Accessible names on every interactive control (`aria-label` on icon buttons) so tests can query by role.
- Loading / error / empty rendering goes through `QueryContent` (`src/components/ui/query-content/`); no `a ? x : b ? y : z` chains in JSX. Label selection with more than two branches becomes a small `if` helper (`TransactionStatus`, `budgetStatus`, `suggestionLabel`).

## Components

Full rules and the enforcement table: `agents/components.md`. In short:

- One folder per component (`finance/budget-card/` with `budget-card.tsx`, `budget-card.test.tsx`, `index.ts`, optional `budget-card.scss`); modules `ui/`, `finance/`, `shell/`, each with a named-export barrel.
- Placement: used by one component → private file in its folder; by two in a module → own folder in the module; domain-free or cross-module → `ui/`.
- Imports: siblings by folder (`../panel`), other modules by barrel (`@/components/ui`); never a file inside another folder, never a stylesheet that is not your own.
- Shared looks are shared components (`Stack`, `Cluster`, `Panel`, `Text`, `Field`, `ListRow`, `Table`, …), never shared stylesheets or utility classes.

## Styling

- One stylesheet per component (`import './budget-card.scss'`), named like it, holding one BEM block: `.budget-card`, `.budget-card__actions`, `.budget-card--compact`. Class names are written in full as plain strings (`className="budget-card__actions"`), combined with `cn()`; variant props map through a typed `Record<Variant, string>` named `…ClassNames`. Stylesheets are global, so block names must be unique.
- No tag selectors (except `svg`), IDs, `@extend`, `!important` or classes of other blocks; nesting depth 2; blank line between rules. `ui/` stylesheets live in `@layer ui` (atoms in `@layer ui.base`), so feature classes override them without specificity hacks.
- Mobile-first: base styles for phones, then `@include media-up(tablet-landscape)` (breakpoints `phone-landscape` 481, `tablet` 601, `tablet-landscape` 769, `laptop` 1025, `desktop` 1281, `wide` 1441). Every stylesheet starts with `@use 'abstracts' as *;` and reuses `space()`, `radius()` and the mixins in `src/styles/abstracts/`.
- Colours in SCSS come only from `src/styles/tokens.scss` (`var(--muted)`, `var(--surface)`, `var(--on-accent)`, gradients, overlay); Stylelint rejects hex, named and `rgb()` colours in any other stylesheet. Add a token rather than a literal.
- Colours in TypeScript come only from `Colors` in `src/styles/theme.ts` (chart palette, category-group palette `Colors.group`, `Colors.uncategorized`); ESLint rejects hex, `rgb()` and `hsl()` literals elsewhere. In JSX prefer `var(--token)` strings when a CSS token exists. Recharts style objects come from `ChartStyle`; the colour-picker swatches from `GroupColors`.
- Group colours chosen by users are data and are applied inline (`style={{ background: group.color }}`).
- Icons: add to `src/constants/icons.ts` (also used by the category schema), render with `<Icon icon={name} />` from `@/components/ui`. Never `import * as` from lucide.

## Money

- Store and transfer `amountMinor` + `currency`. Display with `formatMoney` or `<Amount />`. Convert only through `services.fx`.
- Never sum amounts of different currencies; group by currency instead.
- Liabilities: keep the ledger sign, flip only for display (`flipSign` on `Amount`).

## Complexity budget (warnings today, errors once the backlog is gone)

Cyclomatic complexity 10 and cognitive complexity 15 per function, 80 lines per function, 400 per file, nesting depth 3, four parameters. Never add a warning; remove one when you touch the function. `sonarjs/no-nested-conditional` is part of the same budget.

## Tests

- Service rules → `src/server/services.test.ts` (PGlite; truncates and bootstraps two users before each test). Always add an ownership case.
- Pure helpers → colocated `*.test.ts`.
- Components → `<name>/<name>.test.tsx`, required for every component folder (`src/components/structure.test.ts` fails otherwise). Query by role and label, not by class names.
- Screens → `*.test.tsx` with `QueryClientProvider`, `client.setQueryData` for fixtures and `vi.mock('@/app/(main)/actions')`.
- Playwright specs in `e2e/` are excluded from Vitest.

## Documentation

Every behaviour change updates the matching page in `docs/` (see `agents/docs-map.md`), the agent docs when architecture or conventions change, and `README.md` when setup, commands or folders change. Screenshots are placeholders: leave an HTML comment `<!-- screenshot: <what to capture> (docs/assets/screenshots/<name>.png) -->` where one belongs.

## Git

- One commit per phase or logical change, written in the imperative with a short body listing what changed.
- Never add yourself as author or co-author (no `Co-Authored-By`, no "Generated with" trailers).
- Do not push unless explicitly asked.
