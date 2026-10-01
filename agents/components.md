# Components and BEM styling

> Summary: the rules for React components and their styles: one folder per component, three modules (`ui`, `finance`, `shell`) with barrels, BEM class names written as plain strings in global `.scss` files, cascade layers, mobile-first breakpoint mixins, the SCSS theme and abstractions, and the lint rules and tests that enforce each rule.

Read this before creating, moving or styling any component. The human version is `docs/architecture/components.md`.

## Modules and placement

```
apps/web/src/components/
  ui/        project-wide building blocks, no domain knowledge (Button, Panel, Stack, Table, Field, Badge, …)
  finance/   finance components and screens (Home, Analytics, AccountsOverview, BudgetOverview, BudgetLine, CurrencySwitch, MetricCard, MetricIcon, TransactionTable, ProfileForm, PasswordForm, SessionList, DeletedItems, …)
  shell/     application frame (ApplicationShell with Navigation, ApplicationHeader, TabBar and NavigationDrawer, AuthScreen, AuthForm, UserMenu, Logo)
  structure.test.ts
```

Nothing else lives in `apps/web/src/components/`, and components do not live anywhere else: there is no `_components/` folder under `apps/web/src/app/`; pages only render components from the barrels.

Modules depend in one direction: `shell` → `finance` → `ui`. `ui/` imports no other component module (it takes data and callbacks through props), `finance/` imports only `ui`, `shell/` may import both. Shared code moves down, never up.

Decide where a component goes:

1. Used by one component only → a private file inside that component's folder (`category-manager/category-dialogs.tsx`).
2. Used by two or more components of one module → its own folder in that module.
3. Domain-free or used outside its module → `ui/<name>/`.

Before writing markup, check `ui/index.ts` for an existing component: layout (`Page`, `PageHeading`, `Stack`, `Cluster`, `Grid`, `Columns`, `Panel`), content (`Text`, `Badge` (tones `success`, `warning`, `danger`, `info`, `neutral`; optional `icon`), `Notice`, `EmptyState`, `MetricValue` (`default`, `fluid`, `small`), `Avatar` (tinted `color` or solid `fill` {background, foreground}; `label` makes it `role=img`; `shape` `circle` for payees, categories, metrics / `square` for accounts; `size` `default`/`small`), `ColorSwatch`, `ListRow`, `DescriptionList`, `Table`, `ProgressBar` (`tone` brand/positive/warning/danger, `size` default/large, `color` fill override, `marker` + `markerLabel`), `Stat` (label with `leading` icon or swatch, tabular value, `meta`, `delta` {rising, good, label}; `size` default/large/hero), `Sparkline` (`points`, required `label`, `role=img`), `Pagination`, `Skeleton` (`shape` line/title/block/card, `aria-hidden`, pulse off under reduced motion), `SkeletonText` (skeleton lines in `role=status` with a screen-reader `label`)), forms (`SegmentedControl` (radiogroup, roving arrow keys; required `label`), `Field`, `FormStack`, `FilterBar`, `PillInput`, `PillSelect` (pill `Select`; never a native `<select>`), `Input`, `Select`, `DatePicker`, `ToggleSwitch`, `ColorPicker` (radiogroup named by colour, roving arrow keys), `IconPicker` (curated icon grid, options named in words, roving arrow keys; pass `allowEmoji={!!settings.data?.allowEmoji}` to add the one-emoji field), `FileDrop` (drop zone around a labelled, visually hidden file input: `label`, `accept`, `hint`, `fileName`, `onFile(file)`; use it for every file input), `form` / `form-fields` helpers), overlays (`Dialog`, `Popover`, `Menu`, `Command`, `Combobox` (searchable picker with sections, `field` or `chip` variant, filtering through `matchesSearch`)), `Icon` (renders a curated name as Lucide or an emoji value as text; always render category and payee icons through it), data (`Amount`, `QueryContent` (renders `SkeletonText` with the `loading` text while pending; never write your own loading text or spinner for a query)). Extend a component with a prop or modifier rather than adding a lookalike.

