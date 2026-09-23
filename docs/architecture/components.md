# Components and styles

> Summary: how React components are organised (three modules, one folder per component, barrels), how they are styled (BEM class names written as plain strings in global `.scss` files, cascade layers, mobile-first breakpoints, SCSS functions and mixins), what each shared `ui` component is for, and which tools enforce the rules.

## Why

Before this structure, most screens imported one shared `finance.module.scss` full of utility classes (`.muted`, `.actions`, `.stack`, …). The same class name meant different things in different files, stylesheets reached into each other and nobody could tell which component owned a style. Now every look belongs to exactly one component, and every component is a folder you can read on its own.

## Three modules

```
src/components/
├─ ui/          project-wide building blocks with no domain knowledge
├─ finance/     finance components and screens
├─ shell/       the application frame: sidebar, header, logo, theme toggle, auth screen
└─ structure.test.ts   checks the rules below
```

Modules depend in one direction: `shell` → `finance` → `ui`. `ui` components never import `finance` or `shell`; they receive data and callbacks through props. `finance` imports only `ui`, and `shell` may use both. When two modules need the same thing, it moves down to `ui`.

Components live only here. `src/app/` holds routes, server actions and API handlers; its pages render components from the barrels (the transactions page renders `TransactionsPage`, dialogs such as `TransactionDialog` and `CreateAccountDialog` are finance components).

Where does a new component go?

| It is used by…                               | Put it in                                                                               |
| -------------------------------------------- | --------------------------------------------------------------------------------------- |
| one component only                           | a private file inside that component's folder (`category-manager/category-dialogs.tsx`) |
| two or more components of the same module    | its own folder in that module (`finance/metric-card/`)                                  |
| other modules, or it has no domain knowledge | `ui/<name>/`                                                                            |

## One folder per component

```
src/components/finance/budget-card/
├─ budget-card.tsx           the component (named export BudgetCard)
├─ budget-card.scss          its styles: one BEM block, .budget-card
├─ budget-card.test.tsx      its tests (required)
├─ budget-status.ts          a private helper (optional)
└─ index.ts                  export { BudgetCard } from './budget-card';
```

- The folder, the component file, the stylesheet and the BEM block share one kebab-case name.
- A component without its own look has no stylesheet; it composes `ui` components.
- Module roots hold only the barrel (`index.ts`) and plain TypeScript modules such as `finance/use-finance-data.ts`, `finance/sample-data.ts`, `finance/transaction-labels.ts` and `finance/export-transactions.ts`.
- Barrels use named re-exports, never `export *`, because Next.js needs explicit names across client boundaries. `'use client'` goes in the component file.

## Importing components

```tsx
// a page or a route component
import { AccountDetail } from '@/components/finance';
import { Page, PageHeading } from '@/components/ui';

// inside finance/budget-overview/budget-overview.tsx
import { Button, Stack } from '@/components/ui'; // another module: its barrel
import { BudgetCard } from '../budget-card'; // same module: the sibling folder
import './budget-overview.scss'; // only its own stylesheet
```

Not allowed: a file inside another component's folder (`../panel/panel`, `@/components/ui/button/button`), the module's own barrel from inside the module (it creates import cycles), `../../` across modules, and any stylesheet other than the component's own.

## BEM class names

| Part     | Pattern                                       | Example                                             |
| -------- | --------------------------------------------- | --------------------------------------------------- |
| Block    | the file name                                 | `.budget-card`                                      |
| Element  | `block__element`                              | `.budget-card__actions`                             |
| Modifier | `block--modifier`, `block__element--modifier` | `.badge--danger`, `.color-picker__swatch--selected` |

Stylesheets are written with nesting, a blank line between rules and between nested rules, and the shared abstractions:

```scss
@use 'abstracts' as *;

.budget-card {
  @include bordered;
  @include flex-column(18px);

  padding: 22px;

  &__actions {
    padding-top: space(4);
    border-top: 1px solid var(--border);
  }

  @include media-up(tablet-landscape) {
    padding: space(6);
  }
}
```

Rules for selectors:

- a stylesheet styles only its own block; to change another component, give it a prop or modifier, or pass a class of your own block through its `className`;
- every styled element gets a class: no tag selectors (`p`, `li`, `th`), except `svg` for icons rendered as children;
- no IDs, no `@extend`, no `!important`, at most two compound selectors (`&__day--selected &__day-button`) and at most two levels of nesting.

