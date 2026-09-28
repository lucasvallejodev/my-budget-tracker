# YNAB (You Need A Budget)

> Summary: YNAB, the subscription zero-based envelope app built on giving every dollar a job: Ready to Assign, Available balances, targets, overspending rules, credit cards and reports, and why rolling Available balances, set-aside versus refill targets and Cost to Be Me are worth borrowing for CoinKeeper.

## At a glance

|                     |                                                                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type                | Zero-based envelope budgeting (they now call the budget a "plan")                                                                                                                                                                                 |
| Platforms           | Web, iOS, Android                                                                                                                                                                                                                                 |
| Pricing (2026)      | US$14.99/month or US$109/year. 34-day free trial with no card needed. College students get 1 free year. One subscription covers up to 6 people. No free tier.                                                                                     |
| Regions / bank sync | Direct Import covers selected banks in the US, Canada, the UK and parts of the EU (Plaid-based in Europe). Everywhere else uses file import (CSV is now the preferred format, plus OFX/QFX/QIF). One currency per plan: no native multi-currency. |
| Data entry          | Manual entry, file import, bank sync; scheduled (recurring) transactions                                                                                                                                                                          |
| Best for            | People who want to stop living paycheck to paycheck and will spend a few weeks learning a method                                                                                                                                                  |

## What makes it special

YNAB is a method first and software second. The "four rules" drive every screen: **Give Every Dollar a Job** (assign all money you have to categories), **Embrace Your True Expenses** (turn irregular costs into monthly amounts, e.g. a $300 bill six months away becomes $50/month), **Roll With the Punches** (move money between categories when life changes) and **Age Your Money** (spend money that is older and older; YNAB suggests keeping it above 30 days). The key point is that you plan only with money you already have. Future income is not counted, which YNAB calls "forecasting" and treats as the risky option.

Users who stick with it describe a lasting change in behaviour. The common complaint, repeated across Reddit summaries and long-term reviews, is that it takes two to three months to "click". Many people quit before then, and some go back to spreadsheets after two confused weeks. Price is the other sore point. YNAB moved from a one-off purchase (YNAB4) to a subscription and has raised prices several times. At $109/year it is among the most expensive budgeting apps, and some long-time users left over it.

The product is still very active in 2026. Updates this year include transaction photos (April), approving both sides of a transfer at once (April), Hide Amounts for sharing screenshots (June), a reworked file import where CSV is the preferred format (August), a "Plan Reset" on iOS that pulls every assigned dollar back so you can assign again, a swipe-based "Card Mode" for approving transactions, and hidden payees (September 2026).

## Strongest feature