Finance building blocks to reuse before writing a lookalike: `CategoryPicker` (the category autocomplete on `Combobox`; pass `kind` when the sign is known and `suggestedId` for a suggestion; `variant="chip"` for inline rows) and `CategoryAvatar` from `finance/category-picker/`, `PayeeAvatar` from `finance/payee-avatar/` (`name`, optional `icon`, `color`, `size`; order: brand glyph from `apps/web/src/constants/brands.ts`, else the chosen icon or emoji tinted in `color`, else initials on `color` or the name tint, via `apps/web/src/lib/payee-avatar.ts`; pass `payeeIcon` / `payeeColor` from transaction rows; never fetch logos), `CreatePayeeDialog` (its private `payee-appearance.tsx` is the Look in lists section), `AccountPicker`, `PayeePicker`, `TransactionTable` (day groups, collapsed transfers, inline category), `BudgetLine` (a budget row: bar colored by state with the pace marker, left/over, per-day allowance, optional row menu; `compact` on Home), `BudgetSummary` and its `monthTotals` (totals, pace and state of a month of budgets), `CurrencySwitch` with `useCurrencyView` (one currency or `ConvertedView`, remembered in `RememberedFields.currencyView`, falls back to the primary currency), `SpendingBars` (labeled bars with share and change, small groups folded), `AttentionStrip` (up to three links, hidden when empty), `MetricIcon` (`kind` from `MetricKinds` in a tinted circle, the leading icon of a `Stat`), `SpendingRanking` (ranked rows with a share bar), `ChartFrame` (pass `data` {columns, rows} so the Recharts drawing is `aria-hidden` and a visually hidden table carries the numbers; set `accessibilityLayer={false}` on the chart then, since Recharts 3 turns it on by default). A dialog rendered from state (`{value && <Dialog …/>}`) uses `useDialogState` from `apps/web/src/lib/dialog-state.ts` so focus returns to its opener; a popover whose close should focus something other than its trigger passes `onCloseAutoFocus` (`Combobox` and `CategoryPicker` forward it). Analytics views take an `AnalyticsContext` (currency, filters, `format`, `formatTick`) and reuse `MonthlyBars` / `StackedGroups` from `finance/analytics/analytics-charts.tsx` and the period helpers in `analytics-data.ts`; Accounts helpers are in `finance/accounts-overview/accounts-figures.ts`. Removed, do not recreate: `Overview`, `AnalyticsRankings`, `NetWorthCards`, `BalanceCard`, `LinkedAccount`, `DistributionChart`, `TargetCard`. Budget state, labels and tones come only from `finance/budget-status.ts` (`budgetFigures`, `BudgetStates`, `BudgetStateOrder`); the converted caption only from `describeConversion` in `finance/conversion.ts`.

## Folder contract

```
finance/budget-line/
  budget-line.tsx           the component (named export BudgetLine)
  budget-line.scss          block .budget-line (only when it has styles)
  budget-line.test.tsx      required
  <part>.tsx / <helper>.ts  private parts or helpers (optional)
  index.ts                  export { BudgetLine } from './budget-line';
```

- Folder, file and block share one kebab-case name. No nested folders.
- Every folder has `<name>.tsx`, `<name>.test.tsx` and `index.ts`; every stylesheet is `<file>.scss` next to a `<file>.tsx` of the same name, and its name is unique across all modules (class names are global).
- Module roots hold only `index.ts` and plain `.ts` modules (`use-finance-data.ts`, `use-entity-mutation.ts`, `sample-data.ts`, `transaction-labels.ts`, `export-transactions.ts`, `budget-status.ts`, `conversion.ts`, `net-worth.ts`, `comparisons.ts`); no `.tsx` or stylesheets.
- The module barrel (`ui/index.ts`, `finance/index.ts`, `shell/index.ts`) re-exports every folder with named exports (no `export *`: Next.js client boundaries need names).
- `'use client'` goes in the component file, never in `index.ts`.
- Components, hooks and helpers in `apps/web/src/components/` are named exports; default exports are rejected (`import/no-default-export`).

## Imports

| From                            | To                           | Write                                                           |
| ------------------------------- | ---------------------------- | --------------------------------------------------------------- |
| a component                     | its stylesheet               | `import './budget-line.scss';` (only its own)                   |
| a component                     | a sibling in the same module | `import { Panel } from '../panel';`                             |
| a component                     | another module               | `import { Button, Stack } from '@/components/ui';`              |
| a page or `apps/web/src/app/**` | any component                | `@/components/finance` or `@/components/finance/account-detail` |

Never import a file inside another component's folder (`../panel/panel`, `@/components/ui/button/button`), never import a module's own barrel from inside it, never reach another module with `../../`. Data that server code also needs lives outside components (`packages/shared/src/constants/icon-names.ts` for the icon names, `packages/shared/src/constants/palette.ts` for the category-group palette).

## BEM

- Block = file name: `.budget-line`. Elements: `.budget-line__meta`. Modifiers: `.budget-line--compact`, `.budget-line__amount--over`. Kebab-case words, no `block__a__b`.
- A stylesheet styles only its own block. To change another component, give it a prop, a modifier, or pass a `className` from your block (`className={block.element('actions')}` on a `Cluster`).
- Every styled element gets a class; no tag selectors (`p`, `li`, `th`) except `svg` for icon children. No IDs, no `@extend`, no `!important`, at most two compound selectors (`&--selected &__button` is fine).
- Nest with `&__element`, `&--modifier`, `&:hover`, `&[data-state='active']` and media mixins; maximum depth 2.
- Blank line between rules, before nested rules and after an `@include` group; no blank lines between declarations. `npm run lint:fix` applies the spacing.

