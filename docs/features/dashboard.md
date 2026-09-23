# Dashboard and analytics

> Summary: what the dashboard shows, how each number is computed, and what the analytics page adds.

## Dashboard

For the selected month (month picker in the header) and for each currency you use:

| Block | What it shows | Source |
| --- | --- | --- |
| Income · Spending · Savings rate | totals for the month | `reports.monthlyTotals` |
| Cash flow chart | income and spending for the last 8 months | `reports.cashFlow` |
| Recent transactions | the six latest rows across all accounts | `/api/transactions?limit=6` |
| Net worth card | assets, amounts owed and net per currency, with the number of accounts | `reports.netWorth` |
| Spending by group | donut coloured with group colours, plus an "Uncategorized" slice | `reports.breakdownByGroup` |
| Review notice | count of rows needing a category, linking to the inbox | `ledger.needsReviewCount` |
| Converted totals (optional) | approximate totals in the primary currency with the rates used | `reports.convertedTotals` |

<!-- screenshot: full dashboard for one currency with all blocks visible (docs/assets/screenshots/dashboard-full.png) -->

## Analytics

The Analytics page reuses the same data with the cash-flow chart, net worth and breakdown, without the recent-transactions panel. It is the place to compare months with the month picker.

## How the numbers are computed

All report queries share one predicate (`spendingWhere` in `src/server/reports/service.ts`):

```sql
t.deleted_at IS NULL AND t.kind = 'standard' AND NOT t.excluded AND a.counts_in_spending
```

- **Income** is the sum of rows in income groups, plus positive uncategorised rows.
- **Spending** is the negated sum of rows in expense groups, plus negative uncategorised rows. Refunds (positive rows in an expense category) reduce the category and the total.
- **Net worth** sums every live row of every non-archived account, so transfers and opening balances count; assets and liabilities are reported separately and netted.
- Everything is grouped by currency; nothing is converted unless the converted-totals panel is on.
