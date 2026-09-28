# Quicken Simplifi

> Summary: Quicken Simplifi, the US and Canada top-down budgeting app: the Spending Plan, projected balances, recurring reminders, watchlists, goals and the refund tracker, and why an available-to-spend figure with a daily allowance, projected balances and watchlists are worth borrowing for CoinKeeper.

## At a glance

|                     |                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Type                | Subscription budgeting and cash-flow app (the "light" sibling of Quicken Classic)                                                                                                                                                                                                                                                                                                          |
| Platforms           | Web app, iOS, Android                                                                                                                                                                                                                                                                                                                                                                      |
| Pricing (2026)      | Single plan, billed annually, no free tier and no monthly billing. The official page lists $3.99/month billed annually ($47.88/year) as a first-year offer for new members ordering direct by 24 October 2026, and $6.99/month ($83.88/year) as the regular rate. Several reviews still quote the older $5.99 list price. Renewal is at the then-current rate. 30-day money-back guarantee |
| Regions / bank sync | US and Canada only ("not designed to function outside the U.S. and Canada"), 14,000+ institutions. Supports USD **or** CAD, one currency at a time; mixing US and Canadian accounts causes balance discrepancies                                                                                                                                                                           |
| Data entry          | Sync-first; manual transactions supported; manually entered transactions cannot be linked to refunds                                                                                                                                                                                                                                                                                       |
| Best for            | Budget-averse US/Canadian users who want a "safe to spend" number and bill forecasting at a low price                                                                                                                                                                                                                                                                                      |

## What makes it special

Simplifi reverses the usual budget. Traditional budgeting is "bottom-up": dozens of category limits set in advance. Quicken's own blog calls Simplifi's Spending Plan "top-down": start from predictable income, subtract what is already committed (bills, subscriptions, savings) and what you plan for variable needs (groceries, fuel), and whatever is left is yours to spend. The result is one live number, updated as transactions arrive, with a per-day average. Reviewers repeatedly name this projected "left to spend" view as the app's best feature.

The second pillar is **forward-looking cash flow**. Simplifi builds "recurring series" of income and bills, turns each expected instance into a _Reminder_, and uses the reminders to draw projected balances for each account weeks ahead. Around that sit small, practical tools other apps lack: **watchlists** (track any category, payee or tag against an optional monthly target), a **refund tracker** (log money you are owed and get notified if it does not arrive), and savings goals that earmark money inside real accounts.

Users like the low price, the clean interface and the accurate detection of recurring income and bills (Engadget praises exactly this, plus the refund tracker). The complaints: it is "too loose for strict zero-based budgeters", investment tracking is basic, promotional pricing rises at renewal, some banks (Capital One, credit unions) sync badly, and sharing is limited to one other person. For a global audience the hard limit is that it is US/Canada and single-currency. No major product change in 2025–2026 could be verified beyond pricing updates.

## Strongest feature

**The Spending Plan and its "Left this month" number.** The complete formula, from Quicken's help centre and blog:

`Available to spend = Income − Bills & subscriptions − Planned spending − Savings goals (− recurring transfers)`

Then, during the month, _Other spend_ (anything not planned) is subtracted in real time, and **Left this month** is shown with a **per-day average** (left ÷ remaining days). Bills count when they are _expected_, not when they are paid, so the number is honest from day 1.

For our target user this is the most useful single idea in the category: it answers "can I afford this today?" without asking them to become a budgeting expert, and it works with manual entry once income and bills are defined. It is also a natural home for the goals and recurring features CoinKeeper lacks today.

## Feature deep dive

### Spending Plan (income, bills, planned spending, goals, other spend)

