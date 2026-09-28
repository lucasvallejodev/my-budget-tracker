# Monarch Money

> Summary: Monarch Money, the US and Canada all-in-one planner: Flex budgeting, rollover, account-linked goals, the recurring calendar, Sankey reports and household sharing, and why a one-number Flex budget, rollover sinking funds and goals that earmark account balances are worth borrowing.

## At a glance

|                     |                                                                                                                                                                                                                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type                | Subscription budgeting, net-worth and planning app (successor of choice for many ex-Mint users)                                                                                                                                                                                               |
| Platforms           | Web, iOS, Android (the web app is the most complete; CSV import is web-only)                                                                                                                                                                                                                  |
| Pricing (2026)      | Core: $14.99/month or $99.99/year, 7-day trial with card. Plus (launched 21 April 2026): $299/year for new members per the launch press release; existing members get $100 off the first year (which is where the $199 figure quoted by several review sites comes from). Plus is annual-only |
| Regions / bank sync | US and Canada only (Plaid, MX, Finicity and others; about 13,000 North American institutions). Monarch shows every amount with a `$` and does not distinguish or convert currencies                                                                                                           |
| Data entry          | Mostly sync; manual accounts and manual transactions; CSV import (web, needs at least Date, Payee/Name and Amount columns)                                                                                                                                                                    |
| Best for            | US/Canadian couples and households who want budgeting, goals, investments and net worth in one place                                                                                                                                                                                          |

## What makes it special

Monarch tries to be the "everything" app without forcing a budgeting method on you. The default budget is Flex: you only budget your fixed bills and your non-monthly costs, and everything else is one flexible number. If you want more detail, you switch to per-category or per-group budgets. Around that it adds goals, a recurring calendar, cash-flow reports with a Sankey diagram, net worth and investments. It is the app most often recommended as the Mint replacement, and in April 2026 it said it had 1 million members.

Users like two things most. The first is collaboration: one subscription covers a household, and since October 2025 "Shared Views" lets each account and transaction be marked as one partner's or shared. The second is the polish of the web dashboard and reports. Community round-ups of r/personalfinance and r/ynab rank it as the best all-in-one Mint alternative. The complaints are consistent too: Plaid connections that need re-authentication, especially at credit unions; the $99.99 price compared with free Mint; a mobile app that feels weaker than the web; and a learning curve that Engadget called "steeper than some other budget trackers".

The pace of change is high. December 2025 brought an AI assistant, a goals redesign, equity-compensation tracking, receipt scanning and a weekly recap e-mail. April 2026 added Forecasting and the paid Plus tier. June 2026 rebuilt Goals again, and it left beta on 29 July 2026. August 2026 added a treemap report. The company also moved from monarchmoney.com to monarch.com. For a global user the key limit is that Monarch is explicitly North-American and single-currency, and its support pages say there are no near-term plans to widen currency support.

## Strongest feature

**Flex budgeting: one number for everyday spending.** Monarch reduces a budget to three buckets and one headline number, using this formula from its own blog:

`Flex number = Income − Fixed expenses − Non-monthly expenses − Goal contributions`

Weekly flex is `monthly flex / 4.3`. The flex bucket needs no per-category limits, and its categories are sorted by amount spent, so the biggest leak is always at the top. This matters a lot for our target user: a non-expert wants to know "how much can I still spend this month without hurting my rent, my annual insurance or my vacation fund?" That is a single number, and they get it without learning envelope budgeting. It also works fully offline from bank sync, because it is arithmetic over categorised ledger rows.

## Feature deep dive

### Flex budgeting (fixed / non-monthly / flex)

- **What it does**: groups every expense category into Fixed (rent, insurance, utilities, subscriptions, debt payments, savings), Non-monthly (annual premiums, gifts, car maintenance, taxes) or Flex (groceries, fuel, restaurants, shopping). You set budgets for Fixed and Non-monthly categories and a single amount for Flex.
- **How it works**: Flex is the default budget mode. Fixed and Non-monthly categories keep a user-defined order (changed in Settings › Categories). Flex categories are always sorted by actual spend, largest first. Monarch suggests budget amounts from past spending. Its blog describes progress colours as green below 50%, yellow from 50% to 99% and red at 100% or more. Users can switch to category or group budgeting at any time (group budgeting sets one limit per category group).
- **Why it helps**: it replaces 20 category limits with one limit on discretionary spending, while the predictable costs are planned. **Usefulness: High.**

### Rollover budgets (sinking funds)

