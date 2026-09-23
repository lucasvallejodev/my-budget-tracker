# YNAB (You Need A Budget) — Data Model & Mechanics Research

_Research date: 2026-09-22. Primary source: the YNAB OpenAPI spec + the YNAB Help Center._

## Summary

- YNAB's unit of isolation is the **budget** ("plan"). One budget = one currency, one set of accounts, categories and payees. There is no cross-budget anything.
- **All money is stored as integer milliunits** (1000 = one currency unit). No floats anywhere.
- Accounts carry a `type` enum plus an `on_budget` flag. On-budget ("Cash"/"Credit") money is assignable; off-budget ("Tracking"/"Loan") money only moves net worth.
- Every account automatically owns a **transfer payee** (`account.transfer_payee_id`). A transfer is **two mirrored transactions** linked by `transfer_transaction_id`, with **no category** when both sides are on-budget.
- Adding a credit card account auto-creates a **Credit Card Payment category** inside a protected, non-renameable group. Spending on the card silently moves money from the spend category into that payment category.
- Paying the card is therefore a **transfer**, not an expense — it never appears in the spending breakdown.
- Categories live in **category groups**; two groups are `internal: true` (Credit Card Payments, Inflow: Ready to Assign) and are not user-editable.
- Nothing is hard-deleted: everything has a `deleted` boolean, and categories additionally have `hidden`. Deleting a category **forces reassignment** of its transactions.
- Imports dedupe on a deterministic `import_id` (`YNAB:<milliunits>:<date>:<occurrence>`) and fuzzy-match against manual entries (same amount, dates within 10 days).
- `category_id` is nullable, but YNAB treats uncategorized as a persistent nag state, not a valid resting state.

---

## Data model

Amounts marked **mu** are `int64` milliunits. Every entity has `deleted: boolean` for delta-sync tombstoning.

### Budget

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `name` | string | |
| `last_modified_on` | datetime | |
| `first_month` / `last_month` | date | bounds of the budget's month range |
| `date_format` | `{ format }` | e.g. `DD/MM/YYYY` |
| `currency_format` | object | see below — **one per budget** |

`currency_format`: `iso_code`, `example_format`, `decimal_digits` (int), `decimal_separator`, `symbol_first` (bool), `group_separator`, `currency_symbol`, `display_symbol` (bool).

### Account

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `name` | string | |
| `type` | enum | see below |
| `on_budget` | bool | whether the balance is part of the plan |
| `closed` | bool | hidden but retained |
| `note` | string? | |
| `balance` | mu | working balance |
| `cleared_balance` | mu | sum of `cleared` + `reconciled` txns |
| `uncleared_balance` | mu | sum of `uncleared` txns |
| `transfer_payee_id` | uuid? | **the payee that means "transfer to this account"** |
| `direct_import_linked` | bool | bank connection active |
| `direct_import_in_error` | bool | connection needs attention |
| `last_reconciled_at` | datetime? | |
| `debt_interest_rates` / `debt_minimum_payments` / `debt_escrow_amounts` | map<date, mu> | loan accounts only |
| `deleted` | bool | |

`type` enum: `checking`, `savings`, `cash`, `creditCard`, `lineOfCredit`, `otherAsset`, `otherLiability`, `mortgage`, `autoLoan`, `studentLoan`, `personalLoan`, `medicalDebt`, `otherDebt`.

The UI groups these into four buckets: **Cash** (checking/savings/cash), **Credit** (creditCard/lineOfCredit) — both on-budget; **Loan** (the six debt types) and **Tracking** (otherAsset/otherLiability) — both off-budget.

### CategoryGroup

`id`, `name`, `hidden` (bool), `internal` (bool — YNAB-managed, not user-editable), `deleted`. The detail variant embeds `categories[]`.

### Category

| Field | Type | Notes |
|---|---|---|
| `id`, `category_group_id`, `category_group_name`, `name` | | |
| `hidden` | bool | soft-hide, preferred over delete |
| `internal` | bool | e.g. Inflow: Ready to Assign |
| `note` | string? | |
| `budgeted` / `activity` / `balance` | mu | **per-month** values; `balance` = available |
| `goal_type` | enum? | `TB`, `TBD`, `MF`, `NEED`, `DEBT`, null |
| `goal_target` | mu? | |
| `goal_target_date`, `goal_creation_month`, `goal_day`, `goal_cadence`, `goal_cadence_frequency` | | target scheduling |
| `goal_percentage_complete`, `goal_months_to_budget`, `goal_under_funded`, `goal_overall_funded`, `goal_overall_left`, `goal_snoozed_at` | | computed progress |