In TypeScript, class names are plain strings, combined with `cn()` from `src/lib/styles.ts`:

```tsx
import { cn } from '@/lib/styles';

import './badge.scss';

const ToneClassNames: Record<BadgeTone, string> = {
  danger: 'badge--danger',
  neutral: 'badge--neutral',
  success: '',
  warning: 'badge--warning',
};

<span className="badge__dot" />;
<span className={cn('badge', ToneClassNames[tone])} />;
<span className={cn('icon-tile', { 'icon-tile--filled': !!color })} />;
<div className={cn('panel', className)} />; // merge a class passed by the caller
```

Every class is written in full, so a search for `badge--danger` finds both the style and every place that uses it. Variant props go through a typed `Record` so a new variant without a class is a type error; the default variant maps to an empty string. The stylesheets are plain global `.scss` files: class names are not hashed, and what keeps them from colliding is the rule that every class starts with its file's block name and that block names are unique across all modules.

## Cascade layers

`src/app/globals.scss` declares the layer order and puts the resets in the lowest layer:

```scss
@layer reset, ui;
```

| Layer     | Contains                                                          | Why                                                |
| --------- | ----------------------------------------------------------------- | -------------------------------------------------- |
| `reset`   | element resets and typography in `globals.scss`                   | never beats a component class                      |
| `ui.base` | atoms other `ui` components restyle: `button`, `input`, `popover` | a picker can widen a `Button` without `.a.a` hacks |
| `ui`      | every other `ui` stylesheet                                       | shared components stay overridable                 |
| unlayered | `finance/` and `shell/` stylesheets                               | feature classes always win over `ui`               |

## Breakpoints

Layouts are mobile-first: base styles target phones, larger screens add `min-width` queries through mixins. The ranges follow BrowserStack's [responsive design breakpoints](https://www.browserstack.com/guide/responsive-design-breakpoints):

| Name               | From    | Devices                                                                               |
| ------------------ | ------- | ------------------------------------------------------------------------------------- |
| (base)             | 0       | portrait phones, 320–480 px                                                           |
| `phone-landscape`  | 481 px  | landscape phones, 481–600 px                                                          |
| `tablet`           | 601 px  | portrait tablets, 601–768 px                                                          |
| `tablet-landscape` | 769 px  | landscape tablets, 769–1024 px                                                        |
| `laptop`           | 1025 px | small desktops and laptops, 1025–1280 px (sidebar and two-column layouts appear here) |
| `desktop`          | 1281 px | large desktops, 1281–1440 px                                                          |
| `wide`             | 1441 px | extra-large screens                                                                   |

```scss
.settings-view {
  grid-template-columns: minmax(0, 1fr);

  @include media-up(tablet-landscape) {
    grid-template-columns: 190px minmax(0, 1fr);
  }
}
```

`media-down($name)` and `media-between($from, $to)` exist for exceptions; `breakpoint($name)` returns the pixel value. Components may not write `min-width`, `max-width` or `width` media queries by hand.

## SCSS abstractions