**The Available column with automatic rollover, driven by targets.** Every category shows three numbers for the month: **Assigned** (what you put in this month), **Activity** (the sum of this month's transactions) and **Available** (what you can still spend, which carries forward). Whatever is left in a category at month end stays there, so a "Car insurance" category quietly builds up. Targets then tell you how much each category still needs.

This one mechanism answers the target user's main questions: "can I afford this?" (look at Available), "how do I save for a vacation or a house?" (a category with a target) and "where did it go?" (Activity). It works entirely with manual entry and CSV import, and it does not depend on any country. For CoinKeeper, whose budgets today are a monthly limit with no rollover, this is the biggest conceptual upgrade available.

## Feature deep dive

### Ready to Assign

- **What it does**: Shows how much money in your cash accounts is not yet in any category. The goal is to bring it to exactly zero.
- **How it works**: Ready to Assign (RTA) = money in on-plan cash accounts minus everything assigned. Income is categorised to a special "Inflow: Ready to Assign" category. A green banner with an **Assign** button appears when RTA is positive. When RTA is negative, a red bar reads "You assigned more than you have" on web ("Assigned Too Much" on mobile). The fix is to move money from categories back to RTA. YNAB lists five causes: plain overassigning, past overspending, reconciliation adjustments, outflows categorised to RTA, and overassigning in a future month. If you assign in future months ("getting a month ahead"), the current RTA lives in the **future-most month**, so the current month can show $0.00 while you are actually overassigned. Leftover RTA rolls into the next month, minus any cash overspending (see below).
- **Why it helps**: You can see at once whether all your money has a plan, and you can never plan money you don't have. Usefulness: **High**.

### Assigned / Activity / Available and the monthly rollover

- **What it does**: Each category behaves like an envelope whose balance carries over from month to month.
- **How it works**: When a new month starts:
  - Positive Available amounts stay as they are.
  - Assigned resets to 0, unless you had already assigned into that month.
  - Negative Available amounts become a gray zero. **Cash overspending** (red: spent from checking or cash with no money in the category) is subtracted from next month's RTA and shows as a line in the "Ready to Assign Breakdown". **Credit overspending** (yellow: spent on a credit card with no money in the category) does not reduce RTA. It becomes new card debt and shows as an **Underfunded** alert on the card's payment category.

  Assigned can be negative if you moved more money out of a category than you put in that month. A **Money Moves** history records every move between categories. YNAB advises against editing past months.

- **Why it helps**: Leftover money turns into savings automatically. Overspending is dealt with in one clear place instead of silently wrecking next month. Usefulness: **High**.

### Targets

- **What it does**: Tells YNAB how much a category needs, so the plan can flag categories that are short.
- **How it works**: A target has a cadence (**Weekly, Monthly, Yearly or Custom**; custom can be non-repeating) and a behaviour:
  - **Set aside another…** asks for the full amount every period, even when money is left over, so the balance builds up (e.g. $100/month for home maintenance).
  - **Refill up to…** asks only for what was spent or unassigned last period (e.g. $100/month for fuel).
  - **Have a balance of…** (custom only, cannot repeat) is for a balance you don't spend until the end date.

  Details and edge cases:
  - **Weekly targets** multiply by the number of the chosen weekday in the month, so a month with five Fridays asks for five times the amount.
  - **Yearly targets** have a "By" date and spread the amount monthly: $600 by next year becomes $50/month.
  - **Biweekly targets** are not supported. YNAB suggests a weekly target at half the amount, or annual ÷ 12.
  - **Refunds** categorised into a category don't count toward its target until the next period.
  - **Editing a target** changes it in every month, past and future.
  - **Refill targets** ask for the full amount when you look at a future month, because leftover money is only counted once that month begins.

  In the UI, an underfunded category shows a **yellow** Available amount, a donut in the category details shows progress and whether you are on track, and optional progress bars appear on the plan. One target can be chosen as the "Current Goal" and shown on the mobile Home tab.

- **Why it helps**: This is how "save for a vacation, house or car" and "embrace true expenses" happen in practice. Usefulness: **High**.

### Auto-Assign and Cost to Be Me

- **What it does**: Fills categories in one click, and shows what your life costs per month.
- **How it works**: Auto-Assign offers six options on all platforms:
  - **Underfunded** funds targets in priority order, plus upcoming scheduled transactions and overspending.
  - **Assigned Last Month**, **Spent Last Month**, **Average Assigned** and **Average Spent** copy an amount from history.
  - **Reduce Overfunding** takes back money beyond what a target needs.

  The web app adds **Reset Available Amount** and **Reset Assigned Amount**. Every option can be previewed and applied to the whole plan or to selected categories; hidden categories are excluded. **Cost to Be Me** (in Edit Plan, or the web sidebar) adds up all of this month's targets and compares the total with an expected income that you type in. It also previews next month when that total is higher, for example in months with five weeks.

- **Why it helps**: It removes the tedium of a monthly routine and answers "can my income support my plan?" before the month starts. Usefulness: **High** (Cost to Be Me is especially useful for our user).

### Credit card handling

- **What it does**: Makes sure money for card purchases is reserved, so the card can be paid in full.
- **How it works**: Adding a credit card account creates a **Credit Card Payment** category. When you buy something on the card and the spending category has money Available, YNAB moves that amount from the spending category into the payment category. If the category is short, the unfunded part is credit overspending (yellow). It stays on the card's balance and must later be assigned directly to the payment category. A card is "Paid in Full" when the payment category's Available matches the card's negative working balance (shown in green). YNAB also documents "credit card float", the habit of paying last month's card with this month's income.
- **Why it helps**: Solves the classic problem where budgets look fine but the card bill is a surprise. It is conceptually heavy for beginners. Usefulness: **Medium** (credit card use varies by country).

### Age of Money

- **What it does**: A single number showing how many days, on average, pass between money arriving and being spent.
- **How it works**: Looks at the **last ten cash outflows** (credit card payments included) and averages how long the dollars used for them had been sitting in your accounts. It is hidden until there are ten outflows. Transfers and starting balances are excluded. Mostly-credit-card users see it stall until they pay the card. It can drop suddenly when you spend the last dollars of an old paycheck. The Reflect tab charts it over 6 months, 1 year or 2 years (web).
- **Why it helps**: A motivating, easy-to-grasp "financial buffer" indicator ("I'm living on money from 34 days ago"). Usefulness: **Medium**.

### Loan accounts and the loan planner

- **What it does**: Tracks mortgages, car loans and student loans, and simulates paying them off.
- **How it works**: A loan account stores the balance, the **interest rate** (not the APR), the required monthly payment and, for mortgages, escrow. You can optionally pair a category with the loan. The paired category gets a Monthly Debt Payment target, a Record Payment button and a web payoff simulator: enter a payment to get a payoff date, enter a payoff date to get the required payment, or add a one-time extra payment to see the time and interest saved. For HELOCs and offset mortgages YNAB recommends tracking accounts instead. Credit cards should never be set up as loans.
- **Why it helps**: Makes the cost of debt and the benefit of extra payments concrete. The maths is universal, not country-specific. Usefulness: **Medium**.

### Reflect (reports)

- **What it does**: Looks back at your money.
- **How it works**: Six reports:
  - **Net Worth** (monthly asset and debt snapshot; shareable as an image since March 2026).
  - **Spending Breakdown** (categories ranked by spending over a date range).
  - **Spending Trends** (web).
  - **Income v Expense** (web cash-flow statement; starting balances count as equity and tracking accounts are excluded).
  - **Income vs. Spending** (mobile, last 6 months, added February 2026).
  - **Age of Money**.

  Data can be exported.

- **Why it helps**: Answers "where does my money go?" and "am I spending less than I earn?". Usefulness: **High**. CoinKeeper already covers part of this.

### Fresh Start and Plan Reset

- **What it does**: Lets you start over without losing your setup.
- **How it works**: **Fresh Start** archives the plan and creates a new one without transactions that keeps accounts, scheduled transactions, categories, targets, notes and payees. **Plan Reset** (iOS, September 2026) moves all Available money back to RTA so you can assign it again from scratch.
- **Why it helps**: People fall off budgets. A guilt-free restart keeps them using the app. Usefulness: **Medium**.

## Fit for CoinKeeper

| Feature                                                      | Usefulness for our user | Model changes?                                                            | API / services                                                                | UI changes                                                           | Effort (S/M/L) | Priority (Now/Next/Later/Skip) |
| ------------------------------------------------------------ | ----------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------- | ------------------------------ |
| Envelope mode: Assigned / Activity / Available with rollover | High                    | Yes: reuse `budgets` as monthly assignments, add a budgeting-mode setting | Month budget service that computes Available and Ready to Assign per currency | Budget screen gets three columns and a Ready to Assign banner        | L              | Next                           |
| Targets (set aside / refill / balance by date)               | High                    | New `category_targets` table                                              | Target evaluation ("needed this month"), underfunded list                     | Target editor in category detail, yellow "needs" state, progress bar | M              | Now                            |
| Cost to Be Me (targets vs expected income)                   | High                    | Expected monthly income per user (optional)                               | Sum of targets needed this month per currency                                 | Summary card on the budget screen                                    | S              | Now (with targets)             |
| Auto-assign (underfunded, last month, average spent)         | High                    | None                                                                      | Assign-preview endpoint                                                       | "Fill budget" menu with a preview                                    | M              | Next                           |
| Overspending handling (cash vs credit)                       | Medium                  | None (computed)                                                           | Rollover rules in the month service                                           | Red and yellow states, "cover overspending" action                   | M              | Next (with envelope mode)      |
| Age of Money                                                 | Medium                  | None                                                                      | FIFO calculation over the ledger per currency                                 | Dashboard stat and trend chart                                       | M              | Later                          |
| Loan payoff simulator                                        | Medium                  | Loan fields on `accounts`                                                 | Amortisation calculator                                                       | Loan detail panel                                                    | M              | Later                          |
| Credit Card Payment category                                 | Medium                  | Maybe (virtual per-card category)                                         | Moves funded card spending                                                    | Payment category row per card                                        | L              | Later                          |
| Money Moves history                                          | Low                     | Budget move log                                                           | List endpoint                                                                 | Drawer on the budget screen                                          | S              | Later                          |
| Fresh Start / Plan Reset                                     | Low                     | None                                                                      | Archive or reset assignments                                                  | Settings action                                                      | S              | Skip for now                   |

### Envelope mode (Assigned / Activity / Available with rollover)

- **What is it for?** It turns a budget from "a limit I compare against" into "money I've set aside". Rollover means unspent grocery money becomes savings automatically, and irregular costs are saved for over time. For our user (spend better, stop waste, save for goals) this is the core of zero-based budgeting.
- **Should we modify the models?** Keep the ledger as the source of truth and add as little as possible:
  - `user_settings.budget_mode` enum (`tracking` | `envelope`, default `tracking`), so the current behaviour stays intact.
  - Reuse `budgets(category_id, month, currency, amount_minor)` as the **Assigned** amount in envelope mode. It is already per currency and in integer minor units.
  - Add `category_groups.kind` checks so income categories never hold assignments.
  - Nothing else is stored. Activity is the sum of `transactions.amount_minor` by category, month and currency, excluding transfers, `excluded` rows and soft-deleted rows.
  - Available(m) = max(0, Available(m−1)) + Assigned(m) + Activity(m) for YNAB-style cash rules, or without the `max` for categories that roll negatives.
  - Ready to Assign(m) = on-budget cash balance per currency − Σ Available(m) (only positive amounts count) − assigned in future months.
  - A per-category `rollover_negative` boolean on `categories` (Actual-style) could be added later.
- **Should we improve the UI?** The Budgets screen gets:
  - a Ready to Assign banner per currency (green when positive, red when overassigned);
  - Assigned / Activity / Available columns per category;
  - a "Move money" popover to move money from one category to another;
  - status colours reusing the existing On track / Near limit / Exceeded palette (green Available, yellow underfunded, red overspent).

  New components: `ReadyToAssignBanner`, `MoveMoneyPopover`.

- **How to implement**:
  1. Add `budget_mode` to settings and a toggle in Settings.
  2. Write a SQL month-series query (a recursive CTE over months) that computes Activity and Available per category and currency, tested with PGlite on fixtures that cover rollover, negatives and transfers.
  3. Add `GET /budgets/:month?mode=envelope` returning the per-currency Ready to Assign and the category rows.
  4. Add the move-money endpoint: two `budgets` upserts in one database transaction.
  5. Build the UI.

  **Risks:** recursive month computation on large histories needs an index on `(user_id, category_id, date)` and maybe a limit on the starting month (e.g. the account opening date); multi-currency Ready to Assign must never be summed; users may find two modes confusing, so onboarding copy matters.

### Targets and Cost to Be Me

- **What is it for?** It answers "how much should I put aside for X?" for vacations, emergency funds, yearly insurance and down payments, which is exactly our user's goal list. It works fine even in tracking mode (as a "needed" amount next to the limit).
- **Should we modify the models?** New table `category_targets`:
  - `id`, `user_id`, `category_id`
  - `cadence` enum `weekly | monthly | yearly | custom`
  - `behavior` enum `set_aside | refill | balance`
  - `amount_minor` bigint, `currency` char(3)
  - `anchor_date` (weekday start or due date), `repeats` boolean
  - `created_at`, `archived_at`, `deleted_at`

  Add `user_settings.expected_monthly_income_minor` + `expected_income_currency` (or a small `income_plans(month, currency, amount_minor)` table if it should vary by month) for Cost to Be Me.

- **Should we improve the UI?**
  - A target editor in the category side panel.
  - A "Needed this month" figure and progress bar on each budget row.
  - An "Underfunded" filter.
  - A **Cost to Be Me** card showing Σ needed vs. expected income per currency.
- **How to implement**:
  1. Write a pure shared helper `computeTargetNeed(target, month, assignedToDate, availableAtStart)` in `packages/shared/src/lib` with exhaustive tests: weeks in a month, a yearly by-date target, refill vs set aside, and the refunds edge case.
  2. Add a service that returns the need for each category in a month.
  3. Add UI.

  **Open questions:** should targets live on categories (YNAB) or be separate "goals" linked to categories (a better fit if savings goals later get their own screen)? Edits apply to all months in YNAB. We can do the same, but should record `created_at` so past months are not rewritten in reports.

## What not to copy

- **US-centric Direct Import as a selling point.** Bank sync coverage is patchy outside the US, Canada, the UK and parts of the EU. Our base is manual entry plus CSV.
- **Single currency per plan.** YNAB users abroad run several plans or use workarounds. CoinKeeper's per-currency ledger is already better.
- **Price and trial model with no free tier.** It conflicts with a globally accessible tool, and price rises are a known reason people leave.
- **Credit Card Payment category as a default concept.** Powerful but the hardest part of YNAB to learn. Many of our users (debit/cash cultures) don't need it; offer it later as opt-in.
- **"Don't edit past months" as a user rule.** Our ledger-derived design should make past months recomputable instead of fragile.
- **Referral and gift-subscription growth features.** Not relevant to our product goals.

## Sources

- [YNAB pricing page](https://www.ynab.com/pricing)
- [The YNAB Method (four rules)](https://www.ynab.com/blog/ynab-four-rules-less-stress)
- [YNAB Help: Glossary](https://support.ynab.com/en_us/ynab-glossary-a-guide-BJd80SORq)
- [YNAB Help: When Ready to Assign is Negative](https://support.ynab.com/en_us/when-ready-to-assign-is-negative-an-overview-HylZA0zCc)
- [YNAB Help: When the Month Rolls Over](https://support.ynab.com/en_us/when-the-month-rolls-over-a-guide-rkyyd6qC9)
- [YNAB Help: Getting Started with Targets](https://support.ynab.com/en_us/getting-started-with-targets-ryAEP08xC)
- [YNAB Help: How to Use Targets](https://support.ynab.com/en_us/how-to-use-targets-rk5kkI9ks)
- [YNAB Help: Auto-Assign](https://support.ynab.com/en_us/auto-assign-a-guide-r1gBNbBJo)
- [YNAB Help: Edit Plan and Cost to Be Me](https://support.ynab.com/en_us/plan-and-adjust-with-edit-plan-and-cost-to-be-me-ByR7vpqPyx)
- [YNAB Help: Handling Credit Cards](https://support.ynab.com/en_us/handling-credit-cards-overview-ry7cNub1s)
- [YNAB Help: Credit Card Overspending](https://support.ynab.com/en_us/credit-card-overspending-an-overview-HkMGpSbJs)
- [YNAB Help: Age of Money](https://support.ynab.com/en_us/age-of-money-H1ZS84W1s)
- [YNAB Help: Loan Accounts](https://support.ynab.com/en_us/loan-accounts-a-guide-HkNSkPHJi)
- [YNAB Help: Reflect in YNAB](https://support.ynab.com/en_us/reflect-in-ynab-B1GJsrWkj)
- [YNAB Help: Income v Expense](https://support.ynab.com/en_us/income-v-expense-Byu1BYWRq)
- [YNAB Help: File-Based Import / CSV](https://support.ynab.com/en_us/formatting-a-csv-file-an-overview-BJvczkuRq)
- [YNAB Help: Direct Import in Europe](https://support.ynab.com/en_us/direct-import-in-europe-Syae1z_A9)
- [YNAB Help: Updates to YNAB (2026 changelog)](https://support.ynab.com/updates-to-ynab-S1f4aRLeC)
- [Tallyroot: Does YNAB support multiple currencies? (2026)](https://tallyroot.com/blog/ynab-alternative-multi-currency/)
- [BorderlessBudget: YNAB multiple currencies workarounds](https://borderlessbudget.com/blog/ynab-abroad-workarounds)
- [Gerald: YNAB Reddit review summary](https://joingerald.com/learn/financial-wellness/you-need-a-budget-ynab-reddit-review)
- [AOL / Yahoo Finance: a decade of using YNAB, pros and cons](https://www.aol.com/finance/ve-using-ynab-more-decade-080100591.html)
- [The Penny Hoarder: YNAB review 2026](https://www.thepennyhoarder.com/budgeting/ynab-review/)
