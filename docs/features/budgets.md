# Budgets

> Summary: monthly spending limits per category and currency, compared with what the ledger recorded; the Budgets page (currency switch, summary card, category rows, spending without a budget); status that follows the pace of the month; limits suggested from recent months; deleting a limit and bringing it back.

## What a budget is

A limit for one category, one month and one currency. Spending against it is whatever the [spending reports](dashboard.md) attribute to that category in that currency for that month: standard transactions, net of refunds, excluding transfers and excluded rows.

## Step by step

1. Open **Budgets** in the sidebar. The page header holds the currency switch, the month picker, **Copy last month** and **Add budget**.
2. Pick the currency with the switch. Budgets are per currency, so the page shows one currency at a time; the switch lists your primary currency and the currency of every account, and it is hidden when you use only one. The choice is remembered in this browser and shared with Home (see [Multi-currency › Choose a currency](multi-currency.md#choose-a-currency)).
3. Click **Add budget**, pick an expense category (type part of its name in the category field; see [Categories › Pick a category](categories.md#pick-a-category)), the currency and the monthly limit, then save. When you spent in that category during the last three months, the dialog shows the monthly average ("You spent about 112.00 EUR a month over the last 3 months") and **Use 112.00 EUR** fills the limit with it.
4. Read the summary card at the top (see [The summary card](#the-summary-card)), then the category budgets under it (see [Category budgets](#category-budgets)).
5. Open the row menu of a budget: **Edit budget** changes the limit; **Delete budget** removes the limit for that month only (transactions are untouched; setting a limit for the same category, month and currency again brings the deleted budget back); **View transactions** opens the Transactions page filtered by the category name and the budget's month. The category name links there too.
6. At the start of a month click **Copy last month** to carry every limit over. Categories that already have a limit for the month are left as they are.

<!-- screenshot: Budgets page for the current month in EUR with the summary card, the Today marker, the status breakdown, rows grouped by status with one budget spending too fast and one over, and the Spending without a budget panel (docs/assets/screenshots/budgets-month.png) -->

<!-- screenshot: Add budget dialog showing the average of the last three months and the Use button (docs/assets/screenshots/budgets-suggestion.png) -->

## The summary card

The card adds up every budget of the chosen currency and month:

- **Left to spend in September** (the month shown): what is left of all limits, "of" the total budgeted, and a status tag with the most important news first: **Over budget** when the totals are over, **2 over budget** (in amber) when the totals are fine but some budgets are over, **Within budget** for a finished month, then **Spending too fast** or **On pace** from the totals' pace.
- One bar for the month, colored by that status. In the current month a marker labeled "Today · 18 of 30 days" shows where spending would be at an even pace.
- Four figures:

| Figure                       | Value                          | Line under it                                                                                 |
| ---------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------- |
| **Budgeted**                 | the sum of the limits          | the number of categories                                                                      |
| **Spent**                    | the sum spent                  | the share of the budget spent                                                                 |
| **Left**                     | what is left, never below zero | the daily allowance ("7.69 EUR a day for 13 days"), "Month closed", or how much you went over |
| **By 30 Sep** (the last day) | the month-end projection (≈)   | "about X under budget" or "about X over budget"; shown in the current month only              |

- **Status**: a segmented bar and the number of budgets in each state, with one sentence explaining that status follows the pace of the month, so 90% used near the end of the month is fine.

## Category budgets

Each budget is a compact row: the category icon, its name and group, a bar colored by status with the pace marker in the current month (outside the **By status** order, a **Spending too fast** or **Over budget** badge under the name says the status in words too), "spent of limit · %", then "12.00 EUR left" or "12.00 EUR over" (in red) and, in the current month, the daily allowance ("7.69 EUR a day", or "Nothing left this month").

A segmented control orders the rows:

- **By status** (default): sections **Over budget**, **Spending too fast** and **On track**, each with a count; empty sections are hidden.
- **By group**: one section per category group, groups and categories in alphabetical order.
- **A–Z**: one list of all budgets by category name.

## Budget status

Status follows the pace of the month, not a fixed percentage. A budget has one of three states:

| Status                | When                                                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Over budget**       | spending is above the limit                                                                                                                     |
| **Spending too fast** | the limit is not passed yet, but today's daily rate carried to the end of the month passes it; only in the current month and from day 5 onwards |
| **On track**          | every other case, including past months that stayed within the limit                                                                            |

Spending exactly the limit is still **On track**. Past months show no pace marker, projection or daily allowance.

## Spending without a budget

Next to the category budgets, a panel lists the expense categories with spending this month in the chosen currency and no budget, largest first. Its description gives their total and share of the month's spending ("84.00 EUR · 12% of September spending"). The panel is hidden when every category with spending has a budget.

- Each row has **Add** with an amount ("Add 112.00 €"), which opens the budget dialog pre-filled with that category, the currency and the amount: the three-month suggestion when there is one, otherwise this month's spending.
- Uncategorized spending shows **Review** instead, which opens the [Review inbox](review-inbox.md).
- The first six rows are shown; **Show N more** reveals the rest.

## How it works

- Table `budgets` with a unique key on category, month and currency; the service is `apps/api/src/modules/budgets/service.ts`.
- Deleting (`DELETE /api/v1/budgets/:id`) sets `deleted_at`. `PUT /api/v1/budgets/:month/:categoryId/:currency` upserts by that key and revives a deleted row; `POST /api/v1/budgets/:id/restore` restores one without changing the limit. Budgets have no tab in [Deleted items](deleted-items.md).
- `budgets.list` joins the category and group, then reads the month's spending for every currency present in one grouped query (`reports.categorySpending`, with the same `spendingWhere` predicate as the reports), keyed by currency and category. A [split transaction](transactions.md#split-a-transaction-between-categories) counts each line in its own category. Nothing is summed across currencies, so a JPY limit is compared with JPY spending and a KWD limit with KWD spending, each in its own minor units.
- `copyFromPreviousMonth` copies last month's live rows into the target month, skipping archived categories and limits that already exist.
- Pace is calculated in the browser with the user's local date, by `budgetPace` in `packages/shared/src/lib/budget-pace.ts`: the expected amount is the limit spread evenly over the days elapsed (today included, rounded down), the projection extends today's daily rate to the end of the month, and the daily allowance divides what is left by the days left (today included, rounded down). **Spending too fast** needs at least five days of data (`MIN_DAYS_FOR_PROJECTION`) so the first days of a month do not raise alarms.
- The state comes from `budgetFigures(budget, today)` in `apps/web/src/components/finance/budget-status.ts`, which returns the pace, what is left and the state. `BudgetStates` holds the label, badge tone, bar tone and fill color of each state, and `BudgetStateOrder` their order; the summary card, the rows, Home and its attention strip all read them from there.
- **Spending without a budget** reads `GET /api/v1/reports/breakdown?by=category&month=&currency=` (`useCategoryBreakdown`) and drops the categories that have a budget in that currency; the **Add** amount comes from the same suggestions as the dialog.
- The month comes from `calendarPeriod` in `packages/shared/src/lib/periods.ts`. Budget periods that follow payday will replace it there ([Pay-cycle periods](../research/feature-opportunities.md#pay-cycle-periods)).
- Suggestions come from `GET /api/v1/budgets/suggestions?month=`: `budgets.suggestions` asks `reports.categorySpendingBetween` for each expense category's spending in the three months before, divides by the months that had spending in that category, and rounds up to whole units (`roundUpToWholeUnits` in `packages/shared/src/lib/money.ts`). Archived categories are skipped.