- **What it does**: carries a category's leftover or overspent amount into the next month. It is aimed at variable categories (restaurants, groceries) and seasonal ones (clothing, holiday gifts, summer camp, a quarterly water bill).
- **How it works**: you turn it on per category, from the Budget page or from the category settings gear. `Remaining = budget + rolled-over total − actual`. You can set a **Starting balance** so a rollover category begins with more than one month's budget (useful when you already saved part of an annual bill). The help centre's worked example is a quarterly utility bill that builds up for two months and is paid in the third.
- **Why it helps**: it is the simplest possible sinking fund: budget 1/12 of the annual car insurance every month and the category holds the money until the bill arrives. **Usefulness: High.**

### Goals 3.0 (save up and pay down)

- **What it does**: "Save up" goals (emergency fund, down payment, vacation, retirement, education) and "Pay down" goals (every debt account appears automatically).
- **How it works**: each goal has a target amount, a target date and a planned monthly contribution. It shows a status of **On track**, **Ahead** or **At risk**, a projected timeline and a recommended monthly contribution. Retirement and education goals project with compound growth at a configured rate. The accounts that can fund goals are switched on once, globally, not per goal. Money moves with **fund allocations**: allocating into a goal creates a _Contribution_ event and taking money out creates a _Withdrawal_ event. For each allocation you choose whether it counts toward budget actuals and whether it uses today's date or a past date. You can also link Income and Transfer transactions directly to a goal. If an account is 100% allocated to one goal, you cannot allocate from that account manually; other accounts still can. Pay-down goals simulate extra monthly or lump-sum payments with avalanche or snowball ordering. Goals were redesigned in December 2025, rebuilt in June 2026 and left beta on 29 July 2026.
- **Why it helps**: people keep one savings account but several goals. Earmarking parts of a balance ("€2,000 of this account is the vacation") is exactly the mental model. **Usefulness: High.**

### Recurring transactions and calendar

- **What it does**: lists every bill, subscription, paycheck and scheduled transfer as a "recurring stream", shown as a list (filter or group by frequency, category, account or amount) or as a monthly calendar.
- **How it works**: streams are detected from new synced transactions or from a manual scan of history. You can also create one from a single transaction or from scratch, with a start date, frequency (for example monthly or yearly) and status. Detection is merchant-based. The calendar splits items into **Upcoming** and **Complete**. A green check means paid as expected, a yellow check means paid but at a different amount, and a red X means missed: the due date passed with no matching transaction. Monarch sends a push or e-mail notification 3 days before an expected charge. "Bill Sync" also pulls statement balances and due dates from connected billers (US only).
- **Why it helps**: it stops surprise charges and forgotten subscriptions, and shows which days of the month are cash-tight. In a manual/CSV world the "missed" state doubles as a reminder to record or import the payment. **Usefulness: High.**

### Cash-flow reports, Sankey and treemap

- **What it does**: the Reports page covers cash flow, spending and income over any period, with bar, pie, Sankey and (since August 2026) treemap views.
- **How it works**: the Sankey exists only for cash flow. It draws income sources on the left flowing into category groups and savings on the right, for one month or one year. It can be shared, optionally with every amount hidden. Clicking any bar, slice or block filters the page to the transactions behind it. The treemap sizes each category by its amount.
- **Why it helps**: "where does my money go" as one picture. Click-through to the transactions turns a chart into an action. **Usefulness: Medium–High.**

### Households and Shared Views

- **What it does**: invite a partner or other household members by e-mail under one subscription. Shared Views (October 2025) labels accounts and transactions as belonging to one member or as Shared.
- **How it works**: existing accounts default to "Shared". Transactions inherit the owner of their account, can be overridden one by one, and can be assigned by rules. An **Owners** filter works across Accounts/net worth, Reports, Cash Flow and Transactions.
- **Why it helps**: couples can see "mine, yours, ours" without separate apps. **Usefulness: Medium** for our target user (valuable, but a big change to our per-user scoping).

### AI assistant, weekly recap and receipt scanning

- **What it does**: a chat assistant answers questions such as "How much did I spend on groceries last month?". A weekly recap arrives on the dashboard and by e-mail. Receipt photos are matched to transactions and split into line items.
- **How it works**: it combines third-party LLMs with in-house models. Monarch states that user data is not used to train external models. Receipt scanning adds itemised details and splits a generic transaction into categorised lines.
- **Why it helps**: the weekly recap is a low-effort habit loop. The chat is a convenience. **Usefulness: Medium** (the recap), **Low** (the chat, for us).

### Forecasting (Plus tier)

