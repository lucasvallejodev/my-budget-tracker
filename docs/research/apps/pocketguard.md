# PocketGuard

> Summary: PocketGuard, the one-number budgeting app built around Leftover (income minus bills, budgets, goals and debt payments): bills, rollover, goals, the debt payoff planner and the Pace forecast, and why a per-currency Leftover, per-category rollover and Pace are worth borrowing.

## At a glance

|                     |                                                                                                                                                                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type                | Safe-to-spend budgeting app with bills, goals, debt payoff and forecasting                                                                                                                                                                                                                  |
| Platforms           | iOS, Android, web (secure.pocketguard.com)                                                                                                                                                                                                                                                  |
| Pricing (2026)      | Plus/Premium: $12.99/month, $74.99/year or $149.99 lifetime (lifetime offer varies by promotion). 7-day free trial. The long-standing free tier has effectively been replaced by the trial. Reviewers who still see a free plan report caps of about 2 institutions and 2 category budgets. |
| Regions / bank sync | Bank sync in the US, Canada and UK via Plaid, Finicity and Salt Edge; manual accounts and CSV import everywhere else (the help center names Europe, Australia and Latin America)                                                                                                            |
| Data entry          | Sync, CSV import into cash accounts, manual cash transactions, auto-repeat income                                                                                                                                                                                                           |
| Best for            | Overspenders and first-time budgeters who want one clear "can I afford this?" number                                                                                                                                                                                                        |

Recent changes:

- The free tier was dropped in favour of a 7-day trial (2025–2026).
- **Pace** was announced on 1 April 2026 (iPhone first). A later product post says it is available on iOS and Android.
- The pricing page now lists "AI chat" among Premium features (details unverified).
- PocketGuard claims 1.7M+ users across the US, Canada and UK.

## What makes it special