- **What it does**: a monthly plan with six parts: **Income**, **Bills** (bills and subscriptions), **Planned spend**, **Goals**, **Other spend** and **Left this month**.
- **How it works**:
  - _Income_ is the total expected income for the month from recurring income series. Non-recurring income is excluded by default but can be included, and a custom income amount can be set.
  - _Bills_ is the total of all recurring bill and subscription reminders. Credit card payments and transfers are excluded by default, because the card's purchases are the real expenses.
  - _Planned spend_ covers variable necessities (groceries, fuel, pet care) or one-off planned purchases. Each item has a name, a target amount, one or more categories and an optional rollover.
  - _Goals_ adds the monthly contributions of savings goals that are included in the plan.
  - _Other spend_ is the real-time total of unplanned spending, shown as coloured category bubbles you can click through to the transactions.
  - _Left this month_ shows what remains, with a per-day average, updated in real time.
  - Setup is guided: Simplifi finds recurring income and bills and you confirm each one.
  - Transactions can be excluded from the Spending Plan and/or from Reports individually (they show greyed out with an icon) or with "Exclude" rules (for example by payee or amount).
- **Why it helps**: one trustworthy number instead of 20 limits, with commitments subtracted up front. **Usefulness: High.**

### Planned spend: release, auto-release and rollover

- **What it does**: controls what happens to planned money you did not use.
- **How it works**: **Release** (the three-dot menu, "Release Available for spending") returns an item's unused amount to _Left this month_. **Auto-release**, when switched on, releases all unused planned amounts on the **last day of each month**, except items with rollover. **Rollover** is available _only_ for Planned Spend series. It carries under- or over-spending into the next month for that item, and the carried amount can be edited to $0 or to any positive or negative value. Rollover items always use their _target_ amount in the plan totals, so rollover never changes _Available_. An item with rollover cannot be released. For future costs, Quicken recommends savings goals rather than rollover, because goals "calculate exactly" the monthly amount.
- **Why it helps**: stops "phantom" money sitting in half-used categories and gives users an explicit choice: free it up or save it. **Usefulness: High.**

### 12-month plan projection

- **What it does**: plans up to 12 months ahead.
- **How it works**: future months use recurring reminders plus a projection of _Other spend_, based on the historical average of up to 12 months back, a custom amount, or none. An optional buffer can be added.
- **Why it helps**: shows whether next months (for example December with gifts) will be tight. **Usefulness: Medium.**

### Bills & Income: recurring series and reminders

- **What it does**: a section listing every scheduled bill and income _reminder_ in a date range, with a net summary, upcoming items, **past-due** items and a monthly calendar with tooltips.
- **How it works**: a _recurring series_ generates _reminders_ (instances). Reminders are matched to downloaded transactions. Unmatched reminders whose date has passed show under Past due. The "All series" tab manages every series and computes yearly totals by counting the payments that actually fall in the year (not simply amount × 12).
- **Why it helps**: users see what is coming and what is late. **Usefulness: High.**

### Projected cash flow (projected balances)

- **What it does**: a line chart of each account's future balance.
- **How it works**: the projection uses recurring **income reminders (green dots)**, **bill and subscription reminders (blue dots)**, **expected refunds (grey dots)** and **future-dated transactions**. It explicitly **excludes Planned spend items and Savings goals**. Linked credit card payments appear on both the paying and the receiving account. Each banking account has a collapsible chart, and the Bills & Income › Cash Flow tab combines all or selected accounts, one coloured line each, over a customisable period. Hovering a dot shows that day's reminders and projected balance. Clicking jumps to the date. Reminders can be edited from the chart.
- **Why it helps**: prevents overdrafts and shows "will I have enough on the 28th before payday?". **Usefulness: High** (works with manual entry once recurrings exist).

### Watchlists

- **What it does**: tracks any slice of spending (a set of categories, specific payees or tags) with an optional monthly target, and notifies you when you get close to or reach it.
- **How it works**: an optional start and end date; views for this month, year-to-date and 12-month history; a month-by-month bar chart with a line for the target, and each bar clicks through to transactions. The documented calculations:
  - **Monthly average** = up to 12 months of data, ignoring a month whose transactions start after the 5th (a partial first month);
  - **This month** = actual transactions + scheduled reminders for the rest of the month;
  - **Projected** = (spent ÷ elapsed days) × remaining days + spent so far.
  - Notification thresholds are not documented.
- **Why it helps**: "I want to spend less on takeaway" or "how much does my car cost me?" without building a full budget. **Usefulness: High** for behaviour change.

### Refund tracker