- **What it does**: models "what-if" scenarios (retirement, career breaks, moves, big purchases) and projects net worth. Side-by-side scenario comparison arrived in July 2026 and early-retirement forecasting in August 2026.
- **How it works**: it is available only in Plus. The public documentation gives no detailed mechanics (unverified beyond the release notes).
- **Why it helps**: it serves long-term planners more than people who are just gaining control. **Usefulness: Low–Medium.**

### Manual accounts and CSV import

- **What it does**: tracks accounts Monarch cannot sync and imports history.
- **How it works**: CSV import works on the web only, needs Date, Payee/Name and Amount columns, maps columns by keyword, and optionally reads Category, Tags and Notes. Balances can be imported too. Foreign-currency accounts still display as `$` with no conversion.
- **Why it helps**: it is the only route for our target user, and it is weak here. **Usefulness: Low** as a model, since CoinKeeper already does this better.

## Fit for CoinKeeper

| Feature                                                | Usefulness for our user | Model changes?                                          | API / services                                                               | UI changes                                                                  | Effort (S/M/L) | Priority (Now/Next/Later/Skip) |
| ------------------------------------------------------ | ----------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------- | ------------------------------ |
| Flex budget (fixed / non-monthly / flex + one number)  | High                    | Yes: `budget_bucket` on categories, flex budget rows    | Budget service computes bucket totals and the flex number per currency       | Budget page gets a Flex mode with three sections and a headline number      | M              | Now                            |
| Category rollover + starting balance (sinking funds)   | High                    | Yes: rollover flags on categories                       | Rollover computed in SQL across months                                       | Rollover badge and "available" column on the budget page                    | M              | Now                            |
| Save-up goals funded by allocations                    | High                    | Yes: `goals`, `goal_allocations`                        | Goals service, progress and status projection                                | New Goals screen, goal card on the dashboard, "allocate" dialog on accounts | M              | Now                            |
| Pay-down (debt) goals with snowball/avalanche          | Medium                  | Reuses `goals` (kind `pay_down`) and liability accounts | Payoff simulator (pure function in shared)                                   | Debt tab on Goals                                                           | M              | Later                          |
| Recurring streams + calendar (paid / changed / missed) | High                    | Yes: `recurring_series`, `transactions.recurring_id`    | Occurrence generator + matcher                                               | Recurring page with list and calendar                                       | L              | Next                           |
| Sankey cash-flow report                                | Medium                  | No                                                      | Report endpoint: income by category → expense groups + savings, per currency | New report on Analytics                                                     | S–M            | Next                           |
| Click-through from charts to transactions              | Medium                  | No                                                      | Existing transaction filters                                                 | Charts link to a filtered transaction list                                  | S              | Now                            |
| Weekly recap                                           | Medium                  | Maybe (a notification preference)                       | Scheduled job + e-mail provider                                              | Recap card on the dashboard                                                 | M              | Later                          |
| Shared views / household                               | Medium                  | Yes, large (households, members, owners)                | Authorisation model change                                                   | Owner filter everywhere                                                     | L              | Later                          |
| AI assistant, receipt scanning                         | Low                     | No / attachments                                        | LLM or OCR provider                                                          | Chat panel                                                                  | L              | Skip (for now)                 |
| Forecasting scenarios                                  | Low–Medium              | Yes                                                     | Projection engine                                                            | New planner screens                                                         | L              | Later                          |

### Flex budget with fixed, non-monthly and flex buckets

- **What is it for, and how useful could it be?** It gives a non-expert a single answer to "how much can I still spend?" while bills and irregular costs are planned. Our current budgets are per-category limits with On track / Near limit / Exceeded statuses. Flex keeps those for Fixed and Non-monthly but collapses the long tail into one limit, which is far easier to keep. High value, and it works fine with manual entry.
- **Should we modify the models?**
  - `categories.budget_bucket` enum `fixed | non_monthly | flex`, nullable for income categories and defaulting from the taxonomy (for example Rent → fixed, Insurance (annual) → non_monthly, Groceries → flex).
  - `user_settings.budget_mode` enum `category | flex` (default `category` so existing users are unaffected).
  - Flex limit: either `budgets.category_id` becomes nullable with a new `budgets.scope` enum `category | flex` (unique on `user_id, month, currency, scope, category_id`), or a separate `flex_budgets (id, user_id, month date, currency char(3), amount_minor bigint, created_at, deleted_at)`. The separate table is cleaner.
  - Nothing is cached. Spent per bucket is `SUM(amount_minor)` over non-transfer, non-excluded transactions joined to categories, grouped by `currency, budget_bucket`, only for accounts with `counts_in_spending`.
