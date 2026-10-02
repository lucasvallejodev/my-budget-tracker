# Analytics

> Summary: the four Analytics pages (Overview, Spending, Cash flow, Payees & accounts), the filters they share through the address (currency, month, period length and comparison), what each block shows and where its numbers come from.

Analytics answers "where does my money come from and go?" for one currency and one period at a time. It lives under **Plan › Analytics** in the sidebar and has four pages, reached through the underline tabs below the heading:

| Tab               | Address                | Question it answers                                    |
| ----------------- | ---------------------- | ------------------------------------------------------ |
| Overview          | `/analytics`           | How did this period go compared with the last one?     |
| Spending          | `/analytics/spending`  | Which groups and categories take the money, over time? |
| Cash flow         | `/analytics/cash-flow` | How much of my income do I keep, month by month?       |
| Payees & accounts | `/analytics/payees`    | Who do I pay most, and from which account?             |

The tabs are links, so each page has its own address, the browser back button works and a page can be bookmarked or shared with its filters.

## Filters

The filter bar in the page heading applies to all four pages and is kept in the address, so switching tabs keeps it:

| Filter       | Query parameter | Values                                                                                          | Default                                  |
| ------------ | --------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Currency     | `currency`      | a currency of one of your accounts, or your primary currency                                    | the currency last picked in this browser |
| Month        | `month`         | `YYYY-MM`: the last month of the period                                                         | the current month                        |
| Period       | `range`         | `1` (Month), `3`, `6` or `12` months ending at `month`                                          | `1`                                      |
| Compare with | `compare`       | `previous` (the same number of months just before) or `year` (the same months one year earlier) | `previous`                               |

For example, `/analytics/spending?compare=year&month=2026-09&range=3` shows July to September 2026 against July to September 2025. The period and comparison are left out of the address when they have their default value, and an unknown or malformed value falls back to the default. The currency you pick is also remembered in the browser, like on Home and Budgets (see [Multi-currency › Choose a currency](multi-currency.md#choose-a-currency)). Analytics has no converted "≈ All in" view: every figure is in the chosen currency.

## Overview

| Block               | What it shows                                                                                                                                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Figures             | **Income**, **Spending**, **Kept** (income minus spending) and **Savings rate** (kept as a share of income) for the period, each compared with the comparison period; the change is green when it is good (income or kept up, spending down) |
| Income and spending | income and spending per month as bars, over the period or at least the last six months; clicking a month opens the Overview for that single month                                                                                            |
| Biggest changes     | spending per category group in the comparison period and in this period ("120.00 EUR → 180.00 EUR") with the difference, largest change first; "No spending in … to compare with" when the comparison period is empty                        |
| Top groups          | spending by group as labeled bars with the change against the comparison period ("None in August" for a new group; no change shown when the comparison period had no spending), with a link to the Spending page                             |
| Top payees          | the five payees with the most spending, with a link to the Payees & accounts page                                                                                                                                                            |

<!-- screenshot: Analytics Overview in EUR for one month with the four figures, income and spending bars, Biggest changes, Top groups and Top payees (docs/assets/screenshots/analytics-overview.png) -->

## Spending

| Block                       | What it shows                                                                                                                                                                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spending by group over time | stacked bars per month over the period or at least the last six months: the six groups with the most spending in their colour, the rest together as **Other**                                                                                                    |
| Breakdown                   | one row per group: its share of the period's spending, this period, the comparison period, the change and the monthly average over the chart's months; click a group to expand it into its categories; amounts and category names open the matching transactions |

<!-- screenshot: Analytics Spending with the stacked bars and the breakdown table with one group expanded into its categories (docs/assets/screenshots/analytics-spending.png) -->

## Cash flow

| Block                         | What it shows                                                                                                                                                                                                   |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Where each 100 of income went | one split bar for the period: the five groups with the most spending, **Other spending** and **Kept**, each as a share of every 100 of income, with the amount; shows "No income in this period" without income |
| Income, spending and kept     | income and spending per month as bars, with the average kept per month in the caption                                                                                                                           |
| Month by month                | a table, newest month first, with income, spending, kept and savings rate; the months of the selected period are highlighted                                                                                    |

<!-- screenshot: Analytics Cash flow with the "Where each 100 of income went" bar, the monthly bars and the month-by-month table (docs/assets/screenshots/analytics-cash-flow.png) -->

## Payees & accounts

| Block               | What it shows                                                                                                                                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Top payees          | the fifteen payees with the most spending in the period, each with its avatar or logo, the number of transactions, the average per transaction, the total and the share of all payee spending in the period |
| Spending by account | how much of the period's spending went through each account, with the account type icon                                                                                                                     |
| About payee logos   | a note: brand logos are bundled with CoinKeeper, so payee names never leave your server; other payees get their initials on a colour picked from the name                                                   |

<!-- screenshot: Analytics Payees & accounts with the Top payees table, Spending by account and the payee logos note (docs/assets/screenshots/analytics-payees.png) -->

Group, category and payee names open the Transactions page searched by that name for the last month of the period.

## How it works

- Every figure uses the same report predicate as Home: standard, non-excluded, non-deleted transactions of accounts that count in spending, grouped by currency and never converted. See [Home › How the numbers are computed](dashboard.md#how-the-numbers-are-computed).
- Income, spending and kept per month come from `GET /api/v1/reports/cash-flow?month=&months=`; the page asks for enough months to cover both the period and the comparison period and sums them in the browser.
- Groups, categories, payees and accounts come from `GET /api/v1/reports/breakdown` with `by`, `currency`, `month` and `months` (the period length); the stacked chart and the monthly average add `split=month`. See [REST API](../reference/rest-api.md).
- The filters are read and written by `parseAnalyticsFilters` and `analyticsHref` in `apps/web/src/lib/analytics-filters.ts`; the pages render `Analytics` from `apps/web/src/components/finance/analytics/`. See [Frontend › Reading data](../architecture/frontend.md#reading-data).

Related: [Home](dashboard.md), [Accounts](accounts.md) for net worth over time, [Multi-currency](multi-currency.md).