PocketGuard's philosophy is that most people don't want to manage twenty categories. They want to know how much they can spend without getting into trouble. Everything in the app exists to protect one figure, **Leftover**. Bills, category budgets, savings goals and a debt payoff budget are all "set aside" first, and what remains is the money you can freely spend or save. Press coverage matches this positioning: CNBC Select called it the best app for overspenders and the Wall Street Journal called it best for first-time budgeters (both cited on PocketGuard's homepage), and NerdWallet (February 2026) calls it a good choice for a budget snapshot.

Users praise its simplicity and the instant clarity of the "In My Pocket" / Leftover number. A review aggregator also reports responsive support (24–48 h) and good Plaid connectivity with major US banks. The #1 complaint is **bank sync failures**: an August 2025 Google Play review describes an Amex connection dropping almost daily. Other complaints: the free tier is gone, customisation is weaker than YNAB, there is no transaction splitting or calendar view, and cancellation is hard. One Reddit user quoted by the aggregator put it this way: "It's more of an expense tracker, since you have to estimate income". The Leftover number is only as good as the income estimate.

## Strongest feature

**Leftover: a single safe-to-spend number.** The help center gives the formula as **Leftover = Income − Expenses − Goals**, where expenses include bills (paid and planned), category budgets and the debt payoff budget. It resets at the start of each month. Transfers are excluded by default to avoid double counting, and it can go negative when planned expenses exceed income.

For our target user, a non-expert who wants to stop overspending, this is probably the most useful single number a budgeting app can show. It converts a plan into a daily decision. It needs no bank sync: it is pure arithmetic over income, recurring bills, budgets and goals, all of which CoinKeeper can hold in its ledger.

## Feature deep dive

### Leftover (safe to spend)

- **What it does**: Shows how much money is left to spend or save this month after everything planned is set aside. It appears on the Dashboard (Plan card) and in detail on the Plan tab.
- **How it works**:
  - Leftover = Income − (Bills + Category budgets + Debt payoff budget) − Goal contributions.
  - Income is "estimated and actual income received": recurring income predicted from past deposits or entered manually.
  - Bills are counted as actual when paid and as planned when still upcoming.
  - Category budgets reserve their full amount. Overspending (shown in **red**) is deducted from Leftover. Underspending (shown in **green**) returns the unspent amount to Leftover.
  - Goal contributions are deducted so savings are "protected before you spend".
  - Transfers are excluded unless the user includes them.
  - The number resets monthly.
  - A zero-based setup is possible: allocate income across budgets until Leftover = 0.
  - Worked example from the help center: income $3,000 − budgets $500 − bills $1,000 = $1,500 Leftover.
- **Why it helps**: It replaces "check twelve categories" with one answer to "can I afford this?". Usefulness: **High**.

### Bills and subscriptions

- **What it does**: Lists upcoming and past-due bills and marks them paid when the matching transaction appears.
- **How it works**:
  - Some bills are detected automatically; others are added with "+" in Upcoming Bills (name, amount, frequency weekly/monthly/custom, next due date).
  - The upcoming amount is predicted from previous payments or the manual amount.
  - A bill is marked **paid** when a transaction's merchant name matches the bill. Weekly bills expect 4 or 5 matching transactions per month.
  - Wrong matches happen when merchant names collide; the fix is to rename transactions.
  - Users can skip a predicted payment or mark a bill paid by picking or creating a transaction.
  - Matched transactions get a "Bill" stamp.
  - Past-due dates mean "not paid".
- **Why it helps**: Bills are the biggest fixed chunk of spending. Knowing what is still due this month is what makes Leftover trustworthy. Usefulness: **High**.

### Recurring income (with auto-repeat)

- **What it does**: Predicts paychecks and other reliable income so Leftover can use expected income before it arrives.
- **How it works**:
  - Income is detected from patterns or entered manually as "Estimated income".
  - It is marked **received** when a transaction matches the income name _and_ is in the Income category.
  - Twice-monthly income expects two transactions.
  - Predicted income can be skipped.
  - **Auto-repeat income** automatically creates cash transactions on schedule, which is useful for manual-entry users.
  - Only reliable income should count; PocketGuard excludes reimbursements, gifts and side hustles.
- **Why it helps**: Without expected income, a safe-to-spend number is wrong for the first half of the month. Usefulness: **High**.

### Category budgets with rollover

- **What it does**: Sets monthly limits per category, optionally carrying unspent or overspent amounts into next month.
- **How it works**:
  - Budgets are created under Spending & Budgets. You can't budget Income or Savings categories, and bills belong in Bills (to avoid double counting).
  - Rollover is **per category**: "…" → Enable rollover, or the "Make this budget a monthly rollover" toggle.
  - Formula: **Left to rollover = Rollover(last month) + Budget(this month) − Spent(this month) + Earned(this month)**. "Earned" means refunds or income in that category.
  - Negative balances roll over too and reduce next month.
  - With rollover on, the label changes from "Left to spend" to "Left to rollover" and a small icon marks the category.
  - "Reset rollover" zeroes the carried amount.
- **Why it helps**: Irregular categories such as clothes, car maintenance and gifts don't fit neatly into one month. Rollover turns a limit into a small sinking fund. Usefulness: **High**.

### Savings goals

- **What it does**: Sets a goal (emergency fund, vacation, down payment) with a target and due date, and tells you the monthly contribution.
- **How it works**:
  - Fields: name, emoji, target amount, due date, monthly contribution. The contribution is calculated automatically (effectively remaining ÷ months left) and can be raised or postponed a month. The flow uses a SMART framing.
  - Two kinds:
    - **External goals** are linked to one bank account and track its balance. The target is therefore a _balance_: to save $10,000 on top of an existing balance you must add them together.
    - **Manual goals** are progressed by logging contributions, which can be removed.
  - Monthly contributions are deducted from Leftover.
- **Why it helps**: It makes "vacation, house, car, emergency fund" concrete. Usefulness: **High**.

### Debt payoff plan (snowball / avalanche)

- **What it does**: Builds a payoff schedule across debts with a target debt-free date and total interest.
- **How it works**:
  - Inputs per debt: current balance, minimum monthly payment, APR, optional promotional rate period, optional forbearance.
  - Plan inputs: a monthly **debt payoff budget** (taken from Leftover), a strategy and a start date.
  - **Snowball** orders debts by lowest balance; **Avalanche** by highest APR.
  - The priority debt gets minimum + all extra; the others get minimums. When a debt is paid off its payment rolls to the next and the plan is recalculated.
  - Outputs: payment cycles remaining, total interest, debt-free date, per-debt allocations.
  - "Show me magic" simulates different budgets before committing.
  - Manual debts are supported.
- **Why it helps**: Debt is common among overspenders, and the maths behind snowball and avalanche is universal (not US-specific). Usefulness: **Medium–High** (high for users with card or loan debt).

### Pace (end-of-month forecast, 2026)

- **What it does**: A metric on the Plan tab showing whether you are **on track**, **spending slower** or **moving too fast** compared with your plan, plus alerts before money runs out.
- **How it works**:
  - Pace combines money remaining, days left in the cycle and spending rate against the plan, using six months of history plus current bills, goals and debt plans.
  - It filters routine fluctuation and alerts only on significant deviations. The launch example flagged a 40% overspend rate that projected running out one week before payday.
  - The CEO's framing: $600 left on the 15th looks fine, but at double the normal rate it is gone in a week.
  - The exact formula and thresholds are not published.
- **Why it helps**: Leftover says _where you are_; Pace says _where you'll end up_. Usefulness: **High**.

### CSV import and cash accounts

- **What it does**: Imports bank statements into a cash (manual) account and supports manual cash tracking.
- **How it works**: Choose the file source (a named bank or budgeting app, or "Generic"), choose a cash account and upload the CSV. There is also a Mint migration path and export.
- **Why it helps**: It is the path for users outside the US, CA and UK. CoinKeeper already does this, with column mapping and duplicate detection. Usefulness: **High** (already covered).

### Rules, net worth, insights

- **What it does**: Transaction rules (categorise, rename, tag), a net worth tracker, daily spending insights, bulk edit.
- **How it works**: Standard; few mechanics published.
- **Why it helps**: Table stakes. CoinKeeper already has rules (categorise only) and net worth. Usefulness: **Medium**.

## Fit for CoinKeeper

| Feature                                      | Usefulness for our user | Model changes?                                                                              | API / services                          | UI changes                                            | Effort (S/M/L)      | Priority (Now/Next/Later/Skip) |
| -------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------- | ------------------- | ------------------------------ |
| Leftover / safe-to-spend (monthly + per day) | High                    | None required (uses budgets, recurring, goals); optional `user_settings.safe_to_spend_mode` | `GET /plan/summary?month=` per currency | Dashboard hero number, Plan screen breakdown          | M                   | Now                            |
| Per-category rollover                        | High                    | `budgets.rollover` boolean + `rollover_reset_month`                                         | Budget query with window sums           | "Left to rollover" label, rollover icon, reset action | S–M                 | Now                            |
| Bills with paid/due status                   | High                    | `recurring_series` (see rocket-money.md)                                                    | Matching service                        | Upcoming bills list with Paid / Due / Overdue chips   | M                   | Next                           |
| Expected income                              | High                    | `recurring_series.kind = income`                                                            | Same                                    | Income row in plan                                    | S (after recurring) | Next                           |
| Savings goals with monthly contribution      | High                    | `goals` table                                                                               | Goals CRUD + progress                   | Goals screen, contribution hint                       | M                   | Next                           |
| Pace forecast                                | High                    | None                                                                                        | Forecast service                        | Pace chip (On track / Too fast / Slower) + mini chart | M                   | Next                           |
| Debt payoff planner                          | Medium–High             | `accounts.apr_bps`, `accounts.minimum_payment_minor`; `debt_plans` table                    | Pure simulation in `packages/shared`    | Debt plan screen with timeline                        | M                   | Later                          |
| Auto-repeat income for manual users          | Medium                  | Recurring templates that create rows                                                        | Scheduler / on-open materialisation     | Toggle on recurring series                            | M                   | Later                          |
| Rule actions (rename, tag)                   | Medium                  | Extend `rules`                                                                              | Rule engine                             | Rule editor                                           | S                   | Later                          |

### Leftover (safe-to-spend) for CoinKeeper

- **What is it for, and how useful is it?** It gives users one number that answers "how much can I still spend this month without breaking my plan?", plus a per-day version. It is the most direct tool for "stop wasting money / spend better". Usefulness: **High**.
- **Should we modify the models?** Not for a first version. Compute everything on read, per currency, from the ledger, `budgets`, and later `recurring_series` and `goals`. For `month` M and currency C:

  ```
  income        = max(expected_income, received_income)   -- expected from income series, else user-entered estimate
  bills         = Σ over active bill/subscription series of max(expected_in_M, paid_in_M)
  budgeted      = Σ over budgets(M, C) of max(limit, spent)            -- overspend reduces Leftover (red), underspend is reserved
  unbudgeted    = Σ spending in M in categories with no budget and not linked to a series
  goals         = Σ planned monthly contribution of active goals in C
  leftover      = income − bills − budgeted − unbudgeted − goals
  per_day       = leftover / days_remaining_in_M   (only when leftover > 0)
  ```

  "Spending" follows our invariants: `kind = 'standard'`, `NOT excluded`, `deleted_at IS NULL`, and accounts with `counts_in_spending = true`. Transfers never count. Add an optional `user_settings.estimated_monthly_income_minor` (with currency) for users who haven't set up income series yet.

- **Should we improve the UI?** Yes:
  - The dashboard gets a hero "Left to spend this month" (per currency tabs when several) with "≈ X per day for N days".
  - A **Plan** breakdown (a stacked bar or waterfall: Income → Bills → Budgets → Goals → Leftover).
  - Red when negative, with the top overspent categories listed.
- **How to implement it**:
  1. Add a shared helper `computeLeftover(parts)` in `packages/shared/src/lib/` with tests. It is pure integer arithmetic.
  2. Add a `plan` service that runs one SQL query per component, grouped by currency.
  3. Add the endpoint and a TanStack Query hook.
  4. Add the dashboard widget and the Plan page.

  Risks and open questions:
  - Double counting when a bill's category also has a budget. PocketGuard forbids budgeting bills, so we should exclude series-linked transactions from `budgeted`/`unbudgeted`.
  - Irregular income makes "expected" unreliable. Default to received income and let the user opt in to expected.
  - Pay-cycle periods (see emma.md) would change "month" to "period".

### Per-category rollover

- **What is it for, and how useful is it?** It lets unspent money in variable categories (clothes, gifts, car) accumulate, and makes overspending cost next month, which teaches discipline. It turns our simple limits into light sinking funds without full envelope budgeting. Usefulness: **High**.
- **Should we modify the models?** Minimal. Add `budgets.rollover boolean NOT NULL DEFAULT false`. To reset, add a `category_budget_settings` row (`user_id`, `category_id`, `currency`, `rollover_start_month`) or `budgets.rollover_reset boolean`, where a reset month starts from zero. Balances are **never stored**: carry(M) is computed as a windowed sum over prior months since the last reset:

  ```sql
  SELECT b.category_id, b.month, b.currency, b.amount_minor,
         COALESCE(s.spent, 0) AS spent,
         SUM(b.amount_minor - COALESCE(s.spent, 0)) OVER (
           PARTITION BY b.category_id, b.currency, b.rollover_group
           ORDER BY b.month ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
         ) AS carried_in
  FROM budgets_with_groups b
  LEFT JOIN monthly_category_spend s USING (category_id, currency, month)
  WHERE b.rollover;
  ```

  Here `rollover_group` increments at each reset (a running count of resets). `spent` is net of refunds ("Earned" in PocketGuard's formula). Months with no budget row break the chain; decide whether they count as a zero budget.

- **Should we improve the UI?** Yes. Add a "Roll over unspent" toggle in the budget editor, show "Left to rollover" and a rollover icon, and add a tooltip with the formula (`carried + budget − spent`). "Copy last month" should copy the rollover flag.
- **How to implement it**:
  1. Migration.
  2. Budget query update.
  3. Shared helper for status. "Near limit" (80%) and "Exceeded" use `budget + carried` as the effective limit.
  4. Tests for negative carry and reset.

  Risks: editing past transactions changes carried amounts retroactively. That is correct for a ledger-as-truth model, but can surprise users (Emma freezes rollover at period start instead). We should state our choice in the docs.

### Pace (end-of-month forecast)

- **What is it for, and how useful is it?** It warns mid-month that the current spending rate will blow the plan. Usefulness: **High**; it pairs with Leftover.
- **Should we modify the models?** No. It is computed on read.
- **Should we improve the UI?** Add a chip next to Leftover (**On track** / **Spending too fast** / **Spending slower**) and a small cumulative-spend line chart (actual so far, projection, plan line) using Recharts.
- **How to implement it** (heuristic; PocketGuard's exact formula is unpublished):
  - `discretionary_spent_to_date` = spending excluding series-linked bills.
  - `daily_rate = spent_to_date / days_elapsed`, blended with the 6-month median daily discretionary spend for the same point in the month to dampen early-month noise. For example, weight the historical figure at 1 − days_elapsed/days_in_month.
  - `projected = spent_to_date + daily_rate × days_remaining + bills_still_due`.
  - Compare with `plan = income − goals` (or Σ budgets): **too fast** if projected > plan × 1.10, **slower** if < plan × 0.90, otherwise **on track**.
  - Only show after day 5 or once at least 5 transactions exist.
  - Risks: large one-off purchases skew the rate. Exclude the single largest outlier, or let the user mark a transaction "one-off".

### Debt payoff planner (later)

- **What is it for, and how useful is it?** It shows a realistic debt-free date and how much interest the chosen strategy saves. The maths is universal. Usefulness: Medium–High.
- **Should we modify the models?** Add `accounts.apr_bps` (integer basis points, never float) and `accounts.minimum_payment_minor`. Add `debt_plans` (`user_id`, `currency`, `strategy` enum `snowball | avalanche | custom`, `extra_payment_minor`, `start_month`, `deleted_at`). Balances come from the ledger (liability accounts).
- **Should we improve the UI?** Add a Debt plan screen: an ordered list of debts, a debt-free date, total interest, and a stacked area chart of balances over time.
- **How to implement it**: Write a pure month-by-month simulation in `packages/shared/src/lib/debt-payoff.ts` with integer rounding rules (interest = round(balance × apr_bps / 10000 / 12)). The plan never mixes currencies; one plan is created per currency.

## What not to copy

- **Removing the free tier in favour of a 7-day trial**: core budgeting should stay usable, as reviewers note PocketGuard's free limits are hit "within days".
- **Dependence on Plaid, Finicity and Salt Edge for the main experience**: the #1 complaint is sync breakage. Manual + CSV must be first-class.
- **Bill matching by merchant name only**: it causes false matches (PocketGuard's own help admits this). Match on payee + amount band + date window.
- **"Apple Card integration" and US/CA/UK-only institution lists**: region-specific.
- **Lifetime deals that "move with promotions" and are offered only to some users**: opaque pricing.
- **Hard-to-cancel subscriptions**: reported in reviews; conflicts with our principles.
- **External goals defined as an account balance**: forces users to add their existing balance to the target. Track goal progress from contributions or allocations instead.

## Sources

- [Help: What is Leftover and how it's calculated](https://pocketguard.com/help/leftover/)
- [Help: Category budgets](https://pocketguard.com/help/category-budgets/)
- [Help: Rollover budget feature](https://pocketguard.com/help/rollover-budget-feature/)
- [Help: Bills](https://pocketguard.com/help/bills/)
- [Help: Recurring income](https://pocketguard.com/help/recurring-income/)
- [Help: Savings goals](https://pocketguard.com/help/goals/)
- [Help: Debt payoff plan (snowball vs avalanche)](https://pocketguard.com/help/debt-payoff-plan/)
- [Help: What countries does PocketGuard support?](https://pocketguard.com/help/what-countries-does-pocketguard-support/)
- [Help: Import transactions from CSV](https://pocketguard.com/help/import-transactions/)
- [PocketGuard pricing](https://pocketguard.com/pricing/)
- [PocketGuard homepage (features, user counts, press)](https://pocketguard.com/)
- [PocketGuard news: Pace, see your spending trend](https://pocketguard.com/news/pace-see-your-spending-trend-in-real-time/)
- [PocketGuard Pace product page](https://pocketguard.com/pace/)
- [FinanceWire: PocketGuard introduces predictive budget alerts (Apr 2026)](https://financewire.com/2026/04/01/pocketguard-introduces-alert-system-for-predictive-budget-monitoring/)
- [NerdWallet: PocketGuard app review (Feb 2026)](https://www.nerdwallet.com/finance/learn/pocketguard-app-review)
- [CheckThat.ai: PocketGuard user reviews summary](https://checkthat.ai/brands/pocketguard/reviews)
- [Finny: PocketGuard pricing 2026 (free tier change)](https://getfinny.app/blog/pocketguard-pricing-2026)
- [The Penny Hoarder: PocketGuard review 2026](https://www.thepennyhoarder.com/budgeting/pocketguard-review/)
