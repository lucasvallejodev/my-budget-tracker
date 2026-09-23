# Code style

> Summary: how the code is formatted and named, where constants and colours live, the complexity budget, and the tools that enforce all of it.

The goal is code that reads well for humans. Three tools enforce it, and `npm run lint:fix` applies everything that can be applied automatically:

| Tool                            | Enforces                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prettier (through ESLint)       | Line width (100), quotes, commas, indentation. Prettier never _adds_ blank lines, which is why the next rule exists.                                                                        |
| ESLint (`eslint.config.mjs`)    | Blank lines, object and type layout, naming, colours, function style, complexity budget, TypeScript safety (type-aware rules), React, Next.js and accessibility rules, SonarJS code smells. |
| Stylelint (`.stylelintrc.json`) | No hard-coded colours in SCSS outside `src/styles/tokens.scss`.                                                                                                                             |

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

## Reuse before you write

Before adding a helper, a constant, a colour or a style value, look for an existing one:

| You need…                             | Look in                                                              |
| ------------------------------------- | -------------------------------------------------------------------- |
| a calculation or formatting helper    | `src/lib/` (`money.ts`, `math.ts`, `date-helpers.ts`, `styles.ts`)   |
| a lookup table or list of options     | `src/constants/`, the `*Keys` / `*Names` exports next to the feature |
| a colour or chart style in TypeScript | `Colors`, `GroupColors`, `ChartStyle` in `src/styles/theme.ts`       |
| a colour, shadow or gradient in SCSS  | the `--tokens` in `src/styles/tokens.scss`                           |

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