- **Should we improve the UI?** The Budget page gets a mode switch. In Flex mode it shows three sections (Fixed list, Non-monthly list with rollover balances, and a Flex card with one progress bar and categories sorted by spend). The dashboard gets a "Left to spend this month" tile per currency. Category settings get a bucket selector.
- **How to implement**: (1) migration adding the enum, columns and table; (2) default bucket assignment in the default taxonomy seed; (3) extend the budget service with `getFlexSummary(userId, month)` that returns, per currency, income, fixed planned/actual, non-monthly planned/actual, flex limit/actual and `flex_remaining`; (4) contracts in `packages/shared`; (5) Budget page mode switch and Flex card; (6) tests for per-currency separation and transfers never counting. **Risks**: income in several currencies makes "income − fixed − non-monthly" a per-currency calculation, so we never mix currencies (an optional converted view can use manual FX). What counts as "income" for the formula, planned or actual, needs a decision (Simplifi and Lunch Money both let the user choose).

### Category rollover with starting balance (sinking funds)

- **What is it for?** Irregular but predictable costs (annual insurance, gifts, car service) are the main reason budgets "fail". A rollover category that accumulates 1/12 each month is a sinking fund without new concepts. High value.
- **Should we modify the models?** Add `categories.rollover_enabled boolean default false`, `categories.rollover_start_month date null` and `categories.rollover_starting_balance_minor bigint default 0` with `rollover_currency char(3)` (or put the start and starting balance on a small `category_rollovers (category_id, currency, start_month, starting_balance_minor)` table, so that one category can roll over in several currencies). The carried amount is always computed in SQL: `starting_balance + Σ(budget_m − spent_m)` over months from `start_month` to the previous month, per currency. It is never stored.
- **Should we improve the UI?** The budget row shows "Budgeted", "Rolled over", "Spent" and "Available", with a rollover icon. The category editor gets a rollover toggle and a starting balance field. Negative available shows in the Exceeded colour.
- **How to implement**: migration; a window-function query (`generate_series` of months LEFT JOIN budgets and spending); status logic uses `available = budget + rollover − spent`; tests for negative carry and for a mid-history start month. **Risks**: query cost over long histories (bounded by `start_month`); editing old budgets changes today's rollover. That is correct under "ledger as truth" but may surprise users, so show it.

### Save-up goals funded by allocations

- **What is it for?** The target user's goals (vacation, house, car, emergency fund) usually live inside one or two real savings accounts. Monarch's allocation model (earmark part of an account balance, record Contribution and Withdrawal events, show On track / Ahead / At risk) fits a manual world, because it needs no sync, only balances we already compute.
- **Should we modify the models?**
  - `goals (id, user_id, name, icon, colour, kind enum save_up|pay_down, currency char(3), target_amount_minor bigint, target_date date null, planned_monthly_minor bigint null, status enum active|completed|archived, created_at, archived_at, deleted_at)`.
  - `goal_allocations (id, user_id, goal_id, account_id, kind enum contribution|withdrawal, amount_minor bigint > 0, currency char(3), date, transaction_id null, memo, created_at, deleted_at)`. This is a mini-ledger: the goal balance is `Σ contributions − Σ withdrawals`, never stored.
  - Constraints: goal currency = account currency = allocation currency. The service rejects an allocation that would make `Σ allocations for account > account balance` (or warns: "over-allocated"). Soft delete only.
- **Should we improve the UI?** A new Goals screen with cards (progress ring, amount saved / target, status chip, "save €X/month to finish by June"). An "Allocate" dialog on the goal and on the account detail. Account balance splits into "allocated to goals" and "free". A goals widget on the dashboard.
- **How to implement**: (1) tables + migration; (2) shared pure helpers `requiredMonthly(target, saved, today, targetDate)` and `goalStatus(saved, plannedPath)`. On track if saved ≥ the linear plan to date, Ahead if saved ≥ plan + one month, At risk otherwise (thresholds to be decided); (3) routes CRUD + allocate/withdraw; (4) screens; (5) tests. **Open questions**: should a contribution count as "spending" in budgets? (Monarch lets you choose; for us it is not spending, because the money does not leave the ledger.) Should goals be linkable to a rollover category, so that spending the vacation money reduces the goal? That is a later step.

## What not to copy

