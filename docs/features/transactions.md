# Transactions

> Summary: recording, editing, deleting (soft, with Undo and restore) and finding expenses and income; what the fields mean; statuses.

A transaction is one movement of money in one account. Expenses are negative, income positive; the form hides the sign behind an Expense/Income choice.

## Step by step

### Record an expense or income

1. Click **New transaction** on the dashboard, the Transactions page or an account page.
2. Leave **Type** on Expense or switch to Income.
3. Pick the **account**. The amount is in that account's currency.
4. Type the **amount** as you would say it: `12.50`, `12,50` or `1.234,56` all work.
5. Optionally pick a **payee**. If the payee has a usual category, it is filled in for you.
6. Optionally pick a **category**. Leaving it empty is allowed; the transaction is flagged for review.
7. Add a memo and adjust the date, then click **Create**.

<!-- screenshot: "New transaction" dialog in Expense mode with account, amount, payee and category filled (docs/assets/screenshots/transactions-new.png) -->

### Edit a transaction

1. On the Transactions page (or an account page) open the row's **⋯** menu and choose **Edit**.
2. Change any field and click **Save**. Reconciled rows keep their amount, date and account locked.

### Delete a transaction

1. Open the row menu and choose **Delete**, then confirm. The dialog reminds you that the row can be restored.
2. The row leaves balances and reports immediately. Deleting one leg of a transfer removes both legs.
3. A toast confirms it with an **Undo** button that brings the row back at once. Later, restore it from **Settings › Deleted items** (see [Deleted items](deleted-items.md)).

<!-- screenshot: "Transaction deleted" toast with the Undo button (docs/assets/screenshots/transactions-delete-undo.png) -->

### Find transactions

The Transactions page shows one month at a time with a month picker; **All months** loads everything (up to 2,000 rows). Filters run on the loaded rows: search (payee, memo, category, account), date range, category, type (income, expense, transfer, opening balance) and status. **Export CSV** downloads the filtered rows (Settings › Data Management exports every transaction, fetching all pages); **Print / PDF** uses the browser's print dialog.

<!-- screenshot: Transactions page with the month picker, filters and a few rows including a transfer and a "Needs review" badge (docs/assets/screenshots/transactions-list.png) -->

## Fields and statuses

| Field    | Meaning                                         |
| -------- | ----------------------------------------------- |
| Account  | where the money moved; sets the currency        |
| Amount   | positive number in the form, signed by the type |
| Payee    | who you paid or who paid you; optional          |
| Category | optional; empty rows go to the review inbox     |
| Memo     | free text                                       |
| Date     | calendar date, no time                          |

| Status badge | Meaning                                                          |
| ------------ | ---------------------------------------------------------------- |
| Needs review | no category, imported, or its category was archived              |
| Pending      | imported from a bank file and not yet confirmed                  |
| Cleared      | normal state for manual entries                                  |
| Reconciled   | matched against a statement; amount, date and account are locked |
| Excluded     | kept in balances but left out of reports                         |

## How it works

- `ledger.createStandard` validates the account, category and payee belong to the user, copies the account currency, writes the row and then updates the payee's default category (see [Categories › payee memory](categories.md#payee-memory)).
- `ledger.updateStandard` refuses to edit transfer legs (they have their own editor) and locks reconciled rows.
- `ledger.remove` sets `deleted_at` on the row (`DELETE /api/v1/transactions/:id`); a transfer leg is refused there with `409`, and the client sends it to `DELETE /api/v1/transfers/:transferId`, which marks both legs. Nothing is removed from the database.
- `ledger.restore` (`POST /api/v1/transactions/:id/restore`) clears `deleted_at` after checking that the account is not deleted and that the same bank row has not been imported again; if the category was archived meanwhile, the row comes back uncategorised and flagged for review.
- The list endpoint (`GET /api/v1/transactions`) joins account, category, group, payee and the counterpart leg of a transfer, returns newest first with a `nextCursor`, and supports `month`, `from`, `to`, `accountId`, `categoryId`, `needsReview`, `kind`, `q`, `deleted`, `limit` (up to 2,000) and `cursor`. See the [REST API reference](../reference/rest-api.md#transactions).
