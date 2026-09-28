# Emma

> Summary: Emma, the UK-born open-banking money app: its subscription tracking, payday-to-payday budgets, committed spending, rolling budgets and reports, and why budget periods that follow payday, a daily allowance after committed spending and recurring templates for manual accounts are worth borrowing.

## At a glance

|                     |                                                                                                                                                                                                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type                | Account aggregator + budgeting + subscription tracker, with savings, investing, P2P payments and cashback add-ons                                                                                                                                                     |
| Platforms           | iOS, Android, Emma for Web (paid tiers)                                                                                                                                                                                                                               |
| Pricing (2026)      | Free: 2 bank connections, basic tracking. Plus £4.99/month (£41.99/year), Pro £9.99/month (£83.99/year), Ultimate £14.99/month (£124.99/year); same numbers in USD and CAD. 7-day trial. CSV import, net worth, data export and custom categories need Pro or higher. |
| Regions / bank sync | Live in the UK, US and Canada only. Open banking in the UK, aggregators in North America. Cannot connect banks elsewhere; not available in the EU despite the "UK/EU" reputation. Several features (Autosave, cashback, bank transfers) are UK-only.                  |
| Data entry          | Sync first; "offline accounts" for manual tracking; recurring offline transactions and CSV import on Pro/Ultimate                                                                                                                                                     |
| Best for            | UK users with several bank accounts who want an automatic overview, subscription list and payday-based budget                                                                                                                                                         |

Recent changes: Emma paywalled bank connections at the end of 2022. The founder describes that "reset" as the start of the company's success. In a July 2026 interview, CEO Edoardo Moreni said Emma is profitable, that roughly half its users pay (hundreds of thousands of subscribers), and that about 90% of revenue is subscriptions and 10% affiliate commissions. The homepage claims 2M+ users and 10B+ transactions analysed. The App Store rating is 4.7 from 27k+ ratings (UK store).

## What makes it special

Emma's promise is to see everything in one place, including subscriptions you forgot, and then help you budget around your real pay cycle. Two design choices stand out for a budgeting product:

- The budget period follows **your payday**: weekly, monthly, a fixed date, or rules like "last working day" or "last Friday before the last Saturday".
- The budget subtracts **committed spending** (upcoming recurring payments) to show what is really left, with a **daily allowance** until the period ends.

Emma also has a playful, friendly tone, weekly spending reports delivered as cards, and an "Excluded" category concept that keeps transfers and card repayments out of analytics.

Users love the design and the multi-bank overview ("integrations with almost every bank you could need", per a testimonial on its site). They leave because of monetisation. Reviewers report constant upsells, notification overload and unexpected annual renewals ("charged me for another year after deleting the app", quoted by OrbitMoney). A 2026 review gave it 2/5, saying the app is "let down by its commercial nature" because custom categories and basic budget controls sit behind a paywall (The Financial Wilderness). The founder presents the same paywall as a deliberate strategy that made the company profitable.

## Strongest feature

**Payday-aligned budgeting with committed spending and a daily allowance.** Most people are paid monthly or biweekly on a date that is not the 1st. A calendar-month budget is therefore wrong for half of every month. Emma lets users set the period to their pay cycle. It then computes **left to spend = total budget − committed spending (predicted recurring payments this period) − spent**, and shows a daily allowance ("how much you can spend each day to stay within budget before the period ends").

For our target user this matters a lot, and it is not tied to any country. Pay cycles and recurring payments exist everywhere, and all the inputs can come from a manual or CSV ledger.

## Feature deep dive

### Budget periods (payday to payday)

- **What it does**: Budgets reset on payday instead of on the 1st.
- **How it works**:
  - Period types: **Monthly** (1st to last day), **Weekly**, **Fixed date** (for example the 25th), and **Variable date** rules such as last working day, penultimate working day, or last Friday before the last Saturday.
  - The blog also lists biweekly and every-4-weeks cycles.
  - The period starts on the first day you get paid.
  - Past budgets cannot be edited, for any budget type.
- **Why it helps**: It matches how money actually flows and removes the "rich week / broke week" distortion. Usefulness: **High**.

### Total budget, category budgets and committed spending

