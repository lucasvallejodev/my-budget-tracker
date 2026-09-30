# Components and styles

> Summary: how React components are organised (three modules, one folder per component, barrels), how they are styled (the configurable SCSS theme, BEM class names written as plain strings in global `.scss` files, cascade layers, mobile-first breakpoints, SCSS functions and mixins), what each shared `ui` component is for, and which tools enforce the rules.

## Why

Before this structure, most screens imported one shared `finance.module.scss` full of utility classes (`.muted`, `.actions`, `.stack`, …). The same class name meant different things in different files, stylesheets reached into each other and nobody could tell which component owned a style. Now every look belongs to exactly one component, and every component is a folder you can read on its own.

## Three modules

```
apps/web/src/components/
├─ ui/          project-wide building blocks with no domain knowledge
├─ finance/     finance components and screens, including ProfileForm, PasswordForm, SessionList and DeletedItems
├─ shell/       the application frame: sidebar, header, logo, auth screen, AuthForm (sign-in and sign-up), UserMenu
└─ structure.test.ts   checks the rules below
```

Modules depend in one direction: `shell` → `finance` → `ui`. `ui` components never import `finance` or `shell`; they receive data and callbacks through props. `finance` imports only `ui`, and `shell` may use both. When two modules need the same thing, it moves down to `ui`.

Components live only here. `apps/web/src/app/` holds only routes (pages and layouts); its pages render components from the barrels (the transactions page renders `TransactionsPage`, dialogs such as `TransactionDialog` and `CreateAccountDialog` are finance components).

Where does a new component go?

| It is used by…                               | Put it in                                                                               |
| -------------------------------------------- | --------------------------------------------------------------------------------------- |
| one component only                           | a private file inside that component's folder (`category-manager/category-dialogs.tsx`) |
| two or more components of the same module    | its own folder in that module (`finance/metric-card/`)                                  |
| other modules, or it has no domain knowledge | `ui/<name>/`                                                                            |

## One folder per component

```
apps/web/src/components/finance/budget-overview/
├─ budget-overview.tsx       the component (named export BudgetOverview)
├─ budget-overview.scss      its styles: one BEM block, .budget-overview
├─ budget-overview.test.tsx  its tests (required)
├─ budget-dialog.tsx         a private part (optional)
└─ index.ts                  export { BudgetOverview } from './budget-overview';
```

- The folder, the component file, the stylesheet and the BEM block share one kebab-case name.
- A component without its own look has no stylesheet; it composes `ui` components.
- Module roots hold only the barrel (`index.ts`) and plain TypeScript modules such as `finance/use-finance-data.ts`, `finance/sample-data.ts`, `finance/transaction-labels.ts`, `finance/budget-status.ts`, `finance/conversion.ts`, `finance/net-worth.ts` (`netWorthByMonth`, `shortMonthLabel`), `finance/comparisons.ts` (`compareWith`), `finance/export-transactions.ts` and `finance/use-entity-mutation.ts`.
- Barrels use named re-exports, never `export *`, because Next.js needs explicit names across client boundaries. `'use client'` goes in the component file.

## Importing components

```tsx
// a page or a route component
import { AccountDetail } from '@/components/finance';
import { Page, PageHeading } from '@/components/ui';

// inside finance/budget-overview/budget-overview.tsx
import { Button, Stack } from '@/components/ui'; // another module: its barrel
import { BudgetLine } from '../budget-line'; // same module: the sibling folder
import './budget-overview.scss'; // only its own stylesheet
```

Not allowed: a file inside another component's folder (`../panel/panel`, `@/components/ui/button/button`), the module's own barrel from inside the module (it creates import cycles), `../../` across modules, and any stylesheet other than the component's own.

## BEM class names

| Part     | Pattern                                       | Example                                             |
| -------- | --------------------------------------------- | --------------------------------------------------- |
| Block    | the file name                                 | `.budget-line`                                      |
| Element  | `block__element`                              | `.budget-line__meta`                                |
| Modifier | `block--modifier`, `block__element--modifier` | `.badge--danger`, `.color-picker__swatch--selected` |

Stylesheets are written with nesting, a blank line between rules and between nested rules, and the shared abstractions:

```scss
@use 'abstracts' as *;

.budget-line {
  @include bordered;
  @include flex-column(18px);

  padding: 22px;

  &__meta {
    padding-top: space(4);
    border-top: border(divider);
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

In TypeScript, class names are plain strings, combined with `cn()` from `apps/web/src/lib/styles.ts`:

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

<span className="metric-card__label" />;
<span className={cn('badge', ToneClassNames[tone])} />;
<span className={cn('avatar', { 'avatar--filled': !!fill })} />;
<div className={cn('panel', className)} />; // merge a class passed by the caller
```

Every class is written in full, so a search for `badge--danger` finds both the style and every place that uses it. Variant props go through a typed `Record` so a new variant without a class is a type error; the default variant maps to an empty string. The stylesheets are plain global `.scss` files: class names are not hashed, and what keeps them from colliding is the rule that every class starts with its file's block name and that block names are unique across all modules.

## Cascade layers

`apps/web/src/app/globals.scss` declares the layer order and puts the resets in the lowest layer:

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

## Theme

Every design value (colour, font, size, radius, border, shadow, layer, spacing, layout size, motion) is defined once, in `apps/web/src/styles/theme/`. The app has one light theme; there is no dark mode.

| File               | Variables                                                                                                                                                                                                                                                                                           | Controls                                                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `_colors.scss`     | `$color-brand`, `$color-text`, `$color-canvas`, `$color-surface`, `$color-positive`, `$color-warning`, `$color-negative`, `$color-info` with their `-soft` and `-mark` variants, `$color-account-*`, `$color-metric-*`, `$color-chart-*`, `$color-avatar-tints`; all collected in the `$colors` map | brand, text, surfaces, borders, status colours, account-type and metric icon colours, chart colours, avatar tints, selection, overlay |
| `_typography.scss` | `$font-family-sans`, `$font-family-mono`, `$font-sizes`, `$font-weights`, `$line-heights`, `$letter-spacings`                                                                                                                                                                                       | font stack and every type size, weight, line height and letter spacing                                                                |
| `_shape.scss`      | `$border-width`, `$border-width-focus`, `$radii`, `$borders`                                                                                                                                                                                                                                        | corner radii and border styles                                                                                                        |
| `_elevation.scss`  | `$shadows`, `$z-indexes`                                                                                                                                                                                                                                                                            | shadows (`card`, `raised`, `pop`, `focus`, `selected`) and stacking order                                                             |
| `_spacing.scss`    | `$spaces`                                                                                                                                                                                                                                                                                           | the 4 px spacing scale                                                                                                                |
| `_layout.scss`     | `$layout-sizes`                                                                                                                                                                                                                                                                                     | sidebar width, content width, header and tab bar height, control and row heights, avatar and icon sizes, card and page padding        |
| `_motion.scss`     | `$durations`, `$easings`                                                                                                                                                                                                                                                                            | transition speed and curve                                                                                                            |
| `_index.scss`      | forwards the files above                                                                                                                                                                                                                                                                            | what `@use 'theme'` and `@use 'abstracts'` expose                                                                                     |

### Changing the look

Edit one file and every screen follows:

- **Brand colour**: set `$color-brand` in `_colors.scss`. The hover, soft background, brand text and selection colours are computed from it with `sass:color`, so the whole family changes with it.
- **Font**: `apps/web/src/app/layout.tsx` loads Inter with `next/font/google` and exposes it as `--font-inter` on `<html>`; `$font-family-sans` in `_typography.scss` names it first. To switch fonts, load the new one in `layout.tsx` and update `$font-family-sans`.
- **Borders**: change `$border-width` or the entries of `$borders` (`card`, `control`, `divider`, `dashed`) in `_shape.scss`.
- **Corners**: change the entries of `$radii` (`small` 6 px, `control` 8, `card` 12, `dialog` 16, `pill` 999, `round` 50 %) in `_shape.scss`.

<!-- screenshot: Home with the default purple brand next to the same screen after changing $color-brand (docs/assets/screenshots/theme-brand-colour.png) -->

### How values reach components

`apps/web/src/styles/tokens.scss` emits every theme value as a CSS custom property on `:root`: `--color-*`, `--font-sans`, `--font-mono`, `--font-size-*`, `--font-weight-*`, `--line-height-*`, `--letter-spacing-*`, `--radius-*`, `--border-*`, `--shadow-*`, `--z-index-*`, `--space-*`, `--size-*`, `--duration-*`, `--easing-*` and `--color-avatar-1` to `--color-avatar-8`.

