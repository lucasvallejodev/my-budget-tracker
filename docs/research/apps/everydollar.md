# EveryDollar

> Summary: EveryDollar, Ramsey Solutions' zero-based monthly budget: Left to Budget, Funds, Paycheck Planning and Margin Finder, and why rolling-over funds with targets, a three-state Left to Budget banner and a paycheck timeline are worth borrowing for CoinKeeper.

## At a glance

|                     |                                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type                | Zero-based monthly plan (income − expenses = 0) with sinking funds                                                                                    |
| Platforms           | Web (everydollar.com), iOS, Android. The mobile apps and Premium are **US-only**; international users can only use the free web budget on a computer. |
| Pricing (2026)      | Free tier. Premium US$17.99/month or US$79.99/year, 14-day free trial for new users.                                                                  |
| Regions / bank sync | Bank connection is Premium-only and US-only. The free tier is manual entry only (no file import is documented).                                       |
| Data entry          | Manual (free); bank sync with drag-and-drop categorising (Premium)                                                                                    |
| Best for            | Beginners, especially US users following the Ramsey debt-free plan, who want a simple monthly plan                                                    |

## What makes it special

EveryDollar reduces budgeting to one equation. You list each paycheck as an income line, give every expense line a **Planned** amount, and change amounts until the banner at the top stops saying "Left to Budget" or "Over Budget" and says "It's an EveryDollar Budget". There is no Ready to Assign pool of money on hand and no age-of-money metric. It is a monthly plan for **expected** income, which is conceptually simpler than YNAB's "only budget money you have". Money in normal lines does **not** roll over, and only lines turned into **Funds** build up a balance.

The app sits inside the Ramsey ecosystem. The 7 Baby Steps (a $1,000 starter emergency fund, the debt snowball, 3–6 months of expenses, and so on) shape the Financial Roadmap, debt ordering and even help-centre advice. In January 2026 Ramsey **relaunched EveryDollar** as a coaching product with **Margin Finder** (a guided questionnaire that finds "budget leaks"), personalised plans, daily lessons with streaks, live group coaching and the Roadmap, all for Premium subscribers. The press release claims new users find about $3,015 of margin on average. That number comes from Ramsey itself.

Sentiment is split. iPhone users rate it highly (4.7 on the App Store), Android lower (4.3, with complaints about crashes), according to LendEDU's 2026 review. Common complaints: the free version means typing in every transaction; Premium is expensive compared with competitors; bank sync sometimes fails even for paying users; and the help centre pushes upgrades. LendEDU's verdict is that it is worth it for Ramsey loyalists and that others may prefer something else.

## Strongest feature

**Funds (sinking funds) inside a simple zero-based plan.** Most lines are "spend this month" lines that reset every month. Any line can be switched into a Fund with a piggy-bank icon. A Fund has a running balance that carries over, an optional target and a progress view. This two-tier model (monthly lines that reset plus a few lines that accumulate) is easier for a beginner to understand than YNAB's "every category is an envelope". It covers the target user's goals directly: a vacation, a car, Christmas, yearly insurance, an emergency fund. It works with manual entry and has no regional dependency.

## Feature deep dive

### Zero-based monthly plan and "Left to Budget"

- **What it does**: You plan the month so that every unit of expected income is assigned to a budget line.
- **How it works**: Income lines hold one Planned amount per expected paycheck. Budget lines sit in groups (Giving, Savings, Housing, Food, Debt and others), each with **Planned**, **Spent** (the sum of tracked transactions) and **Remaining** (Planned − Spent). The header shows one of three states:
  - **Left to Budget** (planned income is greater than planned expenses);
  - **Over Budget** (planned expenses are greater than planned income);
  - **"It's an EveryDollar Budget"** (they are equal).

  Budget items and groups are **linked across months**: renaming changes every month, deleting leaves past and already-created future months alone, and names must be unique. For variable income the advice is to plan the low end of the range.

- **Why it helps**: One banner tells the user whether the plan is complete. It is very approachable for non-experts. Usefulness: **High**.

### Funds (sinking funds)