- **What it does**: One total budget for the period, optionally split into category budgets. Upcoming recurring payments are subtracted automatically.
- **How it works**:
  - There are two documented ways to set the total. Income-based: **income − savings goal** (for example £1,000 − £100 = £900). Spending-based: **recurring payments + expected other spending** (for example £200 + £800).
  - If the category budgets add up to more than the total, Emma raises the total.
  - **Committed spending** = predicted recurring payments due within the current period, taken from the Recurring payments list. It is used to compute left-to-spend.
  - Payments predicted outside the period don't count.
  - Excluded transactions (card repayments, internal transfers) are left out.
  - A **daily allowance** is shown (formula unpublished; presumably remaining ÷ days left).
  - Savings are framed as "a result, not a target" (income − spent).
  - Emma notifies you when you're "going too fast" or on track.
- **Why it helps**: It turns a budget into a trustworthy "what's really left" figure. Usefulness: **High**.

### Rolling budgets (Pro/Ultimate)

- **What it does**: Carries leftover or overspent amounts into the next period.
- **How it works**:
  - £200 budget, £160 spent → +£40 next period. £250 spent → −£50 next period.
  - Rollover is calculated **at the start of each new period, from categorisation at that moment**. Later edits to past transactions don't change an already-calculated rollover.
- **Why it helps**: It smooths irregular spending. The "frozen at period start" rule is a clear design choice (contrast with PocketGuard). Usefulness: **High**.

### Merchant budgets (Plus+)

- **What it does**: Sets a budget for a specific merchant ("your favourite shop, your transport provider, or your usual pub").
- **How it works**: Feed → Analytics & budgeting → Budget → type **Merchant** → search merchant → amount.
- **Why it helps**: Most wasteful spending is concentrated at a few merchants (delivery apps, coffee chains), and a merchant limit targets it directly. Usefulness: **Medium–High**.

### Recurring payments and subscription tracking ("wasteful" spending)

- **What it does**: Lists detected subscriptions, direct debits and standing orders, with payment history per provider, price-change visibility, bill reminders, price-hike alerts and an Inactive list. Emma markets this as finding "wasteful subscriptions" and "duplicate charges"; the detection rules are unpublished.
- **How it works**:
  - Shown in the Feed under Recurring payments (Plus+).
  - Editable fields: **predicted price, predicted payment date, frequency, name, expected min and max amount**.
  - Users can add missed payments manually or remove wrong ones.
  - Duplicates arise when transaction names change or accounts change, and can be merged.
  - Items become **inactive** when you stop being charged; "This is active" reactivates them.
  - A "Who charged me" tool explains unclear merchant names.
  - "Wasteful" is not a documented algorithm. In practice it means: subscriptions you forgot, price increases, duplicates, and fees (Emma also monitors bank and card fees and overdraft).
- **Why it helps**: It surfaces forgotten and creeping costs. Usefulness: **High**.

### Offline accounts with recurring transactions (Pro/Ultimate)

- **What it does**: Manual accounts that auto-create entries for regular fixed payments.
- **How it works**:
  - Add a transaction to an offline account (amount, reference, category, date), toggle **Set as recurring** and pick a frequency.
  - Frequencies: **Daily, Weekly, Fortnightly, Every 4 weeks, Monthly, Every 2 months, Quarterly, Every 6 months, Yearly**.
  - Emma then adds the entries automatically.
- **Why it helps**: This is the manual-entry world CoinKeeper lives in. Rent, salary and subscriptions shouldn't have to be typed every month. Usefulness: **High**.

### Custom categories and subcategories (Pro/Ultimate)

- **What it does**: User-defined categories with name and emoji, subcategories, and budgets on them.
- **How it works**: Created from a transaction's category picker ("Add New"). Subcategories are managed under Analytics → Manage Categories → Subcategories. Deleted with a long press. The Categories page can be re-ordered.
- **Why it helps**: Personal taxonomies matter. CoinKeeper already offers this for free (category groups, colours, icons), which is a competitive advantage worth keeping free. Usefulness: **High** (already have).

### Analytics, "Excluded" and weekly reports

- **What it does**: Income vs spending by category and merchant with date filters (weekly, monthly, quarterly, yearly, custom) and account filters. Weekly and payday/monthly reports arrive as message cards.
- **How it works**:
  - Internal transfers, credit-card repayments and transfers to savings are auto-categorised **Excluded** to avoid double counting.
  - Refunds and reimbursements land in Income and should be recategorised to offset the original category.
  - A 2019 announcement describes report cards with trend graphs, previous-period comparisons, and benchmarks against other Emma users (percentiles such as "top 0.2% of spenders" at a merchant).