- **What it does**: records money you are owed (returns, reimbursements) as expected refunds.
- **How it works**: fields are payee, amount, expected date and destination account, plus optional category, notes and attachments. States: **Expected** (editable, deletable) then **Completed** (after linking; locked). Simplifi auto-links downloaded transactions to expected refunds, or you can link manually with "Match refund". Manually entered transactions cannot be linked. Linking updates the transaction's payee and category, and unlinking reverts them. You are notified if the refund does not arrive by the expected date. Expected refunds appear in projected cash flow.
- **Why it helps**: people forget returns and reimbursements, and this is real money recovered. **Usefulness: Medium.**

### Savings goals (earmarking inside accounts)

- **What it does**: saves toward a named goal (vacation, home) from checking or savings accounts.
- **How it works**: fields are name, goal amount, amount already saved, an optional target date and a goal type. Funding accounts must be banking accounts (not credit, loan or investment). Simplifi computes the monthly contribution from the target date, or the finish date from a chosen contribution. Contributions are tracked monthly and can only be changed in the current month. Contributed money is **subtracted from the account's available balance** (the help example: a $5,410 balance with $500 contributed shows $4,910 available). There are two kinds of withdrawal: **"Spend a custom amount"** (spending the goal as intended; saved and remaining totals are not affected) and **"Withdraw for something else"** (money returns to available and "saved so far" drops). A goal can be included in the Spending Plan, using its monthly contribution, and extra contributions are counted too. Completed goals should be kept (not deleted) so that history stays correct.
- **Why it helps**: shows "real" spendable money after setting aside savings. **Usefulness: High.**

### Reports

- **What it does**: Spending, Income, Income & Expense, and Net Worth reports.
- **How it works**: Spending and Income can be broken down by category, tag, account or payee, with Summary or Transactions views and date filters. Net Worth uses selectable intervals. Transfers and credit card payments are always excluded from reports.
- **Why it helps**: standard but solid. **Usefulness: Medium.**

## Fit for CoinKeeper

| Feature                                                   | Usefulness for our user | Model changes?                                                    | API / services                                 | UI changes                                                     | Effort (S/M/L) | Priority (Now/Next/Later/Skip) |
| --------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------- | -------------- | ------------------------------ |
| Spending Plan / "left this month" + per-day allowance     | High                    | Yes: planned-spend items; needs recurring series for bills/income | `GET /plan/:month` per currency                | New Plan screen or Budget mode; dashboard "Left to spend" tile | M–L            | Next                           |
| Planned spend release / auto-release / rollover           | High                    | Yes: `release_mode`, rollover fields                              | Plan service                                   | Item menu: Release, rollover toggle                            | M              | Next                           |
| Recurring series + reminders (upcoming / past due / paid) | High                    | Yes: `recurring_series`, `transactions.recurring_id`              | Occurrence generator + matcher                 | Bills & income page with calendar                              | L              | Next                           |
| Projected balance chart per account                       | High                    | No beyond recurring series                                        | Projection endpoint                            | Chart on account detail + combined chart                       | M              | Next                           |
| Watchlists (category/payee/tag + target + projection)     | High                    | Yes: `watchlists`, `watchlist_filters`                            | Watchlist query                                | Watchlist cards on dashboard; watchlist page                   | S–M            | Now                            |
| Refund tracker (expected → completed)                     | Medium                  | Yes: `expected_refunds`                                           | Match on import and on manual entry            | Refunds list; badge on matched transaction                     | S–M            | Later                          |
| Goals that reduce "available" balance                     | High                    | Goals + allocations (see Monarch doc)                             | Account balance response adds `allocatedMinor` | Account shows "available" vs "set aside"                       | M              | Now (with goals)               |
| 12-month plan projection with average + buffer            | Medium                  | No                                                                | Projection query                               | Plan month switcher                                            | M              | Later                          |
| Exclude from plan vs exclude from reports (two flags)     | Medium                  | Split `excluded` into two booleans                                | Report and budget filters                      | Transaction menu                                               | S              | Later                          |

### Spending Plan with "Left this month"

