# Frontend

> Summary: how pages, feature screens, shared `ui` components and data hooks are organised, and the styling and state conventions.

## Layout of a screen

```
src/app/(main)/<route>/page.tsx                 thin page, renders one feature component
src/components/finance/<screen>/<screen>.tsx    client component with the screen's state and mutations
src/components/finance/<part>/                  finance building blocks (MetricCard, BudgetCard, charts, …)
src/components/ui/<component>/                  project-wide building blocks (Page, Panel, Stack, Button, Dialog, …)
src/app/(main)/_components/*.tsx                dialogs and pickers shared across screens
```

Every component is a folder with its component, test, `index.ts` and optional BEM stylesheet; pages import from the module barrels (`@/components/finance`, `@/components/ui`). The rules are in [Components and styles](components.md).

Pages under `(main)` share `ApplicationShell` (`src/components/shell/application-shell/`): sidebar navigation from `routes.ts`, account groups with per-currency subtotals, search box, theme toggle and the Clerk user button.

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

After any mutation, components invalidate every key in `FinanceKeys`, through `useRefreshFinance()`. Mutations call server actions through `useMutation`, show a toast on success or `error.message` on failure, then invalidate.

Screens render a query's lifecycle through `QueryContent` from `@/components/ui` (`pending`, `error` with a retry button, an optional `empty` state, then the children render function) instead of chained ternaries. Budget badges take their tone and label from `budgetStatus(ratio)` in `finance/budget-card/`.

Types for rows (`TransactionRow`, `AccountSummary`, `CategoryTree`, …) are imported from the server services with `import type`, so the client and server never drift.

## Forms

Forms use React Hook Form with `zodResolver` and the schemas in `src/schema/`. Money fields are text inputs (`inputMode="decimal"`) whose value is parsed on the server with the account's currency. Dates are `YYYY-MM-DD` strings picked with the shared calendar popover.

Dialog forms are assembled from shared pieces rather than written field by field:

| Piece | File | What it gives you |
| --- | --- | --- |
| `TextField`, `AmountField`, `DateField` | `src/components/ui/form-fields/` | A `FormField` wrapper taking `control`, `name`, `label` and `description`; `AmountField` is the decimal text input, `DateField` the calendar popover. |
| `DialogFormFooter`, `saveLabel`, `CreateNewTrigger` | `src/components/ui/dialog-form/` | The Cancel + submit row (spinner while pending; `saveLabel(editing, 'Create')` yields "Save" or the create label) and the "Create new" row pickers use to open a dialog. |
| `useEntityMutation` | `src/app/(main)/_components/use-entity-mutation.ts` | `useMutation` plus the success toast, invalidation of every `FinanceKeys` query and the caller's follow-up (reset, close, callback). |
| `AccountField`, `PayeeField`, `CategoryField`, `MemoField` | `src/app/(main)/_components/transaction-fields.tsx` | The transaction pickers as form fields. |
| `AccountFormFields`, `accountDefaults`, `saveAccount` | `src/app/(main)/_components/account-fields.tsx` | The account form's type, currency and detail fields and its create/update wiring. |

The transaction dialog (`transaction-dialog.tsx`) has three modes, expense, income and transfer, and works for both creating and editing; editing a transfer leg edits the whole transfer. Its default values come from `standardDefaults` and `transferDefaults`, which merge an existing row or a caller preset with blank values.

## Pickers

- `AccountPicker` and `PayeePicker` wrap `EntityPicker` (searchable popover with a "Create new" dialog).
- `CategoryPicker` opens a dialog grouped by category group, filtered by kind (income/expense) when the caller knows the direction, with a "Leave uncategorized" option.
- `IconPicker` shows the curated registry as a searchable grid; `ColorPicker` offers a palette plus a custom colour input. Both live in `src/components/ui/`; `CategoryPicker` lives in `src/components/finance/category-picker/`.

## Styling

- Global tokens in `src/styles/tokens.scss` (light and dark) and resets in `src/app/globals.scss` (inside `@layer reset`). Stylesheets only use `var(--token)`; Stylelint rejects literal colours elsewhere.
- Colours needed from TypeScript (chart palette, category-group palette, fallbacks) come from `Colors` in `src/styles/theme.ts`; Recharts style objects from `ChartStyle`. ESLint rejects literal colours in any other file. See [Code style](code-style.md).
- Everything else is a stylesheet named after its component, holding one BEM block (`budget-card.scss` → `.budget-card`, `.budget-card__actions`). Components write the class names as plain strings and combine them with `cn()` from `src/lib/styles.ts`. Layouts are mobile-first with the breakpoint mixins in `src/styles/abstracts/`. See [Components and styles](components.md).
- Group colours come from the database and are applied inline (`style={{ background: group.color }}`); no per-category colours exist.
- Icons render through `Icon` (`src/components/ui/icon/`), which only knows the names in `src/constants/icons.ts`. Unknown names fall back to a question mark. Add icons to the registry, never import the whole lucide package.

## Sample data and the gallery

`/test` renders `ComponentGallery` with sample data from `finance/sample-data.ts` so components can be reviewed without a database. Sample rows follow the real `TransactionRow` shape.

## Adding a screen

1. Create the feature folder `src/components/finance/<screen>/` (component, test, `index.ts`), export it from `finance/index.ts` and render it from a page under `src/app/(main)/`. Build it from `ui` components; add a stylesheet only for a look no component provides.
2. Add a hook in `use-finance-data.ts` if it needs a new endpoint, and add its key to `FinanceKeys`.
3. Add the route to `src/app/(main)/routes.ts` if it belongs in the sidebar.
4. Write the component test `<screen>.test.tsx` with a prefilled `QueryClient` (see `category-manager/category-manager.test.tsx`).
5. Document it under `docs/features/` with screenshot placeholders.
