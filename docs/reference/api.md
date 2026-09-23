# API and server actions

> Summary: every read endpoint and every server action, their inputs and what they return.

All endpoints and actions require a Clerk session and operate on the signed-in user's data. Amounts are `amountMinor` integers with a `currency`; dates are `YYYY-MM-DD`; months are `YYYY-MM`.

## Read endpoints (`src/app/api/**`)

| Method and path | Query parameters | Returns |
| --- | --- | --- |
| `GET /api/accounts` | `includeArchived=1` | `AccountSummary[]` with `balanceMinor` and `transactionCount` |
| `GET /api/transactions` | `month`, `from`, `to`, `accountId`, `categoryId`, `needsReview=1`, `q`, `limit` (≤2000, default 500), `offset` | `TransactionRow[]` newest first |
| `GET /api/categories` | `includeArchived=1` | `CategoryTree[]` (groups with categories and transaction counts) |
| `GET /api/payees` | | `{ id, name, defaultCategoryId }[]` |
| `GET /api/currencies` | | active `currencies` rows |
| `GET /api/settings` | | the user's `user_settings` row |
| `GET /api/exchange-rates` | | the user's rates, newest first |
| `GET /api/rules` | | rules with their category name |
| `GET /api/budgets` | `month` | `BudgetRow[]` with `spentMinor` |
| `GET /api/reports/summary` | `month` | `{ month, totals, breakdown, netWorth, cashFlow, needsReviewCount, accounts, converted }` |

Errors are `{ error: string }` with the service's status (400 validation, 404 not found, 500 unexpected).

## Server actions (`src/app/(main)/actions.ts`)

Actions validate with Zod, call a service and revalidate the app. They throw `Error(message)` on failure.

### Accounts

| Action | Input |
| --- | --- |
| `createAccountAction(form)` | `name, type, currency, institution?, accountNumber?, notes?, openingBalance? (decimal string), countsInSpending?` |
| `updateAccountAction(form)` | `id` plus any of the above except `openingBalance` |
| `archiveAccountAction(id, archived = true)` | |

### Payees

| Action | Input |
| --- | --- |
| `createPayeeAction(form)` | `name, defaultCategoryId?` |
| `updatePayeeAction(form)` | `id, name?, defaultCategoryId?` |

### Transactions and transfers

| Action | Input |
| --- | --- |
| `createTransactionAction(form)` | `direction (expense/income), accountId, amount (decimal string), date, categoryId?, payeeId?, memo?, status?, excluded?` |
| `updateTransactionAction(id, form)` | same form |
| `categorizeTransactionAction(id, categoryId or null)` | sets the category and clears `needs_review` |
| `deleteTransactionAction(id)` | soft-deletes the row, or both legs of a transfer |
| `setTransactionStatusAction(id, status)` | `pending`, `cleared` or `reconciled` |
| `createTransferAction(form)` | `fromAccountId, toAccountId, amountFrom, amountTo? (required across currencies), date, memo?, status?` |
| `updateTransferAction(transferId, form)` | same form |
| `linkTransferAction(outId, inId)` | pairs two existing standard rows |
| `transferSuggestionsAction()` | lists candidate pairs |

### Categories

| Action | Input |
| --- | --- |
| `createCategoryGroupAction(form)` | `name, kind, color` |
| `updateCategoryGroupAction(id, form)` | partial |
| `archiveCategoryGroupAction(id)` | group must have no live categories |
| `reorderCategoryGroupsAction(orderedIds)` | |
| `createCategoryAction(form)` | `groupId, name, icon` |
| `updateCategoryAction(id, form)` | partial |
| `reorderCategoriesAction(groupId, orderedIds)` | |
| `archiveCategoryAction(id, moveToId?)` | move transactions or flag them for review |
| `restoreCategoryAction(id)` | |

### Settings and rates

| Action | Input |
| --- | --- |
| `updateSettingsAction({ primaryCurrency?, locale?, showConvertedTotals? })` | |
| `upsertExchangeRateAction({ base, quote, date, rate })` | `rate` as a decimal string |
| `deleteExchangeRateAction({ base, quote, date })` | |

### Rules and import

| Action | Input |
| --- | --- |
| `createRuleAction({ name?, pattern, categoryId })` | |
| `deleteRuleAction(id)` | |
| `applyRulesAction()` | returns `{ updated }` |
| `previewImportAction({ accountId, csv, mapping })` | `mapping: { date, amount?, debit?, credit?, payee?, memo?, externalId?, dateFormat?, invertSign? }`; returns a `Preview` |
| `commitImportAction(preview)` | returns `{ inserted, matched, insertedIds, suggestions }` |

### Budgets

| Action | Input |
| --- | --- |
| `upsertBudgetAction({ categoryId, month, currency, amount })` | `amount` as a decimal string |
| `deleteBudgetAction(id)` | |
| `copyBudgetsAction(month)` | returns `{ copied }` |

## Shapes

`TransactionRow` (from `src/server/ledger/service.ts`): `id, accountId, accountName, accountCurrency, categoryId, categoryName, categoryIcon, groupId, groupName, groupColor, groupKind, payeeId, payeeName, amountMinor, currency, date, kind, transferId, counterpartAccountId, counterpartAccountName, status, needsReview, excluded, memo, importId, originalPayee`.

`AccountSummary` (from `src/server/accounts/service.ts`): account columns plus `balanceMinor`, `transactionCount`, `archivedAt`.

`CategoryTree`: group columns plus `categories[]` with `transactionCount`.