In TypeScript, write the class names as plain strings and combine them with `cn()` from `apps/web/src/lib/styles.ts`:

```tsx
import { cn } from '@/lib/styles';

import './badge.scss';

const ToneClassNames: Record<BadgeTone, string> = {
  danger: 'badge--danger',
  info: 'badge--info',
  neutral: 'badge--neutral',
  success: '',
  warning: 'badge--warning',
};

<span className="metric-card__label" />                                          // a fixed element
<span className={cn('badge', ToneClassNames[tone])} />                            // a variant prop: typed lookup table
<span className={cn('avatar', { 'avatar--filled': !!fill })} />                  // a boolean modifier
<div className={cn('panel', className)} />                            // merge a caller's class
```

Write every class in full so it can be searched for. A variant prop maps to classes through a `Record<Variant, string>` named `…ClassNames`, so TypeScript reports a missing variant; the default variant maps to `''`. ESLint (`local/colocated-styles`) rejects a class string in `className` or in a `…ClassNames` table that is not part of the file's block.

## Cascade layers

`apps/web/src/app/globals.scss` declares `@layer reset, ui;` and wraps its resets in `@layer reset`. Every `ui/**` stylesheet wraps its rules in `@layer ui { … }`; atoms that other `ui` components restyle (`button`, `input`, `popover`) use `@layer ui.base`. Feature stylesheets (`finance/`, `shell/`) are unlayered. Resulting priority: `reset` < `ui.base` < `ui` < feature styles, so a feature class always overrides a `ui` component without specificity hacks (`.a.a`) and regardless of load order.

## Theme

All design values live in `apps/web/src/styles/theme/` (one light theme, no dark mode); human version: `docs/architecture/components.md` › Theme.