### Payee

`id`, `name`, `transfer_account_id` (uuid? — **non-null means this payee _is_ an account**), `deleted`. There is also `PayeeLocation` (`payee_id`, `latitude`, `longitude`) for geo-payees.

### Transaction

| Field | Type | Notes |
|---|---|---|
| `id`, `account_id`, `account_name` | | |
| `date` | date | ISO-8601, UTC, date-only |
| `amount` | mu | negative = outflow, positive = inflow |
| `payee_id` / `payee_name` | uuid? / string? | |
| `category_id` / `category_name` | uuid? / string? | **nullable** |
| `memo` | string? | |
| `cleared` | enum | `uncleared` \| `cleared` \| `reconciled` |
| `approved` | bool | review gate for imports |
| `flag_color` | enum? | red, orange, yellow, green, blue, purple |
| `flag_name` | string? | user label for the flag |
| `transfer_account_id` | uuid? | the other account, if a transfer |
| `transfer_transaction_id` | uuid? | **the mirrored transaction's id** |
| `matched_transaction_id` | uuid? | the manual txn this import matched |
| `import_id` | string? | dedupe key, see below |
| `import_payee_name` / `import_payee_name_original` | string? | bank-provided description, pre/post rename rules |
| `debt_transaction_type` | enum? | loan-account semantics |
| `subtransactions[]` | SubTransaction[] | splits |

`SubTransaction`: `id`, `transaction_id`, `amount` (mu), `payee_id?`, `category_id?`, `memo?`, `transfer_account_id?`, `transfer_transaction_id?`, `deleted`. Split amounts must sum to the parent `amount`.

### ScheduledTransaction

Same shape minus `cleared`/`approved`/import fields, plus `frequency` (`never`, `daily`, `weekly`, `everyOtherWeek`, `twiceAMonth`, `every4Weeks`, `monthly`, `everyOtherMonth`, `every3Months`, `every4Months`, `twiceAYear`, `yearly`, `everyOtherYear`), `date_first`, `date_next`, and `scheduled_subtransactions[]`.

### Month

`month` (date, always the 1st), `note`, `income` (mu), `budgeted` (mu), `activity` (mu), `to_be_budgeted` (mu — "Ready to Assign"), `age_of_money` (int?), `deleted`, and in the detail variant `categories[]` with that month's `budgeted`/`activity`/`balance`.

### Why milliunits

Currency amounts are integers where 1,000 milliunits = one unit of currency, so $123.93 is `123930`. This avoids binary-float rounding entirely while leaving a spare digit of precision below the cent for interest and pro-rata splits. The API additionally returns `*_formatted` (display string) and `*_currency` (double) convenience fields so clients don't have to reimplement `currency_format`.

---

## Credit cards & transfers mechanics

**Account creation side-effect.** Adding a credit card account auto-creates a matching **Credit Card Payment category**, named after the account, inside the **Credit Card Payments** group. This group is `internal` and non-renameable; the categories inside it can't be created by hand, can't be moved to another group, and can't be deleted — only hidden. Renaming the account renames the category.

**Spending on the card.** You assign money to normal spend categories (Groceries), not to the payment category. When a $70 grocery charge lands on the credit card account, YNAB automatically moves $70 of *available* balance out of Groceries and into that card's Credit Card Payment category. The transaction's `category_id` stays `Groceries` — the movement is a budget-layer effect, not a recategorization. YNAB calls the fully-covered case "Funded Spending". If the category didn't have the money, you get **credit overspending** (a yellow negative available), and the payment category ends up underfunded until you assign to it directly.

**Paying the card.** A payment is a **transfer** from the paying account to the card account: one outflow row in checking, one inflow row in the card register. It is not an expense and carries **no category** (both accounts are on-budget, so money never leaves the plan). Consequently it never appears in Spending Breakdown or Income v Expense. The payment category's `balance` is simply "the maximum you can safely send the card company right now".

**How a transfer is represented.**