- **US/Canada-only sync (Plaid, MX, Finicity, Bill Sync)**: region-bound and conflicts with manual + CSV as the base.
- **Single "$" currency with no conversion**: violates our per-currency invariant and misleads anyone with two currencies.
- **Equity compensation (RSU/ISO/NSO) tracking and Schedule C business export**: US-specific tax and payroll concepts.
- **Estate planning upsell (Trust & Will will in Plus)**: US legal product, not budgeting.
- **Morningstar investment analysis**: region- and data-vendor-specific, outside our scope.
- **Card-required 7-day trial and a split Core/Plus paywall around planning**: a pricing pattern that users call a trap. Planning features are core to our target user.
- **Opaque AI categorisation and chat as the primary interface**: hard to verify, needs third-party LLMs with financial data; our text rules plus learned payee defaults are transparent.

## Sources

- [Monarch Help – Using Flex Budgeting](https://help.monarch.com/hc/en-us/articles/32125337244052-Using-Flex-Budgeting)
- [Monarch Help – Creating Your Budget in Monarch](https://help.monarch.com/hc/en-us/articles/360048883631-Creating-Your-Budget-in-Monarch)
- [Monarch Help – Rollover Budgets](https://help.monarch.com/hc/en-us/articles/4411119762196-Rollover-Budgets)
- [Monarch Help – Group Budgeting](https://help.monarch.com/hc/en-us/articles/18345219809940-Group-Budgeting)
- [Monarch Help – Introducing Goals 3.0](https://help.monarch.com/hc/en-us/articles/44373110771860-Introducing-Goals-3-0)
- [Monarch Help – Using Save Up Goals](https://help.monarch.com/hc/en-us/articles/44373182867476-Using-Save-Up-Goals)
- [Monarch Help – Using Pay Down Goals](https://help.monarch.com/hc/en-us/articles/44373293932052-Using-Pay-Down-Goals)
- [Monarch Help – Moving Funds In and Out of Goals](https://help.monarch.com/hc/en-us/articles/46420712538260-Moving-Funds-In-and-Out-of-Goals)
- [Monarch Help – Tracking Recurring Expenses and Bills](https://help.monarch.com/hc/en-us/articles/4890751141908-Tracking-Recurring-Expenses-and-Bills)
- [Monarch Help – Using Reports](https://help.monarch.com/hc/en-us/articles/21846787088916-Using-Reports)
- [Monarch Help – Cash Flow](https://help.monarch.com/hc/en-us/articles/20504904768020-Cash-Flow)
- [Monarch Help – Shared Views in Monarch](https://help.monarch.com/hc/en-us/articles/42228648365076-Shared-Views-in-Monarch)
- [Monarch Help – International Accounts and Currency](https://help.monarch.com/hc/en-us/articles/360048393552-International-Accounts-and-Currency)
- [Monarch Help – Importing Transactions Manually](https://help.monarch.com/hc/en-us/articles/4409682789908-Importing-Transactions-Manually)
- [Monarch Help – AI in Monarch](https://help.monarch.com/hc/en-us/articles/37526856682260-AI-in-Monarch)
- [Monarch Help – Monarch Plus Tier](https://help.monarch.com/hc/en-us/articles/48349699981972-Monarch-Plus-Tier)
- [Monarch blog – Flex budgeting: the one-number budget](https://www.monarch.com/blog/flex-budgeting-simplify-your-spending-with-just-one-number)
- [Monarch blog – Flex vs. category budgeting](https://www.monarch.com/blog/flex-vs-category-budgeting-how-to-choose-whats-right-for-you)
- [Monarch blog – Track recurring expenses](https://www.monarch.com/blog/track-recurring-bills-and-subscriptions)
- [Monarch blog – Winter Release (Dec 2025)](https://www.monarch.com/blog/winter-release)
- [Monarch – What's new (release timeline)](https://www.monarch.com/whats-new)
- [PR Newswire – Monarch launches premium tier, Monarch Plus (21 Apr 2026)](https://www.prnewswire.com/news-releases/monarch-launches-premium-tier-monarch-plus-302748653.html)
- [Yahoo Finance – Monarch Plus launch coverage](https://finance.yahoo.com/markets/articles/monarch-launches-premium-tier-monarch-124800073.html)
- [Planned – Monarch Core vs Plus pricing comparison](https://www.getitplanned.com/compare/monarch)
- [Borderless Budget – Monarch review for expats (currency limits)](https://borderlessbudget.com/blog/monarch-money-review-expats)
- [AI Tool Discovery – Monarch Money Reddit review round-up](https://www.aitooldiscovery.com/guides/monarch-money-reddit)
- [Engadget – The best budgeting apps for 2026](https://www.engadget.com/apps/best-budgeting-apps-120036303.html)