| File               | Holds                                                                                                                                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_colors.scss`     | `$color-brand` (private-bank navy; hover, soft and selection derived with `sass:color`), text, canvas, surface, status, `$color-account-*`, `$color-metric-*`, chart, avatar tints; map `$colors`                                 |
| `_typography.scss` | `$font-family-sans` (Inter, `--font-inter`), `$font-family-display` (Source Serif 4, `--font-source-serif`; both via `next/font/google` in `app/layout.tsx`), `$font-sizes`, `$font-weights`, `$line-heights`, `$letter-spacings` |
| `_shape.scss`      | `$border-width`, `$radii`, `$borders`                                                                                                                                                                                             |
| `_elevation.scss`  | `$shadows`, `$z-indexes`                                                                                                                                                                                                          |
| `_spacing.scss`    | `$spaces`                                                                                                                                                                                                                         |
| `_layout.scss`     | `$layout-sizes` (sidebar, content width, header, tab bar, control and row heights, avatar, icon, padding)                                                                                                                         |
| `_motion.scss`     | `$durations`, `$easings`                                                                                                                                                                                                          |

- `apps/web/src/styles/tokens.scss` emits every value on `:root` as `--color-*`, `--font-sans`, `--font-display`, `--font-mono`, `--font-size-*`, `--font-weight-*`, `--line-height-*`, `--letter-spacing-*`, `--radius-*`, `--border-*`, `--shadow-*`, `--z-index-*`, `--space-*`, `--size-*`, `--duration-*`, `--easing-*`, `--color-avatar-1..8`.
- In SCSS use `var(--…)` or the functions below; never a literal colour, font size, weight, family, radius, border, shadow, z-index, letter spacing, line height or transition.
- In TypeScript use `Colors` / `ChartStyle` from `apps/web/src/styles/theme.ts` (only `var(--…)` strings) or a `var(--…)` string; icons with a meaning take their colour from `MetricKinds` (`apps/web/src/constants/metrics.ts`) or `accountTypeStyle` (`apps/web/src/constants/account.ts`). Category group colours are user data in `packages/shared/src/constants/palette.ts`.
- A new value goes into the right theme file (and `$colors` or its map), never into a component.

## SCSS abstractions

Start every stylesheet with `@use 'abstracts' as *;` (resolved through `sassOptions.loadPaths` in `next.config.ts`; the files are in `apps/web/src/styles/abstracts/`).

- Breakpoints (mobile-first, BrowserStack ranges): `phone-landscape` 481px, `tablet` 601px, `tablet-landscape` 769px, `laptop` 1025px, `desktop` 1281px, `wide` 1441px. Write base styles for phones, then `@include media-up(tablet-landscape) { … }`. `media-down($name)` and `media-between($from, $to)` exist for the rare exception; `breakpoint($name)` returns the pixel value. Raw `min-width` / `max-width` / `width` media queries are rejected in components.
- `abstracts` forwards the theme, so its variables are in scope.
- Functions that return a `var(--…)` after checking the key: `color()`, `font-size()`, `font-weight()`, `line-height()`, `letter-spacing()`, `radius()` (`small` 6, `control` 8, `card` 12, `dialog` 16, `pill` 999px, `round` 50%), `shadow()` (`card`, `raised`, `pop`, `focus`, `selected`), `border()` (`card`, `control`, `divider`, `dashed`), `z-index()`, `duration()`, `easing()`. Compile-time px: `space($step)` (1 = 4px … 8 = 32px, 10 = 40px, 12 = 48px), `size($name)` (layout sizes). Unknown keys fail the build.
- Mixins: `flex-row($gap, $align)`, `flex-column($gap)`, `flex-between($gap, $align)`, `grid-center`, `surface($padding)`, `bordered($radius)`, `accent-highlight`, `muted-text($size)`, `divided($spacing)`, `focus-ring`, `reset-button`, `reset-list`, `truncate`, `pill-control`, `icon-size($size)`, `text-field`, `floating-panel($width)`, `option-item($highlight-selector)`, `tabular-figures`, `display-type` (serif display font for headings and hero figures), `eyebrow`, `tinted($color)` (colour on a `$color-tint-amount` tint), `transition($props...)`, `visually-hidden` (hidden but still read and focusable, as the `FileDrop` input). `surface` draws the card: 1px border, the `card` radius (6) and shadow (none), 20px padding. Avatars with a fill get the hairline `border(avatar)`.
- Design values come only from the theme. A value repeated in two stylesheets becomes a mixin or function in `abstracts/`; a pattern repeated in two components becomes a component.
- Focus outlines are CSS only (no JS modality tracking): `globals.scss` rings `:focus-visible`, clears `:focus:not(:focus-visible)` and clears every outline inside `.recharts-wrapper`. Style focus with `&:focus-visible { @include focus-ring; }`, never a bare `outline`.

## Enforcement

| Rule                                                                                                                                                                                                                                                                                | Tool                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| BEM class pattern, max nesting 2, no type selectors (except `svg`), no IDs, ≤ 2 compound selectors, no `@extend`, no `!important`, width media queries only through mixins, blank lines                                                                                             | Stylelint (`.stylelintrc.json`)                                       |
| No literal colour (`color-no-hex`, `color-named`, `function-disallowed-list`) or literal font size, weight, family, radius, box shadow, z-index, letter spacing, line height, transition or border (`declaration-property-value-allowed-list`) outside `apps/web/src/styles/theme/` | Stylelint (`.stylelintrc.json`)                                       |
| Every `var(--x)` used in `apps/web/src` is defined by the theme or assigned locally; `Colors` / `ChartStyle` hold only `var(--…)`                                                                                                                                                   | Vitest `apps/web/src/styles/theme.test.ts`                            |
| Every class in a stylesheet belongs to the file's block                                                                                                                                                                                                                             | Stylelint `local/bem-block-matches-file` (`scripts/stylelint-rules/`) |
| `ui/**` rules inside `@layer ui` / `ui.*`                                                                                                                                                                                                                                           | Stylelint `local/require-layer`                                       |
| Component imports only `./<same-name>.scss`; class strings in `className` and `…ClassNames` tables belong to its block                                                                                                                                                              | ESLint `local/colocated-styles` (`scripts/eslint-rules/`)             |
| No deep component imports, no own-barrel imports, no `../../` across modules, dependency direction `shell → finance → ui`                                                                                                                                                           | ESLint `no-restricted-imports` (`eslint.config.mjs`)                  |
| Folder contract, barrels list every folder, no stray stylesheets, unique block names, every `ui` component in the docs catalogue                                                                                                                                                    | Vitest `apps/web/src/components/structure.test.ts`                    |
| Named exports only in `apps/web/src/components/`                                                                                                                                                                                                                                    | ESLint `import/no-default-export`                                     |

## Checklist: adding a component

1. Search `ui/index.ts` and the module barrel; extend an existing component if it fits.
2. Pick the module with the placement rule; create `<name>/` with `<name>.tsx`, `<name>.test.tsx`, `index.ts` and, if styled, `<name>.scss` starting with `@use 'abstracts' as *;` (wrapped in `@layer ui` for `ui/`).
3. Name classes `.<name>`, `.<name>__element`, `.<name>--modifier`; write mobile-first with `media-up`.
4. Add the folder to the module barrel with named exports.
5. `npm run lint:fix && npm run lint && npm run typecheck && npm test -- --run`.
6. Update `docs/architecture/components.md` (catalogue) when you add a `ui` component, a mixin, a function or a theme file.