- Each account owns an auto-generated transfer payee, referenced by `account.transfer_payee_id`. Its display name is the account name prefixed with the transfer marker (`Transfer : Checking`); YNAB calls these "Payment and Transfer payees" and the only way to rename one is to rename the account.
- Setting a transaction's payee to that payee makes YNAB write **two rows**: one in each account, with equal and opposite `amount`.
- Each row points at the other account via `transfer_account_id`, and at the sibling row via `transfer_transaction_id`. That pair is the invariant your code should rely on.
- Category rules: **no category** when both sides are the same budget class (on-budget ↔ on-budget, or tracking ↔ tracking). **A category is required** when money crosses the boundary (on-budget ↔ tracking/loan), because money is genuinely entering or leaving the plan.
- Approving one side of an imported transfer approves the other side automatically.
- If only one of the two real accounts exists in YNAB, it isn't a transfer at all: outbound becomes spending, inbound becomes income.

---

## Categories & groups

**Structure.** Exactly two levels: `CategoryGroup` → `Category`. Categories cannot nest inside categories. Groups and categories are freely reorderable and renameable, except the internal ones.

**The internal groups.** Two groups are YNAB-managed (`internal: true`):

- **Credit Card Payments** — one category per credit card / line of credit account, created and destroyed with the account.
- **Inflow: Ready to Assign** (shown as "Income: Ready to Assign" on mobile) — the single income category. Every inflow you don't treat as a refund is categorized here, and it feeds `month.to_be_budgeted`. Imported inflows into checking/savings/cash accounts are auto-assigned to it.

Plus a pseudo-group in the UI: **Hidden Categories**, which is a filtered view of everything with `hidden: true` rather than a real group.

**Defaults on a new budget.** YNAB ships a starter set of groups "based on our prioritization strategy" and has changed the exact names across versions. The long-lived set was *Immediate Obligations, True Expenses, Debt Payments, Quality of Life Goals, Just for Fun*; current material describes groups along the lines of **Bills, Needs / Frequent, Wants, Non-Monthly (True Expenses), Goals / Quality of Life**, each pre-filled with categories like Rent/Mortgage, Electric, Internet, Groceries, Transportation, Eating Out, Home Maintenance, Insurance, Vacation. On top of those sit the two internal groups. YNAB also publishes optional **Category Templates** (new home, new baby, variable income, etc.) you can import into an existing plan. Treat the exact default list as a product decision, not a spec.

**Hide vs delete.** YNAB's explicit guidance: once a category has activity, **hide it, don't delete it**. Deleting a category with history forces you to pick a replacement category for its past transactions — "It's not possible to leave transactions uncategorized" via deletion. Deleting a category with no history returns its available balance to Ready to Assign. Deleting a category with past credit card activity perturbs the card's payment category.

---

## Import / uncategorized / approval workflow

**`import_id` dedupe.** Imported transactions carry `import_id` in the form `YNAB:<amount_in_milliunits>:<iso_date>:<occurrence>`, e.g. `YNAB:-294000:2026-09-22:1`. Occurrence is a 1-based counter disambiguating identical amount+date pairs within the same import. `import_id` is unique per account, so re-importing the same file is idempotent. File-based import additionally skips rows with an identical date+amount, and once a transaction has been imported and then deleted, that `import_id` will never import again.