- **What it does**: Saves up for non-monthly or big expenses inside the budget.
- **How it works**: Turn any line into a Fund ("Make This a Fund"), with an optional **Current Balance** (money already saved) and an optional **Target Amount**. The fields work like this:
  - **Planned** is this month's deposit. It is added to the Fund balance **immediately**, whether or not money has moved in the bank.
  - **Spent** is the transactions tracked against the Fund; they reduce the balance.
  - **Remaining** is the balance after spending. Remaining carries forward every month, including negative values; normal lines cannot carry negatives.

  Example: $200 saved + $50 planned = $250; a $75 oil change leaves $175, which rolls into next month. A wrong carryover can be corrected by editing the Current Balance. EveryDollar recommends Funds for quarterly, half-yearly and annual bills. For bills that don't need saving up for, it suggests a normal line planned at $0 in months without the bill.

- **Why it helps**: "Save for the vacation" becomes a visible, growing number without an envelope system to learn. Usefulness: **High**.

### Account Balancer (Funds ↔ real accounts)

- **What it does**: Checks that the money you think is in Funds really exists in your bank accounts.
- **How it works**: Mobile only. On the Accounts page you assign one or more Funds to a connected bank account. The app then shows whether there is a discrepancy and whether the bank balance or the Fund balance is off.
- **Why it helps**: Fund balances are only a plan (Planned counts immediately). This tool catches the gap between planned savings and actual savings. It depends on bank connection. Usefulness: **Medium** (the idea is valuable; the implementation depends on sync).

### Paycheck Planning and Safe to Spend (Premium)

- **What it does**: Spreads the monthly plan across paydays so you don't run out of cash before the next paycheck.
- **How it works**: Every line with a Planned amount appears in the paycheck plan. You pick one or more **dates** when the money for that line should be available. The amount is split **evenly** across the chosen dates ($100 on the 1st and 15th becomes $50 each); custom amounts per date are not supported, so the workaround is separate lines. The plan shows a running balance through the month:
  - If it goes negative before a payday, the app warns about **"Risk of Overspending"**; with healthy buffers the risk shows as low.
  - A **Buffer** (money left from last month) fixes early-month negatives.
  - **Safe to Spend** (a toggle on web and mobile) changes a line's Remaining to what is available **as of today** according to the schedule.

  The plan copies into the next month when you create it. **Reset Dates** moves everything back to the 1st, which is the same as not using the feature.

- **Why it helps**: Most people are paid biweekly or twice a month, and a monthly budget hides the timing problem of rent due on the 1st and the paycheck arriving on the 15th. Usefulness: **High** for paycheck-to-paycheck users.

### Creating next month's budget

- **What it does**: Starts a new month from the previous one.
- **How it works**: Move to the next month and click the button to start planning. Items, groups and Planned amounts are copied, and you then adjust them. Unspent money in normal lines does **not** roll over. The help centre's advice is to add an income line called "Rollover" in the new month and plan it manually. Budgets can also be copied to a previous month.
- **Why it helps**: A fast monthly routine. The manual "Rollover" workaround shows the limits of the model. Usefulness: **Medium** (CoinKeeper already has "copy last month").

### Debts and the debt snowball

- **What it does**: Tracks debts and pushes the snowball method.
- **How it works**: Debt lines store debt type, current balance and minimum payment. They are listed **smallest to largest balance, regardless of interest rate**, and can be reordered. A debt at $0 shows as paid off. Premium adds an on-track/off-track check against your debt-free date and suggests new payment amounts, adjustable in the Roadmap. Mortgages are handled separately (Baby Step 6).
- **Why it helps**: Visible progress on debt is very motivating. The method, though, ignores interest by design. Usefulness: **Medium**.

### Financial Roadmap and Baby Steps (Premium)

- **What it does**: A long-term projection of your finances built on the 7 Baby Steps.
- **How it works**: You enter age or birthdate, income, desired retirement age, your "margin" (what is left after expenses) and numbers for each Baby Step. The Roadmap then projects:
  - when each Baby Step will be completed;
  - net worth over time, adjusted for inflation and including home equity and retirement balances, plus when you reach "millionaire status";
  - whether you are on track, with a slider to test more or less margin.

  Only one person's data can be entered. Completed steps can't be backdated. Setup takes about 13 minutes by Ramsey's own timing. The Baby Steps include US-specific instruments (401(k), Roth IRA; paying the IRS first).