- **What is it for?** It gives our user a live, honest "safe to spend" figure and a per-day allowance, which is the most actionable number in personal finance. It complements our category budgets (planned spend items _are_ category budgets) and gives goals and bills a place in the maths. High value.
- **Should we modify the models?**
  - Reuse `budgets` as _planned spend_ (category, month, currency, amount_minor). Add `budgets.rollover_enabled boolean` (or per-category rollover as proposed in the Monarch doc) and `budgets.released_minor bigint default 0` (an explicit "release" event; better as rows in `budget_releases (id, user_id, budget_id, amount_minor, released_at, deleted_at)` so that it stays ledger-like and undoable).
  - `user_settings.plan_income_mode` enum `expected | actual | larger` (Lunch Money's idea) and `user_settings.auto_release boolean`.
  - Bills and income come from `recurring_series` (see the Lunch Money doc for the schema): the month's expected occurrences, `kind = expense` for bills and `kind = income` for income.
  - The formula, per currency and computed on request: `available = income − Σ bills_expected − Σ planned(budget_minor − released) − Σ goal_monthly − other_spend_actual`, where other spend is the actual spending in categories with no budget and not linked to a recurring item. Transfers are never included.
- **Should we improve the UI?** A new **Plan** screen (or a mode of the Budget page) with a header showing "Left this month: €412 · €27/day for 15 days", and five collapsible sections (Income, Bills, Planned, Goals, Other spend), each with expected and actual. A dashboard tile repeats the headline per currency.
- **How to implement**: (1) this depends on recurring series and goals, so ship those first or start with manual "expected income" and "bills" amounts; (2) shared pure `computePlan()` with tests (per-currency, rounding, day counts); (3) `GET /api/v1/plan?month=` returning the sections; (4) the screen. **Risks**: multi-currency households get several plans (one per currency) and must not be summed; offer the optional converted total via manual FX, clearly labelled. Deciding what "expected income" is without sync (manual recurring income vs last month's actual) needs user testing.

### Projected balance chart

- **What is it for?** Showing future balances per account so users avoid running dry before payday. It needs no bank sync, only expected recurring items and future-dated transactions. High value for people living paycheck to paycheck.
- **Should we modify the models?** None beyond `recurring_series`. Future-dated transactions already live in the ledger. Projection = today's computed balance + Σ expected occurrences (not yet matched) + Σ future-dated transactions, per day, per account (account currency). Expected refunds can join later.
- **Should we improve the UI?** A collapsible line chart on the account detail page, with dots coloured by type: income, bill and refund. The colours come from `theme.ts` tokens and the shape or label also differs, since colour cannot be the only signal. A combined view lets the user pick several accounts **of the same currency** (or grouped by currency). Add a low-balance marker when the projection goes below 0 (or below a user threshold).
- **How to implement**: (1) shared `expandOccurrences(series, from, to)`; (2) `GET /accounts/:id/projection?days=60`; (3) Recharts line + scatter; (4) tests for month-end dates (the 31st in February) and paused or ended series. **Risks**: projections are only as good as the recurring list. Show a "based on N recurring items" note and a link to add missing ones.

### Watchlists

- **What is it for?** The cheapest behaviour-change tool: pick something to spend less on (takeaway, one shop, a "car" tag) and follow it month by month with a projection. It works entirely on ledger data. High value, small effort.
- **Should we modify the models?**
  - `watchlists (id, user_id, name, currency char(3), target_minor bigint null, starts_on date null, ends_on date null, created_at, deleted_at)`.
  - `watchlist_filters (id, watchlist_id, kind enum category|category_group|payee|tag, ref_id uuid)`. Tag filters need tags first (see the Lunch Money doc).
  - Everything else is computed: monthly totals (12 months), this month = actual + expected recurring for the rest of the month, projected = `spent / elapsed_days × days_in_month`, and monthly average over completed months (skipping a partial first month, like Simplifi's "after the 5th" rule).
- **Should we improve the UI?** Watchlist cards on the dashboard (sparkline, this month vs target, projected). A detail page with a 12-month bar chart and a target line, where each bar clicks through to filtered transactions. A "Watch this" action on a category, payee or transaction.
- **How to implement**: migration, CRUD routes, one aggregate query with `date_trunc('month')` grouped by currency, shared projection helper (reuse Copilot's pace helper), UI. Notifications can wait until CoinKeeper has a notification system. **Open question**: a watchlist mixing currencies must be per currency, which is enforced by the `currency` column.

## What not to copy

- **US/Canada-only aggregation, and USD _or_ CAD only**: conflicts with a global, multi-currency product.
- **Refund auto-matching that works only for downloaded transactions**: in our world most rows are manual or CSV, so matching must work on every row.
- **Promotional first-year price that rises at renewal, annual-only billing**: users consider it a trap.
- **Quicken Business & Personal (Schedule C-style business reports)**: US tax specific.
- **Retirement planner tied to US account types**: region-specific.
- **Plan maths that silently ignore non-recurring income by default**: confusing for irregular earners. We should make the income mode explicit.

## Sources

- [Simplifi Help – Understanding Your Spending Plan](https://support.simplifi.quicken.com/en/articles/4212702-understanding-your-spending-plan)
- [Simplifi Help – How to Set Up the Spending Plan](https://support.simplifi.quicken.com/en/articles/14893966-how-to-set-up-the-spending-plan)
- [Simplifi Help – Using the Spending Plan on the Mobile App](https://support.simplifi.quicken.com/en/articles/3620741-using-the-spending-plan-on-the-mobile-app)
- [Simplifi Help – Using Rollover in the Planned Spend Section](https://support.simplifi.quicken.com/en/articles/9029030-using-rollover-in-the-planned-spend-section-of-your-spending-plan)
- [Simplifi Help – Planned Expenses Versus Recurring Expenses](https://support.simplifi.quicken.com/en/articles/5142441-planned-spending-expenses-versus-recurring-expenses)
- [Simplifi Help – Using Projected Cash Flow](https://support.simplifi.quicken.com/en/articles/3357429-using-projected-cash-flow)
- [Simplifi Help – Using the Bills & Income Section](https://support.simplifi.quicken.com/en/articles/4109588-using-the-bills-income-section)
- [Simplifi Help – Using Watchlists](https://support.simplifi.quicken.com/en/articles/3472367-using-watchlists)
- [Simplifi Help – Tracking Refunds](https://support.simplifi.quicken.com/en/articles/4606217-tracking-refunds)
- [Simplifi Help – Using Quicken Simplifi's Savings Goals](https://support.simplifi.quicken.com/en/articles/3676756-using-quicken-simplifi-s-savings-goals)
- [Simplifi Help – Exclude and Include Transactions from Reports and the Spending Plan](https://support.simplifi.quicken.com/en/articles/3569626-how-to-exclude-and-include-transactions-from-reports-and-the-spending-plan)
- [Simplifi Help – Using Reports on the Web App](https://support.simplifi.quicken.com/en/articles/4592676-using-reports-in-quicken-simplifi)
- [Simplifi Help – What Currencies Does Quicken Simplifi Support?](https://support.simplifi.quicken.com/en/articles/3828353-what-currencies-does-quicken-simplifi-support)
- [Quicken – Simplifi product page (pricing, regions, platforms)](https://www.quicken.com/products/simplifi)
- [Quicken – Can I purchase Quicken outside the U.S. or Canada?](https://www.quicken.com/support/quicken-us-and-canada-products)
- [Quicken blog – Simplifi Spending Plan vs traditional budgeting](https://www.quicken.com/blog/simplifi-spending-plan-better-than-budgeting/)
- [Quicken blog – How to use Simplifi with any kind of budget](https://www.quicken.com/blog/simplifi-with-any-budget/)
- [Finny – Quicken Simplifi review 2026](https://getfinny.app/blog/quicken-simplifi-review-2026)
- [Finny – Quicken Simplifi pricing 2026](https://getfinny.app/blog/quicken-simplifi-pricing-2026)
- [FinCompareLab – Quicken Simplifi review (pricing trap)](https://www.fincomparelab.com/reviews/quicken-simplifi-review/)
- [Engadget – The best budgeting apps for 2026](https://www.engadget.com/apps/best-budgeting-apps-120036303.html)
- [Quicken Community – Will Simplifi ever support multiple currencies?](https://community.quicken.com/discussion/7946573/will-quicken-simplifi-ever-support-multiple-currencies)
