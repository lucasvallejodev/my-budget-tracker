# Frontend

> Summary: how pages, feature screens, primitives and data hooks are organised, and the styling and state conventions.

## Layout of a screen

```
src/app/(main)/<route>/page.tsx      thin page, renders one feature component
src/components/finance/<feature>.tsx client component with the screen's state and mutations
src/app/(main)/_components/*.tsx    dialogs and pickers shared across screens
src/components/primitives/*.tsx     Radix-based building blocks
```

Pages under `(main)` share `ApplicationShell` (`src/components/shell/application-shell.tsx`): sidebar navigation from `routes.ts`, account groups with per-currency subtotals, search box, theme toggle and the Clerk user button.

## Data fetching

All client reads go through `src/components/finance/use-finance-data.ts`:

| Hook | Endpoint | Query key |
| --- | --- | --- |
| `useAccounts(includeArchived)` | `/api/accounts` | `['accounts', includeArchived]` |
| `usePayees()` | `/api/payees` | `['payees']` |
| `useCategories(includeArchived)` | `/api/categories` | `['categories', includeArchived]` |
| `useCurrencies()` | `/api/currencies` | `['currencies']` (never stale) |
| `useSettings()` | `/api/settings` | `['settings']` |
| `useTransactions(params)` | `/api/transactions?…` | `['transactions', params]` |
| `useSummary(month)` | `/api/reports/summary?month=` | `['summary', month]` |
| `useExchangeRates()` | `/api/exchange-rates` | `['exchange-rates']` |
| `useRules()` | `/api/rules` | `['rules']` |
| `useBudgets(month)` | `/api/budgets?month=` | `['budgets', month]` |

After any mutation, components invalidate every key in `FinanceKeys`. Mutations call server actions through `useMutation`, show a toast on success or `error.message` on failure, then invalidate.

Types for rows (`TransactionRow`, `AccountSummary`, `CategoryTree`, …) are imported from the server services with `import type`, so the client and server never drift.

## Forms

Forms use React Hook Form with `zodResolver` and the schemas in `src/schema/`. Money fields are text inputs (`inputMode="decimal"`) whose value is parsed on the server with the account's currency. Dates are `YYYY-MM-DD` strings picked with the shared calendar popover.

The transaction dialog (`transaction-dialog.tsx`) has three modes, expense, income and transfer, and works for both creating and editing; editing a transfer leg edits the whole transfer.

## Pickers

- `AccountPicker` and `PayeePicker` wrap `EntityPicker` (searchable popover with a "Create new" dialog).
- `CategoryPicker` opens a dialog grouped by category group, filtered by kind (income/expense) when the caller knows the direction, with a "Leave uncategorized" option.
- `IconPicker` shows the curated registry as a searchable grid; `ColorPicker` offers a palette plus a custom colour input.

## Styling

- Global tokens in `src/styles/tokens.scss` (light and dark) and resets in `src/app/globals.scss`. Stylesheets only use `var(--token)`; Stylelint rejects literal colours elsewhere.
- Colours needed from TypeScript (chart palette, category-group palette, fallbacks) come from `Colors` in `src/styles/theme.ts`; Recharts style objects from `ChartStyle`. ESLint rejects literal colours in any other file. See [Code style](code-style.md).
- Everything else is a SCSS module next to its component (`finance.module.scss`, `forms.module.scss`, `controls.module.scss`, `shell.module.scss`). Class names are composed with `cn()` from `src/lib/styles.ts`.
- Group colours come from the database and are applied inline (`style={{ background: group.color }}`); no per-category colours exist.
- Icons render through `Icon` (`src/components/icon.tsx`), which only knows the names in `src/components/icons/registry.ts`. Unknown names fall back to a question mark. Add icons to the registry, never import the whole lucide package.

## Sample data and the gallery

`/test` renders `ComponentGallery` with sample data from `sample-data.ts` so components can be reviewed without a database. Sample rows follow the real `TransactionRow` shape.

## Adding a screen

1. Create the feature component in `src/components/finance/` and a page under `src/app/(main)/`.
2. Add a hook in `use-finance-data.ts` if it needs a new endpoint, and add its key to `FinanceKeys`.
3. Add the route to `src/app/(main)/routes.ts` if it belongs in the sidebar.
4. Write a component test with a prefilled `QueryClient` (see `category-manager.test.tsx`).
5. Document it under `docs/features/` with screenshot placeholders.