Everything lives in `src/styles/abstracts/` and is loaded with `@use 'abstracts' as *;` (`next.config.ts` adds `src/styles` to Sass's load paths).

| File                | Provides                                                                                                                                                                                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_breakpoints.scss` | `$breakpoints`, `breakpoint()`, `media-up`, `media-down`, `media-between`                                                                                                                                                                                        |
| `_functions.scss`   | `space($step)`: 1 = 4 px, 2 = 8, 3 = 12, 4 = 16, 5 = 20, 6 = 24, 7 = 28, 8 = 32; `radius($size)`: `sm` 8, `md` 10, `lg` 12, `xl` 16, `panel` 18, `pill` 999 px, `round` 50 %. Unknown keys stop the build with a message.                                        |
| `_mixins.scss`      | `flex-row`, `flex-column`, `flex-between`, `grid-center`, `surface`, `bordered`, `accent-highlight`, `muted-text`, `divided`, `focus-ring`, `reset-button`, `reset-list`, `truncate`, `pill-control`, `icon-size`, `text-field`, `floating-panel`, `option-item` |

Colours still come only from `var(--token)` in `src/styles/tokens.scss`. When the same group of declarations appears in two stylesheets, turn it into a mixin; when the same markup appears in two components, turn it into a component.

### Focus outlines

Focus outlines are drawn with CSS only, no JavaScript. `globals.scss` styles `:focus-visible`, which the browser matches for keyboard navigation but not for most mouse clicks, and removes the outline from `:focus:not(:focus-visible)`. Charts are the exception: Recharts makes the chart and its slices focusable and the browser can show a ring after a click, so outlines inside `.recharts-wrapper` are removed entirely. Component focus styles use `&:focus-visible { @include focus-ring; }`.

## The `ui` catalogue

| Group       | Components                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page layout | `Page` (page padding and vertical rhythm), `PageHeading` (title, description, actions), `Stack` (vertical gap: `small`, `medium`, `large`), `Cluster` (wrapping row: `start`, `end`, `between`), `Grid` (auto-fit cards), `Columns` (main + side column from `laptop`), `Panel` (surface with optional title, description, action), `SettingsSection` (label column + content)                                                                                                         |
| Content     | `Text` (`muted`, `positive`, `negative`, `small`; renders `p`, `span`, `small`, `strong` or `label`), `Badge` (`success`, `warning`, `danger`, `neutral`), `Notice`, `EmptyState`, `MetricValue` (`default`, `fluid`), `IconTile`, `ColorSwatch`, `ListRow` (title, description, leading content, actions), `DescriptionList`, `Table` with `TableRow`, `TableHeaderCell`, `TableCell`, `ProgressBar`, `Pagination` (`text`, `compact`), `PromotionPanel`, `Spinner`, `Amount`, `Icon` |
| Forms       | `Field` (label + control, `stacked` or `filter`), `FilterBar`, `PillInput`, `PillSelect` (pill-shaped `Select` taking an `options` array), `Input`, `Select…`, `DatePicker`, `Calendar`, `ToggleSwitch`, `ColorPicker`, `IconPicker`, `EntityPicker`, `CreateNewButton`, `Form`, `FormStack`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `TextField`, `AmountField`, `DateField`, `DialogFormFooter`, `CreateNewTrigger`, `saveLabel`                     |
| Overlays    | `Dialog…`, `Popover…`, `Menu`, `MenuTrigger`, `MenuContent`, `MenuItem`, `Command…`, `TabRoot`, `TabList`, `TabTrigger`, `TabPanel`                                                                                                                                                                                                                                                                                                                                                    |
| Data        | `QueryContent` (pending, error with retry, empty, content)                                                                                                                                                                                                                                                                                                                                                                                                                             |

## How the rules are enforced

| Rule                                                                                                                                                | Checked by                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| BEM pattern, nesting depth, no type selectors, IDs, `@extend` or `!important`, compound limit, width media queries only through mixins, blank lines | Stylelint (`.stylelintrc.json`)                             |
| every class belongs to the stylesheet's block                                                                                                       | `local/bem-block-matches-file` (`scripts/stylelint-rules/`) |
| `ui` stylesheets inside `@layer ui`                                                                                                                 | `local/require-layer` (`scripts/stylelint-rules/`)          |
| a component imports only its own stylesheet and writes class strings of its own block                                                               | `local/colocated-styles` (`scripts/eslint-rules/`)          |
| no deep component imports, no own-barrel imports, no `../../` across modules, dependency direction `shell → finance → ui`                           | `no-restricted-imports` in `eslint.config.mjs`              |
| folder contract, test file present, barrels complete, block names unique, every `ui` component listed in this catalogue                             | `src/components/structure.test.ts`                          |
| named exports only in `src/components/`                                                                                                             | `import/no-default-export` in `eslint.config.mjs`           |

`npm run lint:fix` fixes the spacing rules; everything else fails `npm run lint` or `npm test` with a message that names the rule to follow.

## Adding a component

1. Look in `src/components/ui/index.ts` and the module barrel first; prefer a new prop or modifier over a lookalike.
2. Choose the module with the placement table and create the folder: `<name>.tsx`, `<name>.test.tsx`, `index.ts` and, if it has its own look, `<name>.scss` starting with `@use 'abstracts' as *;` (wrapped in `@layer ui { … }` inside `ui/`).
3. Name classes after the block, write the phone layout first and add `media-up` steps.
4. Export it from the module barrel.
5. Run `npm run lint:fix`, then `npm run lint && npx tsc --noEmit && npm test -- --run`.
6. Add it to the catalogue above if it is a `ui` component.
