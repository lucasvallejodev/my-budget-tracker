# Budgets

> Summary: monthly spending limits per category and currency, compared with what the ledger recorded; spending pace, the month-end projection and the daily allowance; limits suggested from recent months; deleting a limit and bringing it back.

## What a budget is

A limit for one category, one month and one currency. Spending against it is whatever the [spending reports](dashboard.md) attribute to that category in that currency for that month: standard transactions, net of refunds, excluding transfers and excluded rows.

## Step by step

1. Open **Budgets** in the sidebar and choose the month with the month picker.
2. Click **Add budget**, pick an expense category, the currency and the monthly limit, then save. When you spent in that category during the last three months, the dialog shows the monthly average ("You spent about 112.00 EUR a month over the last 3 months") and **Use 112.00 EUR** fills the limit with it.
3. The page shows, per currency: total budget, spent so far, remaining, the percentage used and, for the current month, **Left per day** (what is left of all limits divided by the days left); then each category with a progress bar and a status, plus an insights panel.
4. In the current month each bar has a thin marker where spending would be at an even pace today, and a line under it such as "60.00 EUR ahead of plan · 7.69 EUR a day for 13 days". The status is **Exceeded** once the limit is passed, **Spending too fast** when the current rate would pass the limit by the end of the month, **Near limit** from 80%, otherwise **On track**. Past months show no pace.
5. **Edit** changes the limit; **Delete** removes the limit for that month only (transactions are untouched; setting a limit for the same category, month and currency again brings the deleted budget back); **View transactions** jumps to the Transactions page filtered by the category name and the budget's month.
6. At the start of a month click **Copy last month** to carry every limit over. Categories that already have a limit for the month are left as they are.

<!-- screenshot: budgets page for the current month with the Left per day metric, pace markers and one budget spending too fast (docs/assets/screenshots/budgets-month.png) -->

<!-- screenshot: Add budget dialog showing the average of the last three months and the Use button (docs/assets/screenshots/budgets-suggestion.png) -->

## How it works

- Table `budgets` with a unique key on category, month and currency; the service is `apps/api/src/modules/budgets/service.ts`.
- Deleting (`DELETE /api/v1/budgets/:id`) sets `deleted_at`. `PUT /api/v1/budgets/:month/:categoryId/:currency` upserts by that key and revives a deleted row; `POST /api/v1/budgets/:id/restore` restores one without changing the limit. Budgets have no tab in [Deleted items](deleted-items.md).
- `budgets.list` joins the category and group, then reads the month's spending for every currency present in one grouped query (`reports.categorySpending`, with the same `spendingWhere` predicate as the reports), keyed by currency and category. Nothing is summed across currencies, so a JPY limit is compared with JPY spending and a KWD limit with KWD spending, each in its own minor units.
- `copyFromPreviousMonth` copies last month's live rows into the target month, skipping archived categories and limits that already exist.
- Pace is calculated in the browser with the user's local date, by `budgetPace` in `packages/shared/src/lib/budget-pace.ts`: the expected amount is the limit spread evenly over the days elapsed (today included, rounded down), the projection extends today's daily rate to the end of the month, and the daily allowance divides what is left by the days left (today included, rounded down). **Spending too fast** needs at least five days of data (`MIN_DAYS_FOR_PROJECTION`) so the first days of a month do not raise alarms.
- The month comes from `calendarPeriod` in `packages/shared/src/lib/periods.ts`. Budget periods that follow payday will replace it there ([Pay-cycle periods](../research/feature-opportunities.md#pay-cycle-periods)).
- Suggestions come from `GET /api/v1/budgets/suggestions?month=`: `budgets.suggestions` asks `reports.categorySpendingBetween` for each expense category's spending in the three months before, divides by the months that had spending in that category, and rounds up to whole units (`roundUpToWholeUnits` in `packages/shared/src/lib/money.ts`). Archived categories are skipped.