**`approved` flag.** Imported transactions land with `approved: false` and surface in a "N New transactions" queue. Unapproved transactions **still affect the plan** — approval is a review gate, not a posting gate (the exception is pending transactions, which don't count until they clear). Rejecting an unapproved transaction is the same operation as deleting an approved one.

**Matching.** If you entered a transaction manually and the bank version later imports, YNAB auto-matches them when the **amounts are identical and the dates are within 10 days**. Matched transactions are now **auto-approved** with no separate step. On a match YNAB keeps the **bank's amount** (authoritative) but **your payee, memo, date and category**. `matched_transaction_id` links them; matching is strictly one-to-one and can be done or undone manually. Bulk-importing historical data matches nothing by definition and drops straight into the approve-and-categorize queue.

**Uncategorized.** `category_id` is nullable, so uncategorized transactions are representable, but YNAB nags persistently until you fix it. Auto-categorization fills the gap: the first time a payee appears you pick a category; afterwards YNAB reuses the most recent one and re-derives the default when **2 of the 3 most recent** transactions for that payee use something else. Only the three most recent count, and backfilling old transactions never changes the default. Auto-categorization can be disabled per payee (useful for Amazon/Target). File-based import never brings categories in, because bank files don't carry reliable category data.

---

## Currency handling

**One currency per budget, full stop.** `currency_format` is a property of the budget, not of the account or the transaction. There is no exchange rate, no per-account currency, and no multi-currency reporting anywhere in the product or the API.

The official workaround is **one budget per currency**, with every account inside a budget denominated in that budget's currency. To move money across, you create a `Currency Transfer` category in both budgets, record an outflow in the source budget categorized to it, then record a separate inflow in the destination budget categorized to `Inflow: Ready to Assign` at whatever rate and fees actually applied. Nothing links the two sides — the FX gain/loss is absorbed silently by the difference in the two hand-entered amounts. YNAB also advises reconciling often when spending abroad, since the effective rate depends on when the merchant submits the charge.

For travel, the guidance is simpler: enter the estimated home-currency amount, flag it, and fix it once the real converted amount clears.

---

## Reports

**Spending Breakdown** — categories stack-ranked by share of spending for a month or preset range (last 3/6/12 months, YTD, previous year), filterable by category and by account, drill-through to the underlying transactions. Categories whose inflows exceed outflows (refunds, reimbursements) are pulled out into a separate **Positive Inflow Categories** section instead of showing as negative spending. Hidden categories still appear, shown under their original group. **Spending Trends** is the same data over time.

**Income v Expense** — a cash-flow table over income and spending from Cash and Credit accounts. Notably it *does* include on-budget→tracking transfers as expenses, on the reasoning that the money left the plan; you can exclude them by deselecting the categories used for those transfers. Assigning money to a savings *category* is not an expense — only a transfer into a tracking *account* is. Mobile shows a reduced six-month "Income vs. Spending" version with a 5% threshold verdict.

**Net Worth** — purely account-balance driven (the category filter is disabled). It snapshots every account's balance on the last day of each month, splits them into an assets bar and a debts bar, and plots assets−debts as a trend line. **It includes tracking and loan accounts**, which is precisely what Spending and Income v Expense exclude. It's filterable by account/type, so you can view net worth with or without investments, and exportable per month per account.

**The account-type → report matrix**: cash and credit account activity appears in Spending Trends, Spending Breakdown, Income v Expense and Net Worth; loan and tracking account activity appears **only** in Net Worth.

---

## Lessons for our app

**Copy these.**

1. **Integer minor units everywhere.** Milliunits (`bigint`, 1000 = 1 unit) rather than cents — the extra digit is free and buys clean splits and percentages. No floats in the DB; one formatting layer owns symbol/separator/decimals per currency.
2. **The two-row transfer.** Two rows with negated `amount`, each carrying `transfer_account_id` (the other account) and `transfer_transaction_id` (the sibling row). Then **exclude rows with a non-null `transfer_account_id` from the spending breakdown with one WHERE clause** — that is your CC-settlement requirement, and it generalises to checking→savings for free. Constrain the pair so one side can't exist alone.
3. **Transfer payees as derived rows.** Auto-create a payee per account with `transfer_account_id` set and a derived name (`Transfer: <account>`), renamed with the account. Payee autocomplete, CSV mapping and the transaction form then share one code path instead of special-casing transfers.
4. **An `is_system` flag on groups and categories** for the income bucket (and any protected group), rather than matching on names.
5. **Soft delete + hidden, and force reassignment.** When a user deletes a category with transactions, make them pick a replacement; orphaning history is worse than a forced choice. Reserve the uncategorized alert for *new* transactions.
6. **Deterministic import dedupe key**, e.g. `<source>:<amount>:<date>:<occurrence>`, with a unique index on `(account_id, import_id)`. Add the 10-day / exact-amount fuzzy match against manual rows, keeping the **bank's amount** but the **user's** payee/memo/category, linked via `matched_transaction_id`.
7. **`approved` gates review, not posting.** Imported rows count immediately and are just flagged for review.
8. **Payee→category memory with the "2 of the last 3" rule** plus a per-payee opt-out. Cheap, and much better than last-value-wins.
9. **`cleared` as a three-state enum** (`uncleared`/`cleared`/`reconciled`) with derived `balance` / `cleared_balance` / `uncleared_balance` per account.
10. **Encode the account-type → report matrix once.** Decide per type whether it feeds spending, income/expense and net worth, instead of scattering `type != 'credit_card'` checks.

**Avoid these.**

1. **Don't copy single-currency-per-budget** — it's YNAB's biggest structural limitation and exactly what you're solving. Put `currency` on the **account** (immutable once it has transactions), derive transaction currency from it, aggregate per currency and **never sum across currencies**; net-worth-per-currency then falls out for free. Don't store rates on transactions or auto-convert — that needs historical rates and destroys trust in the numbers. For cross-currency movement, allow a transfer pair whose two amounts simply differ; that difference *is* the realised rate plus fees.
2. **Don't copy the credit-card-payment-category machinery.** It's YNAB's biggest source of confusion (credit overspending, underfunded alerts, positive balances, balance transfers). You're building a spending tracker, not zero-based envelopes. Take the half that matters — CC payment = transfer, excluded from spending — and skip the auto-moving of budgeted money.
3. **Don't go deeper than two levels** of category hierarchy. `color` and `sort_order` on the group, `icon` and `sort_order` on the category; rollups stay trivial.
4. **Don't allow a non-null `category_id` on a same-class transfer** — make it a check constraint, or a categorized settlement will double-count.
5. **Version your signup seed.** Keep a declarative seed definition applied in the Clerk webhook inside one DB transaction, and record which version a user got, so defaults can evolve without rewriting existing users' categories.
6. **Don't expose YNAB's 13-value account type enum** — `checking`/`savings`/`credit_card` is enough for now. But do add its two orthogonal booleans, a `counts_in_spending` (on-budget) flag and `closed`; retrofitting those later is painful.
7. **Don't hard-delete anything** a report might need. `deleted_at` on accounts, payees, categories and transactions also sets you up for a delta-sync API later (YNAB's `server_knowledge` pattern).