- **Why it helps**: A short weekly recap builds the habit of looking at your money. Usefulness: **High** for the recap; **Low** for peer benchmarks (needs population data and has privacy implications).

### Split transactions and Groups

- **What it does**: Split one transaction across several categories ("Split this payment", "Add another split"). **Groups** track shared expenses with friends or partners and compute the simplest way to settle; non-Emma users can be invited.
- **How it works**: Equal split by default in Groups; settlement uses Emma P2P payments (UK). Community threads request negative splits, which suggests limits in the current implementation.
- **Why it helps**: Category splits are basic hygiene (a supermarket receipt covers groceries and household). Friend splitting is useful but a separate product. Usefulness: **Medium** (category split: High; groups: Low for now).

### Savings: Autosave (AI Saving, Round-ups, Custom), UK only

- **What it does**: Moves money into Emma Pots automatically.
- **How it works**:
  - **AI Saving** picks an amount weekly or monthly from your primary account balance and future spending, so you see bigger amounts after payday and smaller ones before.
  - **Round-ups** round each purchase to the nearest £1, with a 2×–5× multiplier.
  - Calculated each Sunday, collected Monday.
- **Why it helps**: It automates saving, but it needs a regulated money-movement partner. Usefulness: **Low** for the money movement; the "suggested amount to set aside" idea is Medium.

### Cashback rewards (UK, paid tiers)

- **What it does**: Affiliate cashback at 500+ UK retailers (up to 30%), withdrawn to PayPal from $5 or £5, taking about 2 months on average.
- **Why it helps**: Mostly a revenue line (10% of revenue). Usefulness: **Low**.

## Fit for CoinKeeper

| Feature                                               | Usefulness for our user | Model changes?                                                   | API / services                                         | UI changes                                                | Effort (S/M/L)      | Priority (Now/Next/Later/Skip) |
| ----------------------------------------------------- | ----------------------- | ---------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------- | ------------------- | ------------------------------ |
| Budget period follows payday                          | High                    | `user_settings.budget_period_*`; budgets keyed by `period_start` | Shared period helper used by every budget/report query | Period picker in settings; budget header shows date range | M–L                 | Next                           |
| Committed spending + daily allowance                  | High                    | None beyond `recurring_series`                                   | Budget summary gains `committed`, `daily_allowance`    | Budget header, dashboard                                  | S (after recurring) | Next                           |
| Recurring templates for manual accounts               | High                    | `recurring_series` + `auto_create` flag                          | Materialiser that creates due rows as `pending`        | "Set as recurring" toggle in transaction form             | M                   | Next                           |
| Rolling budgets                                       | High                    | See pocketguard.md                                               | Same                                                   | Same                                                      | S–M                 | Now                            |
| Merchant (payee) budgets                              | Medium–High             | `budgets.payee_id` nullable, check constraint category XOR payee | Budget query by payee                                  | Budget type selector                                      | S                   | Next                           |
| Recurring detection with min/max band, inactive state | High                    | `recurring_series.amount_min_minor/max_minor`, `status`          | See rocket-money.md                                    | Recurring screen                                          | M                   | Now                            |
| Split transaction across categories                   | Medium                  | `transaction_splits` table                                       | CRUD + reports read splits                             | Split editor                                              | M                   | Later                          |
| Weekly / period recap                                 | High                    | Optional `reports` cache (derived)                               | Recap service                                          | Recap card/page                                           | S–M                 | Next                           |
| Excluded handling for refunds                         | Medium                  | None (we have `excluded`)                                        | Refund offsets category                                | "Mark as refund of…" action                               | S                   | Later                          |
| Groups / split with friends                           | Low                     | Large                                                            | Large                                                  | Large                                                     | L                   | Skip                           |
| Autosave / round-ups (real money)                     | Low                     | —                                                                | —                                                      | —                                                         | —                   | Skip                           |
| Cashback, investing, rent reporting                   | Low                     | —                                                                | —                                                      | —                                                         | —                   | Skip                           |

### Budget periods that follow payday

