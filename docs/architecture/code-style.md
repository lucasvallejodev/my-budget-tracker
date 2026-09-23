# Code style

> Summary: how the code is formatted and named, how utilities are documented with TSDoc, where constants, colours and style abstractions live, the complexity budget, and the tools that enforce all of it.

The goal is code that reads well for humans. Three tools enforce it, and `npm run lint:fix` applies everything that can be applied automatically:

| Tool                            | Enforces                                                                                                                                                                                                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Prettier (through ESLint)       | Line width (100), quotes, commas, indentation. Prettier never _adds_ blank lines, which is why the next rule exists.                                                                                                                                               |
| ESLint (`eslint.config.mjs`)    | Blank lines, object and type layout, naming, colours, function style, complexity budget, TypeScript safety (type-aware rules), React, Next.js and accessibility rules, SonarJS code smells, TSDoc on `src/lib/`.                                                   |
| Stylelint (`.stylelintrc.json`) | No hard-coded colours in SCSS outside `src/styles/tokens.scss`; BEM class names, one block per stylesheet, `ui` cascade layer, no tag selectors or `@extend`, breakpoints only through mixins, blank lines between rules ([Components and styles](components.md)). |

Two more tools report instead of block: `npm run lint:dupes` (jscpd, fails above 3 % duplicated lines) and `npm run knip` (unused files, exports and dependencies). In CI, the `SonarQube Cloud` workflow publishes duplication, cognitive complexity, coverage and code smells with history at sonarcloud.io (setup in [Setup](../getting-started/setup.md)); its quality gate judges new code only.

## Blank lines

A blank line separates the parts of a file that a reader scans separately:

- after `'use client'` and after the import block;
- before every `export`, function, class and type declaration;
- after a group of `const` / `let` declarations, before the code that uses them;
- before and after any `const` / `let` that spans more than one line (a multi-line `await Promise.all([...])` or a ternary stands alone);
- before every `return`;
- around multi-line blocks (`if`, loops, `try`).

```ts
import { handle, param } from '@/server/http';

export const GET = handle(({ userId, services, request }) =>
  services.accounts.list(userId, { includeArchived: param(request, 'includeArchived') === '1' })
);
```

## Objects and types

- An object literal with three or more properties is written one property per line. Prettier keeps it expanded (its `objectWrap: preserve` default), so you may also expand a smaller object by hand when it reads better; a line break right after the `{` is the signal.
- A `type` alias with three or more members is written one member per line. Use `type`, not `interface`.
- Inline parameter types (`({ value, target }: { value: number; target: number })`) are left to Prettier, which keeps short ones on one line.

```ts
export type CashPoint = {
  label: string;
  income: number;
  expense: number;
};
```

## Functions

- Helpers in `src/lib/`, `src/constants/` and `src/server/` are arrow functions assigned to a `const`, with an explicit return type in `src/lib/` and `src/constants/`:

  ```ts
  export const getPercentage = (value: number, target: number): number => {
    if (!value || !target) return 0;

    return Math.round((value / target) * 100);
  };
  ```

- React components, pages, route handlers and server actions stay `function` declarations (`export function Overview()`), which keeps component names in stack traces and follows the Next.js conventions.
- Single-line guards do not need braces (`if (!value) return 0;`); anything spanning lines does.

## Naming

| Kind                                                                             | Style      | Example                                    |
| -------------------------------------------------------------------------------- | ---------- | ------------------------------------------ |
| Constant objects and arrays at module scope (lookup tables, palettes, key lists) | PascalCase | `Colors`, `FinanceKeys`, `DefaultTaxonomy` |
| Primitive constants                                                              | UPPER_CASE | `MIN_YEAR`, `DEFAULT_TAXONOMY_VERSION`     |
| Functions, variables, hooks                                                      | camelCase  | `getPercentage`, `useSummary`              |
| Components, types                                                                | PascalCase | `CashFlowChart`, `CashPoint`               |
| Files                                                                            | kebab-case | `transaction-dialog.tsx`                   |

ESLint rejects a module-level `const` holding an object or array literal whose name is not PascalCase (names Next.js reserves, such as `metadata` and `config`, are exempt).

Every name must say what the value is for. One-letter and abbreviated names are out: `ToneClassNames` for a table of class names, not `tc`; `transaction => transaction.amountMinor`, not `t => t.amountMinor`; `(left, right) => left - right` in comparators; `index` in loops; a sentinel such as `UnmappedColumnValue` rather than `NONE`. ESLint enforces a minimum of two characters (`id-length`); reviewers enforce the meaning.

## No magic values, no comments

- Numbers other than -1, 0 and 1 (and array indexes or parameter defaults) must be named constants: `const MaxPreviewRows = 500`. Strings that act as keys, sentinels or configuration are named too (`UnmappedColumnValue`); user-facing copy stays inline.
- Regular expressions live only in `src/lib/patterns.ts`, in the `Patterns` object under a name that says what they match (`Patterns.isoDate`, `Patterns.amountSignWrapper`), with small helpers such as `isIsoDate(text)` for the common tests. ESLint rejects a regex literal or `new RegExp` anywhere else.
- Comments are not allowed in application code (a local rule enforces it); only tool directives, the `keep order` marker and the TSDoc blocks described below pass. The intent goes into names, small helpers and types. Config files and the local ESLint rules are the exception.

## Documenting utilities with TSDoc