Stylesheets read them in two ways:

- `var(--color-text-muted)` directly;
- a function from `abstracts/_functions.scss` that checks the key at build time and returns the matching `var(--…)`: `color()`, `font-size()`, `font-weight()`, `line-height()`, `letter-spacing()`, `radius()`, `shadow()`, `z-index()`, `border()`, `duration()`, `easing()`. An unknown key stops the build with the list of valid keys.

`space()` and `size()` return plain pixel values at compile time, so they also work in arithmetic and media queries.

TypeScript reads the same variables: `Colors` and `ChartStyle` in `apps/web/src/styles/theme.ts` hold only `var(--…)` strings, which Recharts accepts. Category group colours are user data, not theme: they live in `packages/shared/src/constants/palette.ts` and reach the web app as `Colors.group`, `GroupColors` and `DefaultPickerColor`.

### Brand logos

Payee avatars show a brand logo for about 55 well-known payees. The glyphs come from the `simple-icons` package, a dependency of `apps/web`: the drawings are CC0, while the brands keep their trademarks. They are bundled into the app, so no request ever goes to a logo service and the Content Security Policy needs no new source.

- `apps/web/src/constants/brands.ts` holds the curated map `BrandIcons`: a normalized key (lowercase letters and digits, such as `ubereats`) to a Simple Icons constant (`siUbereats`) with its `path`, `hex` and `title`. Import only the icons you list, never the whole package.
- `apps/web/src/lib/payee-avatar.ts` turns a payee name into an avatar: `payeeKey` normalizes it (with `Patterns.nonAlphanumeric`), `brandFor` finds the brand whose key the name starts with (the longest key wins, so "Uber Eats" beats "Uber"), `brandForeground` picks a readable glyph color for the brand background, and for unknown payees `initialsOf` builds a two-letter monogram and `monogramTint` picks one of the eight `--color-avatar-N` tints from the name, so a payee always gets the same one.
- `PayeeAvatar` (`finance/payee-avatar/`, props `name`, optional `icon`, `color` and `size`) renders the result in a `ui` `Avatar`, in this order: the brand logo on a solid `fill` of the brand color when the name matches a known brand; otherwise the payee's chosen `icon` (a curated icon or an emoji) tinted in its `color`; otherwise the initials on a solid `fill` of the chosen `color`, or of the monogram tint when there is none. Transaction rows carry `payeeIcon` and `payeeColor` for it. `CategoryAvatar`, exported from `finance/category-picker/`, renders a category icon on its group color.

To add a brand, import its `si*` constant in `brands.ts` and add an entry whose key is the normalized brand name as it appears at the start of bank texts. `apps/web/src/lib/payee-avatar.test.ts` shows the expected matches.

## SCSS abstractions

