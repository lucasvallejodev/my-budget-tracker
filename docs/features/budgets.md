# Budgets

> Summary: monthly spending limits per category and currency, compared with what the ledger recorded.

## What a budget is

A limit for one category, one month and one currency. Spending against it is whatever the [spending reports](dashboard.md) attribute to that category in that currency for that month: standard transactions, net of refunds, excluding transfers and excluded rows.

## Step by step

1. Open **Budgets** in the sidebar and choose the month with the month picker.
2. Click **Add budget**, pick an expense category, the currency and the monthly limit, then save.
3. The page shows, per currency: total budget, spent so far, remaining and the percentage used; then each category with a progress bar and a status (On track, Near limit at 80%, Exceeded), plus an insights panel.
4. **Edit** changes the limit; **Delete** removes the limit for that month only; **View transactions** jumps to the Transactions page filtered by the category name.
5. At the start of a month click **Copy last month** to carry every limit over. Categories that already have a limit for the month are left as they are.

<!-- screenshot: budgets page for one month with three category budgets, one near limit and one exceeded (docs/assets/screenshots/budgets-month.png) -->

## How it works

- Table `budgets` with a unique key on category, month and currency; the service is `src/server/budgets/service.ts`.
- `budgets.list` joins the category and group, then asks `reports.breakdownByCategory` for the month's spending in each currency present.
- `copyFromPreviousMonth` inserts last month's rows for the target month with `ON CONFLICT DO NOTHING`.
