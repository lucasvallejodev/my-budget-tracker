# Frontend

> Summary: how the Next.js client in `apps/web` is organised: pages, feature screens, shared `ui` components, the API client, React Query hooks and mutation functions, the sign-in pages and route guard, the user menu, Settings › Profile and Security, the Deleted items screen, `useHydrated`, and the styling and state conventions.

`apps/web` has no server code of its own: no route handlers, server actions or database access. Every read and write is an HTTP call to the Fastify API under `/api/v1`, which Next.js forwards (see [Overview](overview.md) and [API service](api.md)).

## Layout of a screen

```
apps/web/src/app/(main)/<route>/page.tsx                 thin page, renders one feature component
apps/web/src/components/finance/<screen>/<screen>.tsx    client component with the screen's state and mutations
apps/web/src/components/finance/<part>/                  finance building blocks (MetricCard, BudgetCard, charts, …)
apps/web/src/components/ui/<component>/                  project-wide building blocks (Page, Panel, Stack, Button, Dialog, …)
```

Every component is a folder with its component, test, `index.ts` and optional BEM stylesheet; pages import from the module barrels (`@/components/finance`, `@/components/ui`). The rules are in [Components and styles](components.md).

Pages under `(main)` share `ApplicationShell` (`apps/web/src/components/shell/application-shell/`): sidebar navigation from `routes.ts`, account groups with per-currency subtotals, search box, theme toggle and the `UserMenu` (see [Authentication in the client](#authentication-in-the-client)).

## API client

`apps/web/src/api/client.ts` is the only place that calls `fetch`:

| Export                            | What it does                                                                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apiRequest(method, path, body?)` | Sends `/api/v1<path>` with `credentials: 'same-origin'` and a JSON body, returns the parsed JSON (or nothing for `204`). A non-2xx answer throws `ApiError`. |
| `apiGet(path, params?)`           | `GET` with a query string built from `params` (empty values are dropped).                                                                                    |
| `apiList(path, params?)`          | `GET` a collection and return its `items`.                                                                                                                   |
| `apiPages(path, params?)`         | Follow `nextCursor` until the last page and return every item (the CSV export uses it).                                                                      |
| `ApiError`                        | `message`, `status`, `code` and `fields` from the API's `{ error }` body.                                                                                    |

URLs are relative, so the browser sends them to the Next.js origin with the session cookie and Next.js rewrites them to the API. A `401` on anything other than `/auth/*` sends the browser to `/sign-in?next=<current path>`.

## Reading data

All client reads go through the hooks in `apps/web/src/components/finance/use-finance-data.ts`; the keys are in `QueryKeys`:

| Hook                                                                                                 | Endpoint                               | Query key                         |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------- |
| `useAccounts(includeArchived)`                                                                       | `/accounts`                            | `['accounts', includeArchived]`   |
| `usePayees()`                                                                                        | `/payees`                              | `['payees']`                      |
| `useCategories(includeArchived)`                                                                     | `/category-groups`                     | `['categories', includeArchived]` |
| `useCurrencies()`                                                                                    | `/currencies`                          | `['currencies']` (never stale)    |
| `useSettings()`                                                                                      | `/settings`                            | `['settings']`                    |
| `useTransactions(params)`                                                                            | `/transactions?…` (first page)         | `['transactions', params]`        |
| `useSummary(month)`                                                                                  | `/reports/summary?month=`              | `['summary', month]`              |
| `useExchangeRates()`                                                                                 | `/exchange-rates`                      | `['exchange-rates']`              |
| `useRules()`                                                                                         | `/rules`                               | `['rules']`                       |
| `useBudgets(month)`                                                                                  | `/budgets?month=`                      | `['budgets', month]`              |
| `useCurrentUser()`                                                                                   | `/me`                                  | `['me']` (never stale)            |
| `useSessions()`                                                                                      | `/me/sessions`                         | `['sessions']`                    |
| `useDeletedTransactions()`, `useDeletedAccounts()`, `useDeletedRules()`, `useDeletedExchangeRates()` | the list endpoints with `deleted=true` | `['deleted', resource]`           |

Screens render a query's lifecycle through `QueryContent` from `@/components/ui` (`pending`, `error` with a retry button, an optional `empty` state, then the children render function) instead of chained ternaries. Budget badges take their tone and label from `budgetStatus(ratio)` in `finance/budget-card/`.

Types for rows (`TransactionRow`, `AccountSummary`, `CategoryTree`, `User`, …) are the response contracts in `packages/shared/src/schema/` (Zod schemas plus inferred types). The API serialises through the same schemas and the client imports them with `import type`, so the two never drift.

## Writing data

Every write is a function in `apps/web/src/api/mutations.ts` that calls `apiRequest` with the right method and path: `createAccount`, `updateAccount(id, values)`, `setAccountArchived`, `restoreAccount`, `createPayee`, `updatePayee`, `createTransaction`, `updateTransaction`, `categorizeTransaction`, `deleteTransaction(row)` and `restoreTransaction(row)` (a transfer leg goes to `/transfers/:transferId`, so both legs move together), `createTransfer`, `updateTransfer`, `linkTransfer`, the category and group functions, `updateSettings`, `upsertExchangeRate`, `deleteExchangeRate`, `restoreExchangeRate`, `createRule`, `deleteRule`, `restoreRule`, `applyRules`, `previewImport`, `commitImport`, `upsertBudget`, `deleteBudget`, `copyBudgets`, and the account functions `signIn`, `signUp`, `signOut`, `updateProfile`, `changePassword`, `revokeSession`.

Components call them through `useMutation` (usually `useEntityMutation`, below), show a toast on success or `error.message` on failure, then call `useRefreshFinance()`, which invalidates every key in `FinanceKeys` (`accounts`, `budgets`, `categories`, `deleted`, `exchange-rates`, `payees`, `rules`, `settings`, `summary`, `transactions`). Deleting a transaction shows a toast with an **Undo** button that calls `restoreTransaction`.

Component tests mock the module (`vi.mock('@/api/mutations', () => ({ createRule: vi.fn(…) }))`) and seed the cache with `client.setQueryData(QueryKeys.…, data)`; see [Testing](testing.md).

## Authentication in the client

- **Pages.** `apps/web/src/app/(auth)/sign-in/page.tsx` and `sign-up/page.tsx` render the shell component `AuthForm` (`mode="sign-in"` or `"sign-up"`) inside `AuthScreen`. Sign-up asks for name, email, password and the password again; both forms call `signIn` or `signUp` and then go to the `next` query parameter. `safeNextPath` only accepts local paths (starting with `/` but not `//`), so a crafted link cannot send the user to another site.
- **Route guard.** `apps/web/src/proxy.ts` (Next.js 16's name for middleware) redirects any page request without a `__Host-ck_session` or `ck_session` cookie to `/sign-in?next=…`. It does not check that the session is valid; the API does that on every call, and the API client redirects on `401`.
- **User menu.** The shell component `UserMenu` shows the user's initials (and the name in the sidebar), the name and email, links to Settings and Deleted items, and Sign out, which calls `signOut`, clears the React Query cache and goes to `/sign-in`. It appears in the sidebar and in the mobile header.
- **Settings.** Settings › Profile holds `ProfileForm` (name and email, `PATCH /me`); Settings › Security holds `PasswordForm` (current password, new password twice) and `SessionList` (active sessions, each other than the current one with a Sign out button). See [Account and security](../features/account-and-security.md).
- **Hydration.** `useHydrated()` (`apps/web/src/lib/hydration.ts`, built on `useSyncExternalStore`) returns `false` on the server and during hydration and `true` afterwards. Settings reads the current user through it, because the shell may already have cached `/me` by the time the streamed Settings page hydrates, and rendering that data straight away would not match the server HTML.

## Deleted items

`DeletedItems` (`apps/web/src/components/finance/deleted-items/`, route `/settings/deleted`) lists deleted transactions (transfers included), accounts, rules and exchange rates in four tabs, each row with a Restore button. It is linked from the Settings tab "Deleted items" and from the user menu. See [Deleted items](../features/deleted-items.md).

## Forms

Forms use React Hook Form with `zodResolver` and the schemas in `packages/shared/src/schema/`. Money fields are text inputs (`inputMode="decimal"`) whose value is sent as a string and parsed by the API in the account's currency. Dates are `YYYY-MM-DD` strings picked with the shared calendar popover.

Dialog forms are assembled from shared pieces rather than written field by field:

| Piece                                                      | File                                                                                                | What it gives you                                                                                                                                                        |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `TextField`, `AmountField`, `DateField`                    | `apps/web/src/components/ui/form-fields/`                                                           | A `FormField` wrapper taking `control`, `name`, `label` and `description`; `AmountField` is the decimal text input, `DateField` the calendar popover.                    |
| `DialogFormFooter`, `saveLabel`, `CreateNewTrigger`        | `apps/web/src/components/ui/dialog-form/`                                                           | The Cancel + submit row (spinner while pending; `saveLabel(editing, 'Create')` yields "Save" or the create label) and the "Create new" row pickers use to open a dialog. |
| `useEntityMutation`                                        | `apps/web/src/components/finance/use-entity-mutation.ts`                                            | `useMutation` plus the success toast, invalidation of every `FinanceKeys` query and the caller's follow-up (reset, close, callback).                                     |
| `AccountField`, `PayeeField`, `CategoryField`, `MemoField` | `apps/web/src/components/finance/transaction-dialog/transaction-fields.tsx` (private to the dialog) | The transaction pickers as form fields.                                                                                                                                  |
| `AccountFormFields`, `accountDefaults`, `saveAccount`      | `apps/web/src/components/finance/create-account-dialog/account-fields.tsx` (private to the dialog)  | The account form's type, currency and detail fields and its create/update wiring.                                                                                        |

The transaction dialog (`apps/web/src/components/finance/transaction-dialog/`) has three modes, expense, income and transfer, and works for both creating and editing; editing a transfer leg edits the whole transfer. Its default values come from `standardDefaults` and `transferDefaults`, which merge an existing row or a caller preset with blank values.

## Pickers

- `AccountPicker` and `PayeePicker` (`apps/web/src/components/finance/`) wrap `EntityPicker` (searchable popover with a "Create new" dialog).
- `CategoryPicker` opens a dialog grouped by category group, filtered by kind (income/expense) when the caller knows the direction, with a "Leave uncategorized" option.
- `IconPicker` shows the curated registry as a searchable grid; `ColorPicker` offers a palette plus a custom colour input. Both live in `apps/web/src/components/ui/`; `CategoryPicker` lives in `apps/web/src/components/finance/category-picker/`.

## Styling

- Global tokens in `apps/web/src/styles/tokens.scss` (light and dark) and resets in `apps/web/src/app/globals.scss` (inside `@layer reset`). Stylesheets only use `var(--token)`; Stylelint rejects literal colours elsewhere.
- Colours needed from TypeScript (chart palette, category-group palette, fallbacks) come from `Colors` in `apps/web/src/styles/theme.ts`; Recharts style objects from `ChartStyle`. ESLint rejects literal colours in any other file. See [Code style](code-style.md).
- Everything else is a stylesheet named after its component, holding one BEM block (`budget-card.scss` → `.budget-card`, `.budget-card__actions`). Components write the class names as plain strings and combine them with `cn()` from `apps/web/src/lib/styles.ts`. Layouts are mobile-first with the breakpoint mixins in `apps/web/src/styles/abstracts/`. See [Components and styles](components.md).
- Group colours come from the database and are applied inline (`style={{ background: group.color }}`); no per-category colours exist.
- Icons render through `Icon` (`apps/web/src/components/ui/icon/`), which only knows the names in `packages/shared/src/constants/icon-names.ts` (the lucide component map in `apps/web/src/constants/icons.ts` must cover exactly those names). Unknown names fall back to a question mark. Add icons to the registry, never import the whole lucide package.

## Sample data and the gallery

`/test` renders `ComponentGallery` with sample data from `finance/sample-data.ts` so components can be reviewed without a database. Sample rows follow the real `TransactionRow` shape.

## Adding a screen

1. Create the feature folder `apps/web/src/components/finance/<screen>/` (component, test, `index.ts`), export it from `finance/index.ts` and render it from a page under `apps/web/src/app/(main)/`. Build it from `ui` components; add a stylesheet only for a look no component provides.
2. If it needs a new endpoint, add it to the API first ([API service › Adding an endpoint](api.md#adding-an-endpoint)), then a hook in `use-finance-data.ts` (key in `QueryKeys`, and in `FinanceKeys` if writes should refresh it) and, for writes, a function in `apps/web/src/api/mutations.ts`.
3. Add the route to `apps/web/src/app/(main)/routes.ts` if it belongs in the sidebar.
4. Write the component test `<screen>.test.tsx` with a prefilled `QueryClient` and `vi.mock('@/api/mutations', …)` (see `deleted-items/deleted-items.test.tsx`).
5. Document it under `docs/features/` with screenshot placeholders.