Everything lives in `apps/web/src/styles/abstracts/` and is loaded with `@use 'abstracts' as *;` (`next.config.ts` adds `apps/web/src/styles` to Sass's load paths). `abstracts` forwards the theme, so its variables are available too.

| File                | Provides                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_breakpoints.scss` | `$breakpoints`, `breakpoint()`, `media-up`, `media-down`, `media-between`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `_functions.scss`   | `space($step)`: 1 = 4 px, 2 = 8, 3 = 12, 4 = 16, 5 = 20, 6 = 24, 7 = 28, 8 = 32, 10 = 40, 12 = 48; `size($name)`: a layout size in px; `radius()` (`small`, `control`, `card`, `dialog`, `pill`, `round`), `shadow()` (`card`, `raised`, `pop`, `focus`, `selected`), `border()` (`card`, `control`, `divider`, `dashed`), `color()`, `font-size()`, `font-weight()`, `line-height()`, `letter-spacing()`, `z-index()`, `duration()`, `easing()`. Unknown keys stop the build with a message.                                                                                                              |
| `_mixins.scss`      | `flex-row`, `flex-column`, `flex-between`, `grid-center`, `surface` (the card: 1 px border, radius 12, small shadow, 20 px padding), `bordered`, `accent-highlight`, `muted-text`, `divided`, `focus-ring`, `reset-button`, `reset-list`, `truncate`, `pill-control`, `icon-size`, `text-field`, `floating-panel`, `option-item`, `tabular-figures`, `eyebrow` (small uppercase label), `tinted($color)` (the colour on a 12 % tint of itself), `transition($props...)`, `visually-hidden` (hides an element but keeps it for screen readers and keyboard focus, such as the file input inside `FileDrop`) |

Design values come only from the theme. When the same group of declarations appears in two stylesheets, turn it into a mixin; when the same markup appears in two components, turn it into a component.

### Focus outlines

Focus outlines are drawn with CSS only, no JavaScript. `globals.scss` styles `:focus-visible`, which the browser matches for keyboard navigation but not for most mouse clicks, and removes the outline from `:focus:not(:focus-visible)`. Charts are the exception: Recharts makes the chart and its slices focusable and the browser can show a ring after a click, so outlines inside `.recharts-wrapper` are removed entirely. Charts drawn in `ChartFrame` with `data` are hidden from screen readers and keyboard, and a visually hidden table under them lists the same numbers, so nobody needs the drawing to read them. Dialogs opened from state use `useDialogState` (`apps/web/src/lib/dialog-state.ts`), which focuses the control that opened the dialog again after it closes; one-tab-stop groups (`SegmentedControl`, `ColorPicker`, `IconPicker`) move with the arrow keys, Home and End through `nextRovingIndex` in `apps/web/src/lib/roving-focus.ts`, and colours and icons are named in words (`paletteColorName`, `humanizeIdentifier` in `packages/shared/src/lib/labels.ts`). Component focus styles use `&:focus-visible { @include focus-ring; }`.

## The `ui` catalogue

| Group       | Components                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Page layout | `Page` (page padding and vertical rhythm), `PageHeading` (title, description, actions), `Stack` (vertical gap: `small`, `medium`, `large`), `Cluster` (wrapping row: `start`, `end`, `between`), `Grid` (auto-fit cards), `Columns` (main + side column from `laptop`), `Panel` (surface with optional title, description, action), `SettingsSection` (label column + content)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Content     | `Text` (`muted`, `positive`, `negative`, `small`; renders `p`, `span`, `small`, `strong` or `label`), `Badge` (`success`, `warning`, `danger`, `info`, `neutral`; optional `icon`), `Notice`, `EmptyState`, `MetricValue` (`default`, `fluid`, `small`), `Avatar` (an icon or monogram in `color` on a 12 % tint of it, or a solid `fill` with `background` and `foreground` for brand logos and monograms; `label` exposes it as `role="img"`; `shape` `circle` for payees, categories and metrics or `square` for accounts; `size` `default` or `small`), `ColorSwatch`, `ListRow` (title, description, leading content, actions), `DescriptionList`, `Table` (required `label`: the scrollable wrapper is a named, keyboard-focusable region) with `TableRow`, `TableHeaderCell`, `TableCell`, `ProgressBar` (native `progress` with a required `label`; `tone` `brand`, `positive`, `warning` or `danger`; `size` `default` or `large`; `color` overrides the fill, such as a group color; optional `marker`, a decorative tick such as the even-pace point on a budget bar, and `markerLabel`, text shown above it such as "Today · 18 of 30 days"), `Stat` (a figure: `label` with an optional `leading` icon or swatch, a tabular `value`, `meta` text and an optional `delta` whose arrow follows `rising` and whose color follows `good`, so spending down is green; `size` `default`, `large` or `hero`), `Sparkline` (a tiny SVG line of `points` scaled to their range, `role="img"` with a required `label`; optional `color`), `Pagination` (`text`, `compact`), `Spinner`, `Skeleton` (a pulsing placeholder, hidden from screen readers; `shape` `line`, `title`, `block` or `card`; the pulse stops under `prefers-reduced-motion` through the global rule in `globals.scss`), `SkeletonText` (a few skeleton lines in a `role="status"` element with a `label` kept for screen readers), `Amount` (tabular figures; only a positive `signed` amount turns green, expenses stay in the text colour), `Icon` (a Lucide icon by its curated name, or an emoji value drawn as text at the same size; an unknown name draws `CircleHelp`) |
| Forms       | `SegmentedControl` (a `radiogroup` of buttons with a required `label`, `options` and `value`; one tab stop, arrow keys move and select, as the currency switch and the budget order use it), `Field` (label + control, `stacked` or `filter`), `FilterBar`, `PillInput`, `PillSelect` (pill-shaped `Select` taking an `options` array), `Input`, `Select…`, `DatePicker`, `Calendar`, `ToggleSwitch`, `FileDrop` (a drop zone around a real, labelled, visually hidden file input: `label`, `accept`, `hint`, `fileName` and `onFile(file)`; highlighted while a file is dragged over it; the Import page's CSV file step), `ColorPicker`, `IconPicker` (a searchable grid of the curated icons: `value`, `onChange`, optional `color` for the selected tile; `allowEmoji` adds an **Emoji** field, "Or type an emoji", that accepts exactly one emoji checked with `isEmoji`; pass the user's `allowEmoji` setting), `EntityPicker`, `CreateNewButton`, `Form`, `FormStack`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `TextField`, `AmountField`, `DateField`, `DialogFormFooter`, `CreateNewTrigger`, `saveLabel`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Overlays    | `Dialog…`, `Popover…`, `Menu`, `MenuTrigger`, `MenuContent`, `MenuItem`, `Combobox` (WAI-ARIA combobox on cmdk inside a `Popover`: a text-field or chip trigger named "<label>: <value>", sections with headings, sections such as Suggested or Recent hidden while searching (`hideWhileSearching`), keyword filtering where every typed word must appear in the option or its section keywords (`matchesSearch`), optional clear option and footer; variants `field` and `chip`), `Command…`, `TabRoot`, `TabList`, `TabTrigger`, `TabPanel`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Data        | `QueryContent` (pending as `SkeletonText` with the `loading` text, error with retry, empty, content)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## How the rules are enforced

| Rule                                                                                                                                                                    | Checked by                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| BEM pattern, nesting depth, no type selectors, IDs, `@extend` or `!important`, compound limit, width media queries only through mixins, blank lines                     | Stylelint (`.stylelintrc.json`)                                                                                  |
| no literal colour, font size, font weight, font family, radius, shadow, z-index, letter spacing, line height, transition or border outside `apps/web/src/styles/theme/` | Stylelint (`color-no-hex`, `color-named`, `function-disallowed-list`, `declaration-property-value-allowed-list`) |
| every `var(--…)` used in the web app is defined by the theme or assigned locally                                                                                        | `apps/web/src/styles/theme.test.ts`                                                                              |
| every class belongs to the stylesheet's block                                                                                                                           | `local/bem-block-matches-file` (`scripts/stylelint-rules/`)                                                      |
| `ui` stylesheets inside `@layer ui`                                                                                                                                     | `local/require-layer` (`scripts/stylelint-rules/`)                                                               |
| a component imports only its own stylesheet and writes class strings of its own block                                                                                   | `local/colocated-styles` (`scripts/eslint-rules/`)                                                               |
| no deep component imports, no own-barrel imports, no `../../` across modules, dependency direction `shell → finance → ui`                                               | `no-restricted-imports` in `eslint.config.mjs`                                                                   |
| folder contract, test file present, barrels complete, block names unique, every `ui` component listed in this catalogue                                                 | `apps/web/src/components/structure.test.ts`                                                                      |
| named exports only in `apps/web/src/components/`                                                                                                                        | `import/no-default-export` in `eslint.config.mjs`                                                                |

`npm run lint:fix` fixes the spacing rules; everything else fails `npm run lint` or `npm test` with a message that names the rule to follow.

## Adding a component

1. Look in `apps/web/src/components/ui/index.ts` and the module barrel first; prefer a new prop or modifier over a lookalike.
2. Choose the module with the placement table and create the folder: `<name>.tsx`, `<name>.test.tsx`, `index.ts` and, if it has its own look, `<name>.scss` starting with `@use 'abstracts' as *;` (wrapped in `@layer ui { … }` inside `ui/`).
3. Name classes after the block, write the phone layout first and add `media-up` steps.
4. Export it from the module barrel.
5. Run `npm run lint:fix`, then `npm run lint && npm run typecheck && npm test -- --run`.
6. Add it to the catalogue above if it is a `ui` component.
