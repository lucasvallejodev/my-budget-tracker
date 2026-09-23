# Transactions

> Summary: recording, editing, deleting and finding expenses and income; what the fields mean; statuses.

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

1. Open the row menu and choose **Delete**, then confirm.
2. The row is soft-deleted; balances and reports update immediately. Deleting one leg of a transfer removes both legs.

### Find transactions

The Transactions page shows one month at a time with a month picker; **All months** loads everything (up to 2,000 rows). Filters run on the loaded rows: search (payee, memo, category, account), date range, category, type (income, expense, transfer, opening balance) and status. **Export CSV** downloads the filtered rows; **Print / PDF** uses the browser's print dialog.

<!-- screenshot: Transactions page with the month picker, filters and a few rows including a transfer and a "Needs review" badge (docs/assets/screenshots/transactions-list.png) -->

## Fields and statuses

| Field | Meaning |
| --- | --- |
| Account | where the money moved; sets the currency |
| Amount | positive number in the form, signed by the type |
| Payee | who you paid or who paid you; optional |
| Category | optional; empty rows go to the review inbox |
| Memo | free text |
| Date | calendar date, no time |

| Status badge | Meaning |
| --- | --- |
| Needs review | no category, imported, or its category was archived |
| Pending | imported from a bank file and not yet confirmed |
| Cleared | normal state for manual entries |
| Reconciled | matched against a statement; amount, date and account are locked |
| Excluded | kept in balances but left out of reports |

## How it works

- `ledger.createStandard` validates the account, category and payee belong to the user, copies the account currency, writes the row and then updates the payee's default category (see [Categories › payee memory](categories.md#payee-memory)).
- `ledger.updateStandard` refuses to edit transfer legs (they have their own editor) and locks reconciled rows.
- `ledger.remove` soft-deletes the row, or both rows when it belongs to a transfer.
- The list endpoint (`/api/transactions`) joins account, category, group, payee and the counterpart leg of a transfer, and supports `month`, `from`, `to`, `accountId`, `categoryId`, `needsReview`, `q`, `limit` and `offset`.
