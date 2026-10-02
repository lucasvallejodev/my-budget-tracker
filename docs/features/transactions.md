# Transactions

> Summary: recording (also from a template), splitting between categories, editing, duplicating, saving as a template, deleting (soft, with Undo and restore) and finding expenses and income; the category autocomplete; remembered accounts; how the list reads (day groups, payee avatars, transfers, inline category); links that open the page filtered; what the fields mean; statuses.

A transaction is one movement of money in one account. Expenses are negative, income positive; the form hides the sign behind an Expense/Income choice.

## Step by step

### Record an expense or income

1. Click **New transaction** in the header (on every page), or **Add transaction** on an account page to start with that account selected.
2. Leave **Type** on Expense or switch to Income.
3. Pick the **account**. The amount is in that account's currency. The dialog starts on the account you used last in this browser (and, for transfers, the last pair of accounts), unless that account has been archived or deleted.
4. Type the **amount** as you would say it: `12.50`, `12,50` or `1.234,56` all work.
5. Optionally pick a **payee**. If the payee has a usual category, it is filled in for you.
6. Optionally pick a **category**: click the field and type part of the category or group name (see [Categories › Pick a category](categories.md#pick-a-category)). Leaving it empty is allowed; the transaction is flagged for review.
7. Add a memo and adjust the date, then click **Create**.

<!-- screenshot: "New transaction" dialog in Expense mode with account, amount, payee and category filled (docs/assets/screenshots/transactions-new.png) -->

### Record from a template

The chips at the top of **New transaction** show your four most recently used [templates](templates.md), and **All templates** lists the rest with a search. Click one to fill the form with its type, account, amount, payee, category and memo, then click **Create**. **Save as template** in the form, or in a row's **⋯** menu, keeps the current values as a new template.

### Split a transaction between categories

One receipt can cover several categories, such as a supermarket bill with food and household items. Split it so each part counts in its own category:

1. In the transaction form, turn on **Split between categories**. Two lines appear: the first carries the amount and category you had entered, the second is empty.
2. Pick a category and type an amount on each line. **Add line** adds more (up to 20); the bin removes a line (a split keeps at least two).
3. The status under the lines says how much is **left to assign**, or that **everything is assigned**. The lines must add up to the amount exactly; otherwise saving fails with "The split lines must add up to the transaction amount".
4. Click **Create** or **Save**.

In the list, a split row shows **Split into 2** (hover it to see the categories) instead of one category. Each line counts in its own category on Budgets, Analytics and Home, and filtering the list by a category also finds splits with a line in that category. The amount of a split can only change together with its lines: edit both in the form.

To undo a split, turn the switch off and save; the transaction keeps its amount and waits for a category on the Review page unless you pick one. Choosing a single category for a split row (for example on the Review page) also replaces the split with that category.

<!-- screenshot: transaction form with Split between categories on, three lines and "Everything is assigned" (docs/assets/screenshots/transactions-split.png) -->

### Edit a transaction

1. On the Transactions page (or an account page) open the row's **⋯** menu and choose **Edit**.
2. Change any field and click **Save**. Reconciled rows keep their amount, date and account locked.

### Duplicate a transaction

1. Open the row's **⋯** menu and choose **Duplicate** (not offered for opening balances).
2. A **New transaction** dialog opens with the same type, account, amount, payee, category and memo (or, for a transfer, the same accounts and amounts), dated today and cleared.
3. Change what differs and click **Create**. The original row is untouched.

### Delete a transaction

1. Open the row menu and choose **Delete**, then confirm. The dialog reminds you that the row can be restored.
2. The row leaves balances and reports immediately. Deleting one leg of a transfer removes both legs.
3. A toast confirms it with an **Undo** button that brings the row back at once. Later, restore it from **Settings › Deleted items** (see [Deleted items](deleted-items.md)).

<!-- screenshot: "Transaction deleted" toast with the Undo button (docs/assets/screenshots/transactions-delete-undo.png) -->

### Read the list

The Transactions page and each account page show the same list:

- Rows are grouped by day, newest first. Each day heading shows the date (the year only for past years) and the day's total per currency, without transfers and opening balances.
- Each row starts with an avatar: the brand logo for about 55 well-known payees (Spotify, Netflix, Uber Eats, Lidl and others); otherwise the icon or emoji you chose for the payee, in its colour; otherwise the payee's two initials, on the payee's colour or on a tint picked from the name. The logos ship with the app; nothing is fetched from a logo service. Choose a payee's look in the payee dialog (see [Categories › Payee look](categories.md#payee-look)).
- The category shows as its icon in the group color and its name. A row without a category shows a dashed **Choose category** chip: click it to categorize the row in place with the category autocomplete.
- A transfer shows as one grey row **From → To**, marked "Not counted as spending", when both legs are in the list. When only one leg is listed (for example on an account page, or with a filter), the row reads "Transfer to …" or "Transfer from …".
- Amounts are in the text color with a minus sign for money out; income is green with a plus sign.
- The only tags are **Pending**, **Needs review** (on a categorized row that is still flagged), **Reconciled** and **Excluded**. Ordinary cleared rows carry no tag.
- On a phone each row stacks: avatar, payee and amount on the first line, the category below; below the desktop width the account name starts the second line, since there is no Account column. An uncategorized row offers a **Categorize** chip.

<!-- screenshot: Transactions list with two day groups and their totals, brand and initials avatars, a "Choose category" chip, a transfer row "Checking → Savings" and the summary line (docs/assets/screenshots/transactions-list.png) -->

### Find transactions

The Transactions page shows one month at a time with a month picker; **All months** loads everything (up to 2,000 rows). Filters run on the loaded rows: search (payee, memo, category, category group, account), date range, account (not on an account's own page), category, type (income, expense, transfer, opening balance) and status. Below the desktop width only the search box shows; **Filters** opens the rest and shows how many are in use ("Filters (2)"). A line above the list sums up the filtered rows: how many there are, what was spent and what was paid in, per currency. The list shows 50 rows per page. **Export CSV** downloads the filtered rows; choose **All months** first to export beyond one month. Amounts are written as plain numbers (`-12.50`), and any text cell that a spreadsheet would run as a formula (starting with `=`, `+`, `-`, `@`) is prefixed with `'` so it opens as text; **Print / PDF** uses the browser's print dialog.

The search box in the header (`Ctrl+K`) opens this page with `?q=` set to what you typed. Links from other screens open the page already filtered: `?q=` fills the search box and `?month=YYYY-MM` picks the month (budget rows, the spending groups on Home, and the group, category and payee names on Analytics use them). Without `month`, a link with a search shows every month.

## Fields and statuses

| Field    | Meaning                                         |
| -------- | ----------------------------------------------- |
| Account  | where the money moved; sets the currency        |
| Amount   | positive number in the form, signed by the type |
| Payee    | who you paid or who paid you; optional          |
| Category | optional; empty rows go to Review               |
| Memo     | free text                                       |
| Date     | calendar date, no time                          |

| Status       | Meaning                                                          | Tag in the list                         |
| ------------ | ---------------------------------------------------------------- | --------------------------------------- |
| Needs review | no category, imported, or its category was archived              | **Needs review** when it has a category |
| Pending      | imported from a bank file and not yet confirmed                  | **Pending**                             |
| Cleared      | normal state for manual entries                                  | none                                    |
| Reconciled   | matched against a statement; amount, date and account are locked | **Reconciled**                          |
| Excluded     | kept in balances but left out of reports                         | **Excluded**                            |

A flagged row without a category shows the **Choose category** chip instead of a tag.

## How it works

- `ledger.createStandard` validates the account, category and payee belong to the user, copies the account currency, writes the row and then updates the payee's default category (see [Categories › payee memory](categories.md#payee-memory)).
- `ledger.updateStandard` refuses to edit transfer legs (they have their own editor) and locks reconciled rows.
- Split lines live in `transaction_splits` (`transaction_id`, `category_id?`, signed `amount_minor`, `memo`, `sort_order`, `deleted_at`); the parent keeps account, date, payee, currency and the full amount, with `category_id = NULL`. `apps/api/src/modules/ledger/splits.ts` checks the rules (at least two and at most 20 lines, every line non-zero with the parent's sign, the lines add up to the parent, categories active and owned) and replaces lines by soft-deleting the old ones. `POST` and `PATCH /api/v1/transactions` take `splits: [{ categoryId, amount, memo? }]` with positive amounts in the account currency; `PATCH` with `splits: []` removes the split, a `PATCH` that changes only the amount of a split row answers `422`, and a `PATCH` with a `categoryId` collapses the split into that category. Linking a split row as a transfer leg drops its lines.
- Every report reads category lines instead of whole transactions: `categoryLines` in `apps/api/src/modules/reports/predicate.ts` yields one row per split line (or the transaction itself when it has no lines), so budgets, breakdowns, rankings, monthly totals and cash flow count each line in its category. Balances still read `transactions` directly.
- `ledger.remove` sets `deleted_at` on the row (`DELETE /api/v1/transactions/:id`); a transfer leg is refused there with `409`, and the client sends it to `DELETE /api/v1/transfers/:transferId`, which marks both legs. Nothing is removed from the database.
- `ledger.restore` (`POST /api/v1/transactions/:id/restore`) clears `deleted_at` after checking that the account is not deleted and that the same bank row has not been imported again; if the category was archived meanwhile, the row comes back uncategorised and flagged for review.
- The list endpoint (`GET /api/v1/transactions`) joins account, category, group, payee and the counterpart leg of a transfer, returns newest first with a `nextCursor`, and supports `month`, `from`, `to`, `accountId`, `categoryId`, `needsReview`, `kind`, `q`, `deleted`, `limit` (up to 2,000) and `cursor`; each row carries its `splits`, and `categoryId` and `q` also match split lines. See the [REST API reference](../reference/rest-api.md#transactions).
- The list is `TransactionExplorer` (filters, summary line, 50-row pages) around `TransactionTable` in `apps/web/src/components/finance/`. `collapseTransfers` in `transaction-table/transaction-groups.ts` folds the two legs of a listed transfer into one row, and `groupByDay` builds the day groups and their per-currency totals; `dayLabel` in `transaction-labels.ts` formats the heading. Choosing a category inline calls `categorizeTransaction` (`PATCH /api/v1/transactions/:id`).
- Avatars come from `PayeeAvatar` (`finance/payee-avatar/`), which uses the helpers in `apps/web/src/lib/payee-avatar.ts` and the bundled brand list in `apps/web/src/constants/brands.ts`; see [Components and styles › Brand logos](../architecture/components.md#brand-logos).