Every exported function in `src/lib/` carries a [TSDoc](https://tsdoc.org/) comment. It states the contract that a name cannot: units, accepted input formats, rounding, fallbacks, errors. Editors show it on hover wherever the function is used, so `formatMoney` explains itself inside a component without opening `money.ts`.

````ts
/**
 * Converts an amount from one currency to another at a given exchange rate.
 *
 * @remarks
 * The result is rounded to the nearest minor unit, with halves rounded away from zero.
 *
 * @param amountMinor - Signed amount in minor units of `from`.
 * @param from - ISO 4217 code of the amount.
 * @param to - ISO 4217 code to convert into.
 * @param rate - Units of `to` per one unit of `from` (1 EUR = `rate` USD).
 * @returns The converted amount in minor units of `to`.
 *
 * @example
 * ```ts
 * convertMinor(1000, 'EUR', 'USD', 1.1); // 1100
 * ```
 */
export const convertMinor = (amountMinor: number, from: string, to: string, rate: number): number => …
````

- **Summary line**: one sentence saying what the function returns or does.
- **`@remarks`**: edge cases, units, fallbacks, where the function fits in the data flow. Leave it out when there is nothing surprising.
- **`@param name - description`** for every parameter (with the hyphen). Say what the value means, not its type; TypeScript already shows types, so `{type}` annotations are rejected. For an options object, describe its fields on the `options` line.
- **`@returns`**, and **`@throws`** whenever the function throws, naming the error and when.
- **`@example`** in a fenced block with the result as a trailing `// value`. Every example must be asserted by a test in the colocated `*.test.ts`.
- Link related helpers with `{@link otherHelper}`.

TSDoc is allowed only directly above an exported declaration in `src/lib/`. Private helpers, function bodies and other folders stay comment-free, and a `/** … */` block anywhere else is rejected. ESLint enforces the rest: `jsdoc/require-jsdoc` (every exported function), `jsdoc/require-param`, `jsdoc/require-returns`, `jsdoc/require-throws`, `jsdoc/check-param-names` (keeps names in sync after a rename), `jsdoc/no-types` and `tsdoc/syntax` (valid TSDoc tags and escaping).

<!-- screenshot: editor hover on a formatMoney call showing its TSDoc (docs/assets/screenshots/tsdoc-hover.png) -->

## Import order and sorting

`npm run lint:fix` keeps these deterministic (`eslint-plugin-perfectionist`):

- Imports in three groups separated by a blank line: external packages, `@/` modules, relative files. Within a group, natural order by module path. Nothing else goes in the import block; types and constants come after it.
- Named imports and exports, object literal properties, destructured parameters and type members in alphabetical order. Positional parameters are never reordered, since their order is the signature.
- When an object's order carries meaning (a display sequence), add a `// keep order` comment above the first entry; the sorter leaves everything after it as written. Ordinary comments travel with their property.

## Reuse before you write

Before adding a helper, a constant, a colour or a style value, look for an existing one:

| You need…                                              | Look in                                                                                                                                   |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| a calculation or formatting helper                     | `src/lib/` (`money.ts`, `math.ts`, `date-helpers.ts`, `styles.ts`)                                                                        |
| a lookup table, limit or unit                          | `src/constants/` (`account.ts`, `field-lengths.ts`, `http.ts`, `money.ts`, `time.ts`), the `*Keys` / `*Names` exports next to the feature |
| a regular expression or format check                   | `Patterns`, `isIsoDate`, `isIsoMonth`, `isDigitsOnly`, `isHexColor` in `src/lib/patterns.ts`                                              |
| a colour or chart style in TypeScript                  | `Colors`, `GroupColors`, `ChartStyle` in `src/styles/theme.ts`                                                                            |
| a colour, shadow or gradient in SCSS                   | the `--tokens` in `src/styles/tokens.scss`                                                                                                |
| a breakpoint, spacing, radius or repeated SCSS pattern | `media-up`, `space()`, `radius()` and the mixins in `src/styles/abstracts/`                                                               |
| a piece of markup or a look                            | the components in `src/components/ui/` ([catalogue](components.md#the-ui-catalogue))                                                      |

If it exists, use or extend it. If the same expression appears twice, move it to `src/lib/` with a test. `npm run lint:dupes` reports larger copies.

## Colours and theme

- CSS: every colour is a token in `src/styles/tokens.scss` (light and dark values, plus theme-independent values such as gradients and the overlay). SCSS modules use `var(--token)`; Stylelint rejects hex, named and `rgb()` colours anywhere else.
- TypeScript: every literal colour lives in `Colors` in `src/styles/theme.ts` (chart palette, category-group palette, fallbacks). JSX uses `var(--token)` strings when a CSS token exists and `Colors.*` when a real value is required (SVG charts, seeded data). ESLint rejects hex, `rgb()` and `hsl()` literals in any other file.
- Shared Recharts style objects (`tooltip`, `axisTick`, `grid`) come from `ChartStyle`.

## Complexity budget

| Metric                                      | Limit                                  |
| ------------------------------------------- | -------------------------------------- |
| Cyclomatic complexity per function          | 10                                     |
| Cognitive complexity per function (SonarJS) | 15                                     |
| Lines per function                          | 80 (blank lines and comments excluded) |
| Lines per file                              | 400                                    |
| Nesting depth                               | 3                                      |
| Parameters                                  | 4                                      |

These report as warnings today because existing screens exceed them. The rule is: never add a warning, and remove one when you touch the function. Once the count reaches zero they become errors.

## Commands

```bash
npm run lint          # ESLint + Stylelint (errors fail)
npm run lint:fix      # apply every automatic fix
npm run lint:dupes    # duplicated code (jscpd)
npm run knip          # unused files, exports, dependencies
```

Editor setup: install the ESLint, Prettier and Stylelint extensions and enable "fix on save" for ESLint; Prettier runs through ESLint, so no separate formatter step is needed.
