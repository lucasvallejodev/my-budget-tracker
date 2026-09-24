# Components and BEM styling

> Summary: the rules for React components and their styles: one folder per component, three modules (`ui`, `finance`, `shell`) with barrels, BEM class names written as plain strings in global `.scss` files, cascade layers, mobile-first breakpoint mixins, SCSS abstractions, and the lint rules and tests that enforce each rule.

Read this before creating, moving or styling any component. The human version is `docs/architecture/components.md`.

## Modules and placement

```
apps/web/src/components/
  ui/        project-wide building blocks, no domain knowledge (Button, Panel, Stack, Table, Field, Badge, …)
  finance/   finance components and screens (MetricCard, BudgetCard, TransactionTable, Overview, ProfileForm, PasswordForm, SessionList, DeletedItems, …)
  shell/     application frame (ApplicationShell, AuthScreen, AuthForm, UserMenu, Logo, ThemeToggle)
  structure.test.ts
```

Nothing else lives in `apps/web/src/components/`, and components do not live anywhere else: there is no `_components/` folder under `apps/web/src/app/`; pages only render components from the barrels.

Modules depend in one direction: `shell` → `finance` → `ui`. `ui/` imports no other component module (it takes data and callbacks through props), `finance/` imports only `ui`, `shell/` may import both. Shared code moves down, never up.

Decide where a component goes:

1. Used by one component only → a private file inside that component's folder (`category-manager/category-dialogs.tsx`).
2. Used by two or more components of one module → its own folder in that module.
3. Domain-free or used outside its module → `ui/<name>/`.

Before writing markup, check `ui/index.ts` for an existing component: layout (`Page`, `PageHeading`, `Stack`, `Cluster`, `Grid`, `Columns`, `Panel`), content (`Text`, `Badge`, `Notice`, `EmptyState`, `MetricValue`, `IconTile`, `ColorSwatch`, `ListRow`, `DescriptionList`, `Table`, `ProgressBar`, `Pagination`), forms (`Field`, `FormStack`, `FilterBar`, `PillInput`, `PillSelect` (pill `Select`; never a native `<select>`), `Input`, `Select`, `DatePicker`, `ToggleSwitch`, `form` / `form-fields` helpers), overlays (`Dialog`, `Popover`, `Menu`, `Command`), data (`Amount`, `QueryContent`). Extend a component with a prop or modifier rather than adding a lookalike.

## Folder contract

```
finance/budget-card/
  budget-card.tsx           the component (named export BudgetCard)
  budget-card.scss          block .budget-card (only when it has styles)
  budget-card.test.tsx      required
  budget-status.ts          private helper (optional)
  index.ts                  export { BudgetCard } from './budget-card';
```

- Folder, file and block share one kebab-case name. No nested folders.
- Every folder has `<name>.tsx`, `<name>.test.tsx` and `index.ts`; every stylesheet is `<file>.scss` next to a `<file>.tsx` of the same name, and its name is unique across all modules (class names are global).
- Module roots hold only `index.ts` and plain `.ts` modules (`use-finance-data.ts`, `use-entity-mutation.ts`, `sample-data.ts`, `transaction-labels.ts`, `export-transactions.ts`); no `.tsx` or stylesheets.
- The module barrel (`ui/index.ts`, `finance/index.ts`, `shell/index.ts`) re-exports every folder with named exports (no `export *`: Next.js client boundaries need names).
- `'use client'` goes in the component file, never in `index.ts`.
- Components, hooks and helpers in `apps/web/src/components/` are named exports; default exports are rejected (`import/no-default-export`).

## Imports

| From                            | To                           | Write                                                           |
| ------------------------------- | ---------------------------- | --------------------------------------------------------------- |
| a component                     | its stylesheet               | `import './budget-card.scss';` (only its own)                   |
| a component                     | a sibling in the same module | `import { Panel } from '../panel';`                             |
| a component                     | another module               | `import { Button, Stack } from '@/components/ui';`              |
| a page or `apps/web/src/app/**` | any component                | `@/components/finance` or `@/components/finance/account-detail` |

Never import a file inside another component's folder (`../panel/panel`, `@/components/ui/button/button`), never import a module's own barrel from inside it, never reach another module with `../../`. Data that server code also needs lives outside components (`packages/shared/src/constants/icon-names.ts` for the icon names, `packages/shared/src/constants/palette.ts` for the category-group palette).

## BEM

- Block = file name: `.budget-card`. Elements: `.budget-card__actions`. Modifiers: `.budget-card--compact`, `.budget-card__actions--sticky`. Kebab-case words, no `block__a__b`.
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
  neutral: 'badge--neutral',
  success: '',
  warning: 'badge--warning',
};