- **Why it helps**: Connects the monthly budget to life goals (a house, retirement), which is highly motivating. Usefulness: **Medium** (the concept is great, the content is US-centric).

### Margin Finder, lessons and coaching (Premium, 2026 relaunch)

- **What it does**: A guided review that finds money being wasted, plus behaviour-change content.
- **How it works**: A roughly 15-minute questionnaire walks through subscriptions, recurring bills and spending habits and suggests one-time and monthly savings ("margin"). Daily lessons build streaks, and Premium includes live group coaching sessions. The exact rules of the questionnaire are not public (unverified).
- **Why it helps**: Directly serves "stop wasting money". A guided checklist works even without bank data. Usefulness: **High** (the concept).

### Insights and the summary doughnut

- **What it does**: Shows where the plan and spending stand.
- **How it works**: On the web, a Summary button opens a **doughnut** coloured by budget group, with month totals for Planned, Spent and Remaining that update live. There is no single total for the whole budget; you add up the groups. **Insights** is the Premium reporting feature for habits over time; the help centre gives few details.
- **Why it helps**: A quick visual check. The reporting is thin compared with competitors. Usefulness: **Medium**.

### Household sharing and split transactions

- **What it does**: Lets a couple share one budget, and lets one purchase be divided across several lines.
- **How it works**: The owner invites a spouse through their Ramsey account. Both then see and edit the **owner's** budget, and the spouse's own budget is hidden until they leave. Splits divide one transaction across several budget items within **one month only**. Help articles document splits without marking them Premium, although at least one review lists splitting as a Premium feature (unverified).
- **Why it helps**: Couples budgeting together is a core use case, and splits are needed for supermarket runs. Usefulness: **Medium**.

## Fit for CoinKeeper

| Feature                                    | Usefulness for our user | Model changes?                                                     | API / services                                                        | UI changes                                                      | Effort (S/M/L) | Priority (Now/Next/Later/Skip)  |
| ------------------------------------------ | ----------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------- | -------------- | ------------------------------- |
| Funds (per-category rollover + target)     | High                    | `categories.rollover` flag + `category_targets` (or `fund_target`) | Budget month service computes the carried balance for fund categories | Piggy-bank badge, balance and target progress in the budget row | M              | Now                             |
| "Left to Budget" with planned income       | High                    | Budgets on income categories (already possible via `budgets`)      | Month summary: planned income − planned expenses per currency         | Header banner with three states                                 | S              | Now                             |
| Paycheck Planning / Safe to Spend          | High                    | `budget_schedules` (budget_id, day, share) or income paydays       | Timeline service per month and currency                               | New "Month timeline" view, "risk of overspending" alert         | M              | Next                            |
| Margin Finder (guided waste review)        | High                    | Optional `reviews` log; relies on recurring detection              | Recurring-payee detection over the ledger                             | Guided checklist screen                                         | M              | Next                            |
| Debt snowball / avalanche planner          | Medium                  | Loan fields on `accounts` (rate, minimum payment)                  | Payoff simulation                                                     | Debt plan screen                                                | M              | Later                           |
| Account Balancer (funds vs. real balances) | Medium                  | Optional `categories.account_id` link for funds                    | Compare fund balances with account balances                           | Warning chip on Accounts                                        | S              | Later                           |
| Long-term roadmap / net-worth projection   | Medium                  | Goal inputs                                                        | Projection maths                                                      | Roadmap screen                                                  | L              | Later                           |
| Household sharing                          | Medium                  | Shared households (big change to per-user scoping)                 | Membership and authorisation                                          | Invite flow                                                     | L              | Later                           |
| Split transactions                         | Medium                  | `transaction_splits` or child rows                                 | Split-aware reports                                                   | Split editor                                                    | M              | Next (not EveryDollar-specific) |
| Baby Steps content                         | Low                     | —                                                                  | —                                                                     | —                                                               | —              | Skip                            |

### Funds: per-category rollover with an optional target