---

## Sources

- YNAB API OpenAPI spec — https://api.ynab.com/papi/open_api_spec.yaml
- YNAB API overview (milliunits, dates, rate limits, delta requests) — https://api.ynab.com/
- YNAB API endpoints reference — https://api.ynab.com/v1
- Handling Credit Cards in YNAB — https://support.ynab.com/en_us/handling-credit-cards-overview-ry7cNub1s
- Credit Card Payments in YNAB — https://support.ynab.com/en_us/credit-card-payments-a-guide-r1_506Q1j
- Transfer Transactions in YNAB — https://support.ynab.com/en_us/transfer-transactions-a-guide-HJOsZz4Jj
- Account Types (Cash, Credit, Loan, Tracking) — https://support.ynab.com/en_us/account-types-an-overview-BkmGM0qCq
- Adding, Removing, and Customizing Categories — https://support.ynab.com/en_us/adding-removing-and-customizing-categories-a-guide-HJFO5j909
- Categorizing Transactions (auto-categorization, uncategorized) — https://support.ynab.com/en_us/categorizing-transactions-a-guide-HyRl60sks
- Approving and Matching Transactions — https://support.ynab.com/en_us/approving-and-matching-transactions-a-guide-ByYNZaQ1i
- File-Based Import — https://support.ynab.com/en_us/file-based-import-a-guide-Bkj4Sszyo
- Using Multiple Currencies in YNAB — https://support.ynab.com/en_us/using-multiple-currencies-in-ynab-a-guide-SyBF6PHno
- Spending Breakdown — https://support.ynab.com/en_us/spending-breakdown-H1H7YxmD0
- Income vs. Spending and Income v Expense — https://support.ynab.com/en_us/income-v-expense-Byu1BYWRq
- Reflect on Net Worth — https://support.ynab.com/en_us/net-worth-BkwQO5WA5
- How to Add, Edit, and Delete Payees (Payment and Transfer payees) — https://support.ynab.com/en_us/how-to-add-edit-and-delete-payees-rkxMu4Skj
- Creating a New Plan — https://support.ynab.com/en_us/creating-a-new-plan-Hyl4uc5Cq
- YNAB Category Templates — https://support.ynab.com/en_us/category-templates-HknjS_RA
- YNAB Glossary — https://support.ynab.com/en_us/ynab-glossary-a-guide-BJd80SORq