- **What is it for, and how useful is it?** Budgets, safe-to-spend, rollover and reports line up with when the user is paid. Usefulness: **High**. It is universal and one of the most-requested features in budgeting apps generally.
- **Should we modify the models?** Yes, carefully:
  - `user_settings.budget_period_kind` enum `calendar_month | monthly_on_day | last_working_day | weekly | biweekly | four_weekly`.
  - `user_settings.budget_period_anchor` (date, for weekly/biweekly/four-weekly) and `budget_period_day` (1–31, for `monthly_on_day`; clamp to the month's length).
  - `budget_period_effective_from` (period start date), so changing the setting never rewrites history.
  - Budgets: add `period_start date`. Keep `month` for backward compatibility during migration (expand/contract), then make `(user_id, category_id, currency, period_start)` unique.
  - A period is always computed by a pure helper `periodContaining(date, settings)` in `packages/shared/src/lib/`. Nothing is cached.
  - "Working day" needs weekends only (Sat–Sun default). Holiday calendars are country-specific, so let the user shift manually or skip holidays in v1 (document it).
- **Should we improve the UI?** Yes. Add a Settings → Budget period picker with a live preview ("Your current period: 25 Sep – 24 Oct"). Budgets, dashboard and analytics headers show the period range and prev/next arrows. "Copy last month" becomes "Copy last period".
- **How to implement it**:
  1. Shared helper plus exhaustive tests (month ends, 29–31 clamping, DST-free date arithmetic on `date` only).
  2. Migration that adds `period_start`, backfilled as the 1st of `month`.
  3. Services take `[start, end)` instead of a month.
  4. Settings UI.
  5. Docs.

  Risks:
  - Every report and query touching "month" changes (dashboard, 8-month cash flow). Decide whether analytics stay calendar-based (simpler) and only budgets and safe-to-spend use periods.
  - Changing the period mid-way needs a rule. Emma forbids editing past budgets; we could apply the change from the next period start.

### Committed spending and daily allowance

- **What is it for, and how useful is it?** It shows what is truly left after bills that haven't been paid yet, plus a per-day figure the user can act on at the till. Usefulness: **High**.
- **Should we modify the models?** No, provided `recurring_series` exists (see rocket-money.md).
- **Should we improve the UI?** Yes. The budget header shows **Budget**, **Spent**, **Committed (N upcoming)**, **Left**, and **≈ per day**. The committed chip expands to the list of upcoming payments in the period.
- **How to implement it**:
  - `committed` = Σ `expected_amount_minor` of active outflow series whose next expected date falls in `[today, period_end)` and that have no linked transaction in the period yet.
  - `left = total_budget − spent − committed`.
  - `daily_allowance = floor(left / days_remaining)` in minor units, and only when positive; otherwise show "over by X".
  - Put the arithmetic in a shared helper and do everything per currency.
  - Risk: stale predictions (a bill already paid but not matched). Offer "mark as paid" linking, as Emma requires manual adjustment here too.

### Recurring templates for manual (offline) accounts

- **What is it for, and how useful is it?** In a manual-entry product, repetitive entry is the main reason people quit. Auto-creating rent, salary and subscriptions keeps the ledger complete with little effort. Usefulness: **High**.
- **Should we modify the models?** Reuse `recurring_series` with:
  - `auto_create boolean`.
  - `cadence` values covering Emma's list: daily, weekly, fortnightly, four_weekly, monthly, bimonthly, quarterly, semiannual, yearly.
  - `last_materialised_date`.

  Created rows are real `transactions` with `status = 'pending'`, `recurring_series_id` set and `needs_review = true`, so the user confirms them in the existing review inbox. When a CSV import later brings the real bank row, duplicate detection should match the pending row (same series, amount within band, date ±3 days) and offer to merge instead of creating a duplicate.

- **Should we improve the UI?** Add a "Repeat" control in the transaction form (frequency + optional end date), pending rows with a "scheduled" chip, and a Recurring screen that lists templates.
- **How to implement it**: Materialise on read. When the user opens the app or calls the transactions endpoint, create any due rows up to today in one DB transaction, idempotently by `(series_id, due_date)` with a unique partial index. This avoids needing a cron.
  - Risks: duplicate creation under concurrency (the unique index solves it) and timezone edges (use the user's local date from settings).

## What not to copy

- **Paywalling bank connections, custom categories, CSV import and net worth**: reviewers see it as holding basics hostage. For CoinKeeper these are core.
- **Constant upsells and notification overload**: the top complaint in reviews. Insights should be few, dismissible and in-app by default.
- **Annual auto-renewal surprises**: a dark pattern.
- **Peer spending benchmarks ("top 0.2% of spenders at X")**: needs pooled user data and conflicts with strict per-user scoping and privacy.
- **Cashback affiliate marketplace, investing, rent reporting to UK/US bureaus, UK-only Autosave and bank transfers**: region-specific, regulated, or unrelated to budgeting.
- **Groups with P2P settlement**: requires payments licensing; a separate product.
- **Freezing rollover at period start**: understandable, but it contradicts our "ledger is truth" invariant. Document our choice (recompute) instead.
- **"UK/EU" positioning without EU support**: we should be region-neutral by design (multi-currency, locale, manual/CSV).

## Sources

- [Help: Which countries is Emma available in?](https://help.emma-app.com/en/article/which-countries-is-emma-available-in-1x4q2og/)
- [Help: How much does Emma Plus/Pro/Ultimate cost?](https://help.emma-app.com/en/article/how-much-does-emma-plusproultimate-cost-1ywhulq/)
- [Help: Features of Emma Plus, Pro and Ultimate](https://help.emma-app.com/en/article/what-are-the-features-of-emma-plus-pro-and-ultimate-678fjp/)
- [Help: Budgeting category (article index)](https://help.emma-app.com/en/category/budgeting-1s6usi4/)
- [Help: How do I edit my period?](https://help.emma-app.com/en/article/how-do-i-edit-my-budgeting-period-7b3z5v/)
- [Help: Learn Committed Spending](https://help.emma-app.com/en/article/learn-committed-spending-1cg2t8v/)
- [Help: What is the Budgeting section used for?](https://help.emma-app.com/en/article/what-is-the-budgeting-section-used-for-in-emma-j0lovf/)
- [Help: Rolling Budgets](https://help.emma-app.com/en/article/rolling-budgets-6qct2p/)
- [Help: What is your total budget in Emma?](https://help.emma-app.com/en/article/what-is-your-total-budget-in-emma-npp1iv/)
- [Help: What are Merchant Budgets?](https://help.emma-app.com/en/article/what-are-merchant-budgets-qihqj9/)
- [Help: Recurring payments category](https://help.emma-app.com/en/category/recurring-payments-1xrbcm4/)
- [Help: Amend a recurring payment](https://help.emma-app.com/en/article/amend-a-recurring-payment-rm0jmr/)
- [Help: What are inactive recurring payments?](https://help.emma-app.com/en/article/what-are-inactive-recurring-payments-28kamv/)
- [Help: Recurring offline transactions](https://help.emma-app.com/en/article/recurring-offline-transactions-1kstyx7/)
- [Help: Analytics category (Excluded, refunds, transfers)](https://help.emma-app.com/en/category/analytics-155lckn/)
- [Help: Split a transaction](https://help.emma-app.com/en/article/split-a-transaction-1jytjas/)
- [Help: Create, edit and delete custom categories](https://help.emma-app.com/en/article/create-edit-and-delete-custom-categories-umylhf/)
- [Help: AI savings mode amounts](https://help.emma-app.com/en/article/how-much-is-saved-per-week-with-the-ai-savings-mode-64h1tj/)
- [Help: Emma Cashback](https://help.emma-app.com/en-us/article/emma-cashback-1w5ymg9/)
- [Emma blog: How budgeting works in Emma](https://emma-app.com/blog/how-budgeting-works-emma)
- [Emma: Recurring payments feature page](https://emma-app.com/features/recurring-payments)
- [Emma homepage (user counts, features)](https://emma-app.com/)
- [Emma blog: Manage money between friends with Emma Groups (2021)](https://emma-app.com/blog/manage-money-between-friends-with-emma-groups)
- [Emma Community: Emma Spending Reports (2019)](https://community.emma-app.com/t/emma-spending-reports/58)
- [Fintech Growth Insider: How Emma reached profitability (Jul 2026)](https://www.fintechgrowthinsider.com/p/edoardo-moreni-emma)
- [OrbitMoney: Emma app review and complaints](https://orbitmoney.io/compare/emma-app-review)
- [The Financial Wilderness: Emma budgeting app review (2026)](https://www.thefinancialwilderness.com/emma-budgeting-app-review/)
- [App Store (UK): Emma – Budget Planner Tracker](https://apps.apple.com/gb/app/emma-budget-planner-tracker/id1270062373)