- **What is it for?** Lets users save for goals and irregular bills without switching the whole budget to envelopes. Our current budgets reset every month. Marking some categories as funds that accumulate unspent money (and optionally aim at a target) gives the "vacation / car / emergency fund" story at low conceptual cost.
- **Should we modify the models?**
  - Add `categories.rollover` boolean (default false) to mark a category as a fund.
  - For the target, either add `categories.target_amount_minor` + `target_currency` + `target_date` (simple) or reuse a `category_targets` table (see the YNAB and Actual docs) so all goal types share one model.
  - Do **not** store a balance: fund balance(month, currency) = Σ budgets.amount_minor for that category up to the month + Σ category activity up to the month (spending negative, refunds positive), excluding transfers and soft-deleted rows.
  - An optional `opening_balance` for money saved before using CoinKeeper can be an `opening`-kind budget entry or an explicit `categories.fund_opening_minor` (clearer).
- **Should we improve the UI?**
  - On the Budgets screen, fund rows show Balance (carried) and Planned this month, with a progress bar toward the target and "needed per month" hint = (target − balance) ÷ months left.
  - Dashboard gets a "Savings funds" card.
  - New `FundProgress` component in `finance/`.
- **How to implement**:
  1. Migration for the new columns.
  2. Shared helper `computeFundBalance` and `monthlyNeed(target, balance, monthsLeft)` with tests covering negative balances, refunds, currency isolation and deleted budgets.
  3. Service query per month.
  4. Contracts and UI.

  **Risks:** users may confuse "planned deposit counts immediately" (EveryDollar's approach) with real money. CoinKeeper should label it "set aside" and later add an Account Balancer–style check that compares the total of funds with savings account balances per currency.

### Paycheck Planning (money timeline within the month)

- **What is it for?** It prevents mid-month cash crunches for people paid weekly, biweekly or twice a month. This is a very common real-world problem and is independent of country.
- **Should we modify the models?** Add `budget_schedules(id, user_id, budget_id, day_of_month smallint, share_bps int, created_at, deleted_at)`, where `share_bps` sums to 10000 per budget. That improves on EveryDollar's even split and still uses integer maths. Add `income_schedules` the same way (or use recurring transactions once CoinKeeper has schedules). The timeline itself is computed:
  - start = available cash per currency at the start of the month (from the ledger), plus an optional buffer;
  - for each day, add expected income and subtract budget shares, using largest-remainder rounding in minor units.
- **Should we improve the UI?** New "Timeline" tab on Budgets:
  - a step chart per currency (Recharts is already in the stack);
  - a list of paydays with the lines each one funds;
  - a red "risk of overspending on 12 Oct" alert;
  - optional "safe to spend today" figures per line.
- **How to implement**:
  1. Table and contracts.
  2. Shared `allocateShares(amountMinor, sharesBps)` helper (largest remainder).
  3. Service that builds the daily series.
  4. UI chart and editor (tap a line and pick days).

  **Open questions:** should this wait for recurring transactions or schedules (see the Actual Budget doc), so paydays come from real schedules instead of a separate table? Probably yes: build schedules first, then the timeline.

### "Left to Budget" for tracking mode

- **What is it for?** It gives the current limit-based budget a zero-based finish line: plan expected income, assign it all, reach zero.
- **Should we modify the models?** None required. Allow `budgets` rows on income categories (`category_groups.kind = income`) as **planned income**. Left to Budget per currency = Σ planned income − Σ planned expense budgets.
- **Should we improve the UI?** Add a header banner on Budgets with three states ("{amount} left to budget", "Over budget by {amount}", "Every unit has a job"), reusing existing status colours, and a planned-income row group.
- **How to implement**: validation for income budgets, a summary endpoint field, and a banner component. Effort **S**. **Risk:** mixing currencies. Show one banner per currency that has budgets.

## What not to copy

- **US-only mobile app and Premium.** EveryDollar is effectively unavailable outside the US on phones; the opposite of our goal.
- **Baby Steps content (401(k), Roth IRA, "pay the IRS first", 15% into US retirement accounts).** US tax and product specific.
- **Deleting transfers and credit-card payment transactions**, which the help centre recommends. It breaks the ledger; we keep paired transfers.
- **Planned deposit counted as fund balance immediately.** Convenient, but it drifts from reality. We should derive balances from assignments + ledger and show reconciliation hints.
- **Anti-credit-card stance built into the product.** Fine as coaching; we should stay neutral and model cards properly.
- **Heavy upsells in help content and coaching streaks.** Engagement mechanics that feel manipulative; keep nudges useful, not pushy.
- **Only even splits across paydays.** Allow explicit shares instead.

## Sources

- [EveryDollar Help: Premium Subscription Cost](https://everydollar.help.ramseysolutions.com/hc/en-us/articles/21544207900685-EveryDollar-Premium-Subscription-Cost)
- [EveryDollar Help: Getting Started With EveryDollar](https://everydollar.help.ramseysolutions.com/hc/en-us/articles/360032786691-Getting-Started-With-EveryDollar)
- [EveryDollar Help: Differences Between Planned, Spent, and Remaining](https://everydollar.help.ramseysolutions.com/hc/en-us/articles/22368992992397)
- [EveryDollar Help: How Funds Work With Your Budget](https://everydollar.help.ramseysolutions.com/hc/en-us/articles/40362010062861-How-Funds-Work-With-Your-Budget)
- [EveryDollar Help: How to Use Funds](https://everydollar.help.ramseysolutions.com/hc/en-us/articles/360037957712-How-to-Use-Funds)
- [EveryDollar Help: Recurring Bills or Expenses](https://everydollar.help.ramseysolutions.com/hc/en-us/articles/29042448590989)
- [EveryDollar Help: Funds and the Account Balancer](https://everydollar.help.ramseysolutions.com/hc/en-us/articles/39335107682189)
- [EveryDollar Help: How to Handle Unspent Money in Your Budget](https://everydollar.help.ramseysolutions.com/hc/en-us/articles/360038398771-How-to-Handle-Money-You-Didn-t-Spend-in-Your-Budget)
- [EveryDollar Help: Paycheck Planning FAQ](https://everydollar.help.ramseysolutions.com/hc/en-us/articles/11298446782477-Paycheck-Planning-FAQ)
- [EveryDollar Help: Paycheck Planning](https://everydollar.help.ramseysolutions.com/hc/en-us/articles/11667520933773-Paycheck-Planning)
- [EveryDollar Help: How to Create Next Month's Budget](https://everydollar.help.ramseysolutions.com/hc/en-us/articles/42988235371021)
- [EveryDollar Help: Linked Budget Items & Groups Across Months](https://everydollar.help.ramseysolutions.com/hc/en-us/articles/35934417559693)
- [EveryDollar Help: How to Track Debts](https://everydollar.help.ramseysolutions.com/hc/en-us/articles/11972956062093)
- [EveryDollar Help: The 7 Baby Steps](https://everydollar.help.ramseysolutions.com/hc/en-us/articles/360039125651)
- [EveryDollar Help: Financial Roadmap](https://everydollar.help.ramseysolutions.com/hc/en-us/articles/13824199757581)
- [EveryDollar Help: Financial Roadmap FAQ](https://everydollar.help.ramseysolutions.com/hc/en-us/articles/13824300602253)
- [EveryDollar Help: Tracking Credit Card Transactions](https://everydollar.help.ramseysolutions.com/hc/en-us/articles/18661532380941)
- [EveryDollar Help: How to Split Transactions](https://everydollar.help.ramseysolutions.com/hc/en-us/articles/360038321391)
- [EveryDollar Help: Colored Doughnut Graph](https://everydollar.help.ramseysolutions.com/hc/en-us/articles/37494005111821)
- [EveryDollar Help: Premium Insights and Reporting](https://everydollar.help.ramseysolutions.com/hc/en-us/articles/360038538452)
- [EveryDollar Help: Household – Inviting a Spouse](https://everydollar.help.ramseysolutions.com/hc/en-us/articles/36246135475469)
- [GlobeNewswire: Ramsey Solutions relaunches EveryDollar (8 Jan 2026)](https://www.globenewswire.com/news-release/2026/01/08/3215300/0/en/ramsey-solutions-relaunches-everydollar-to-help-users-achieve-20-billion-in-financial-transformation-per-year-by-2030.html)
- [LendEDU: EveryDollar review 2026 (free vs. Premium, ratings)](https://lendedu.com/blog/everydollar-review/)
- [NerdWallet: EveryDollar app review](https://www.nerdwallet.com/finance/learn/everydollar-app-review)
- [The Penny Hoarder: EveryDollar review 2026 (search result)](https://www.thepennyhoarder.com/budgeting/everydollar-app-review/)