<span className="badge__dot" />                                      // a fixed element
<span className={cn('badge', ToneClassNames[tone])} />                // a variant prop: typed lookup table
<span className={cn('icon-tile', { 'icon-tile--filled': !!color })} /> // a boolean modifier
<div className={cn('panel', className)} />                            // merge a caller's class
```

Write every class in full so it can be searched for. A variant prop maps to classes through a `Record<Variant, string>` named `…ClassNames`, so TypeScript reports a missing variant; the default variant maps to `''`. ESLint (`local/colocated-styles`) rejects a class string in `className` or in a `…ClassNames` table that is not part of the file's block.

## Cascade layers

`apps/web/src/app/globals.scss` declares `@layer reset, ui;` and wraps its resets in `@layer reset`. Every `ui/**` stylesheet wraps its rules in `@layer ui { … }`; atoms that other `ui` components restyle (`button`, `input`, `popover`) use `@layer ui.base`. Feature stylesheets (`finance/`, `shell/`) are unlayered. Resulting priority: `reset` < `ui.base` < `ui` < feature styles, so a feature class always overrides a `ui` component without specificity hacks (`.a.a`) and regardless of load order.

## SCSS abstractions

Start every stylesheet with `@use 'abstracts' as *;` (resolved through `sassOptions.loadPaths` in `next.config.ts`; the files are in `apps/web/src/styles/abstracts/`).

- Breakpoints (mobile-first, BrowserStack ranges): `phone-landscape` 481px, `tablet` 601px, `tablet-landscape` 769px, `laptop` 1025px, `desktop` 1281px, `wide` 1441px. Write base styles for phones, then `@include media-up(tablet-landscape) { … }`. `media-down($name)` and `media-between($from, $to)` exist for the rare exception; `breakpoint($name)` returns the pixel value. Raw `min-width` / `max-width` / `width` media queries are rejected in components.
- Functions: `space($step)` (1 = 4px … 8 = 32px), `radius($size)` (`sm` 8, `md` 10, `lg` 12, `xl` 16, `panel` 18, `pill` 999px, `round` 50%). Unknown keys fail the build.
- Mixins: `flex-row($gap, $align)`, `flex-column($gap)`, `flex-between($gap, $align)`, `grid-center`, `surface($padding)`, `bordered($radius)`, `accent-highlight`, `muted-text($size)`, `divided($spacing)`, `focus-ring`, `reset-button`, `reset-list`, `truncate`, `pill-control`, `icon-size($size)`, `text-field`, `floating-panel($width)`, `option-item($highlight-selector)`.
- Colours still come only from `var(--token)` in `apps/web/src/styles/tokens.scss`. A value repeated in two stylesheets becomes a mixin or function in `abstracts/`; a pattern repeated in two components becomes a component.
- Focus outlines are CSS only (no JS modality tracking): `globals.scss` rings `:focus-visible`, clears `:focus:not(:focus-visible)` and clears every outline inside `.recharts-wrapper`. Style focus with `&:focus-visible { @include focus-ring; }`, never a bare `outline`.

## Enforcement

| Rule                                                                                                                                                                                    | Tool                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| BEM class pattern, max nesting 2, no type selectors (except `svg`), no IDs, ≤ 2 compound selectors, no `@extend`, no `!important`, width media queries only through mixins, blank lines | Stylelint (`.stylelintrc.json`)                                       |
| Every class in a stylesheet belongs to the file's block                                                                                                                                 | Stylelint `local/bem-block-matches-file` (`scripts/stylelint-rules/`) |
| `ui/**` rules inside `@layer ui` / `ui.*`                                                                                                                                               | Stylelint `local/require-layer`                                       |
| Component imports only `./<same-name>.scss`; class strings in `className` and `…ClassNames` tables belong to its block                                                                  | ESLint `local/colocated-styles` (`scripts/eslint-rules/`)             |
| No deep component imports, no own-barrel imports, no `../../` across modules, dependency direction `shell → finance → ui`                                                               | ESLint `no-restricted-imports` (`eslint.config.mjs`)                  |
| Folder contract, barrels list every folder, no stray stylesheets, unique block names, every `ui` component in the docs catalogue                                                        | Vitest `apps/web/src/components/structure.test.ts`                    |
| Named exports only in `apps/web/src/components/`                                                                                                                                        | ESLint `import/no-default-export`                                     |

## Checklist: adding a component

1. Search `ui/index.ts` and the module barrel; extend an existing component if it fits.
2. Pick the module with the placement rule; create `<name>/` with `<name>.tsx`, `<name>.test.tsx`, `index.ts` and, if styled, `<name>.scss` starting with `@use 'abstracts' as *;` (wrapped in `@layer ui` for `ui/`).
3. Name classes `.<name>`, `.<name>__element`, `.<name>--modifier`; write mobile-first with `media-up`.
4. Add the folder to the module barrel with named exports.
5. `npm run lint:fix && npm run lint && npm run typecheck && npm test -- --run`.
6. Update `docs/architecture/components.md` (catalogue) when you add a `ui` component or a mixin.
