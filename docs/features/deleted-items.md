# Deleted items

> Summary: what deleting does (nothing financial is erased), the Undo toast after deleting a transaction, the Deleted items screen and its Restore buttons, what can be restored and the rules that apply, and the endpoints behind it.

Deleting in CoinKeeper hides a record instead of erasing it. A deleted transaction, transfer, account, rule, budget or exchange rate disappears from every list, balance, report, budget and conversion straight away, but stays in the database and can be brought back. Categories, category groups and payees are not deleted at all: they are archived (see [Categories](categories.md)).

## Step by step

### Undo a deletion right away

1. Delete a transaction or a transfer from its **⋯** menu and confirm. The dialog tells you it can be restored.
2. A toast confirms the deletion with an **Undo** button. Click it to bring the row (both legs, for a transfer) back.

<!-- screenshot: "Transaction deleted" toast with its Undo button and the note about Settings › Deleted items (docs/assets/screenshots/deleted-undo-toast.png) -->

### Restore something later

1. Open **Deleted items**: from the account menu (your initials), from the **Deleted items** tab in **Settings**, or at `/settings/deleted`.
2. Pick a tab: **Transactions** (transfers included), **Accounts**, **Rules** or **Exchange rates**. Each row shows what it was and when it was deleted.
3. Click **Restore**. The row returns to its lists, balances and reports, and a toast confirms it. If it cannot come back, the toast says why.

<!-- screenshot: Deleted items screen on the Transactions tab with two deleted rows and their Restore buttons (docs/assets/screenshots/deleted-items.png) -->

### Budgets

Deleted budgets have no tab. Set a limit again for the same category, month and currency on the [Budgets](budgets.md) page and the deleted budget comes back with the new amount.

## What can be deleted and restored

| Record        | Delete from                               | Restore from                                                         | Notes                                                    |
| ------------- | ----------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------- |
| Transaction   | its **⋯** menu                            | Undo toast, Deleted items › Transactions                             |                                                          |
| Transfer      | either leg's **⋯** menu                   | Undo toast, Deleted items › Transactions                             | both legs are deleted and restored together              |
| Account       | the API only (the app offers **Archive**) | Deleted items › Accounts                                             | only an account without live transactions can be deleted |
| Rule          | the bin icon on the rules page            | Deleted items › Rules                                                | a deleted rule no longer categorises anything            |
| Exchange rate | the bin icon in Settings › Currencies     | Deleted items › Exchange rates, or save the same pair and date again | deleted rates are ignored by conversions                 |
| Budget        | **Delete** on the budget                  | set the same limit again                                             |                                                          |

## Rules when restoring

- **The account must be live.** A transaction or transfer whose account (either account, for a transfer) is deleted cannot be restored; restore the account first.
- **An archived category is not brought back.** If the transaction's category was archived after the deletion, the transaction comes back uncategorised and waits in the [review inbox](review-inbox.md).
- **A re-imported bank row wins.** If you deleted an imported row and then imported the same bank file again, the new copy is the live one; the deleted copy can no longer be restored.
- **Budgets and exchange rates revive by key.** Saving a budget for the same category, month and currency, or a rate for the same pair and date, restores the deleted row with the new value.

## How it works

- Every one of these tables has a `deleted_at` column. `DELETE` sets it, `POST …/restore` clears it after re-checking the rules above, and every query filters `deleted_at IS NULL`. Nothing is removed from the database; only sessions are deleted for real.
- Endpoints (all under `/api/v1`): `DELETE /transactions/:id` and `POST /transactions/:id/restore`; `DELETE /transfers/:transferId` and `POST /transfers/:transferId/restore`; `DELETE /accounts/:id` and `POST /accounts/:id/restore`; `DELETE /rules/:id` and `POST /rules/:id/restore`; `DELETE /budgets/:id`, `POST /budgets/:id/restore` and `PUT /budgets/:month/:categoryId/:currency`; `DELETE /exchange-rates/:base/:quote/:date`, `POST …/restore` and `PUT` on the same path. Lists take `deleted=true` to show deleted rows (`GET /transactions?deleted=true`, `/accounts?deleted=true`, `/rules?deleted=true`, `/exchange-rates?deleted=true`, `/budgets?month=…&deleted=true`). See the [REST API reference](../reference/rest-api.md).
- A restore that breaks a rule answers `409` with a message, which the app shows in the toast.
- In the web app, `DeletedItems` (`apps/web/src/components/finance/deleted-items/`) reads the lists through `useDeletedTransactions`, `useDeletedAccounts`, `useDeletedRules` and `useDeletedExchangeRates`, and restores through the `restore…` functions in `apps/web/src/api/mutations.ts`. The Undo button in the toast calls `restoreTransaction` (`apps/web/src/components/finance/transaction-actions/`).
- Service details: [Domain services › Soft deletes](../architecture/server.md#soft-deletes) and [API service › Soft deletes](../architecture/api.md#soft-deletes).
