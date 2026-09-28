# Qapital

> Summary: Qapital, the US goal-based saving app driven by IFTTT-style rules (Round-Up, Guilty Pleasure, 52 Week, Spend Less, Payday, Set & Forget), and why goals with a picture and funding plan, suggested contributions computed from the ledger and a weekly spending target are worth borrowing.

## At a glance

|                     |                                                                                                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Type                | Savings and money-management app (fintech on partner banks), not a bank                                                                                                                                                                    |
| Platforms           | iOS, Android (no web app)                                                                                                                                                                                                                  |
| Pricing (2026)      | Official pricing page: Basic $3/month, Complete $8/month, Premier $12/month, 30-day free trial, annual billing available. Older reviews list Complete at $6 and the top tier as "Master", so the price and name have changed. No free tier |
| Regions / bank sync | US only. Links a US checking account through a bank aggregator; savings held at a partner bank (FDIC-insured)                                                                                                                              |
| Data entry          | Sync only (linked bank account); no manual transactions, no import                                                                                                                                                                         |
| Best for            | People who find saving hard and want it to happen in the background, triggered by their own behaviour                                                                                                                                      |

## What makes it special

Qapital was designed around one insight: people don't fail to save because they lack information, but because saving competes with spending in the moment. So Qapital makes saving happen _as a side effect_ of things people already do: buying coffee (Round-Up), giving in to a temptation (Guilty Pleasure), getting paid (Payday), or even hitting a step goal (IFTTT and Apple Health rules). Behavioural economist Dan Ariely joined as "chief behavioral economist" soon after the 2015 US launch and later chaired the board. His research on the app's data shaped features such as the weekly spending target, which he argued works better than a monthly budget for discretionary spending.

The company started in Sweden in December 2013 as a Mint-style dashboard. It pivoted to US saving in 2014, closed the Swedish app in April 2015, added a debit card and spending account in 2017, and in November 2018 launched Payday Divvy, Spending Sweet Spot and Money Missions with paid tiers. Qapital claims over 2 million members and more than $3B saved. Headcount was about 51 in March 2026 (Revelio Labs), and its CFO has left.

User sentiment is split. Reviewers praise the automation ("over 15 ways to automate your savings") and shared goals, but consistently say budgeting is weak: it "lacks true budgeting features" (FinanceBuzz). The loudest complaints are commercial: the app stopped being free, cancelling is hard (you must zero the balance while fees keep being debited), an email announced an automatic upgrade to the highest-cost tier, and support is email or bot only with no phone line (MoneyDoneRight comments, Trustpilot and BBB summaries, 2025). One review cites transfers taking up to 10 days to start.

## Strongest feature

**Rules that feed Goals.** Each goal (with a name, a target amount and a cover photo) has one or more rules attached that decide _when_ and _how much_ to save. This fixes the target user's most common failure: they set a savings goal, then never contribute. Rules make the contribution concrete, small and tied to real behaviour. Usefulness: **High**, but CoinKeeper must turn "moves money" into "calculates a suggested contribution and reminds you", which keeps the psychological value without the banking.

## Feature deep dive

### Goals (with images and joint goals)

- **What it does**: Named savings targets with a photo, an amount and a progress view. They can be shared with a partner.
- **How it works**: Home → Save account → "Add a goal". You set a name, amount and cover photo, then choose which rules fund the goal and tap "Set up". Goals are unlimited. There are Savings Goals and Investment Goals, and goals can be edited, completed or closed; the help center has an article on what happens to the money when a goal closes. "Dream Team" lets partners save toward shared goals and see each other's transactions while choosing what stays private. Both partners need a membership. The help pages do not document a target-date field (unverified).
- **Why it helps**: A picture of the beach makes the goal emotionally real, and joint goals match how couples actually plan. **High**.

### Round-Up Rule

- **What it does**: Rounds each purchase up and saves the difference.
- **How it works**: The user picks a rounding threshold between $1 and $5 (default $2). A $4.60 purchase with a $2 threshold rounds to $6.00 and saves $1.40. If a purchase is an exact multiple of the threshold, the whole threshold amount is saved. Transfers are batched up to four times a week (Monday–Thursday) and usually settle the next business day. The account must be toggled "Use account for Rules". Qapital says users save an average of $44 a month with round-ups.
- **Why it helps**: It is invisible micro-saving. For us it is only a suggestion ("your round-ups last week would be 18.40"). **Low–Medium**.

### Guilty Pleasure Rule

- **What it does**: Each time you buy something you're trying to cut back on, you "fine" yourself into savings.
- **How it works**: Pick any merchant or place, set a fixed amount per purchase, and each matching purchase triggers a transfer of that amount to the goal. The help page does not document refunds, caps or multiple purchases per day.
- **Why it helps**: It makes the cost of a habit visible and redirects it to a goal. **Medium**. It maps well to our payees and categories.

### Spend Less Rule

- **What it does**: Sets a budget for a merchant; if you come in under budget, the difference is saved.
- **How it works**: Pick a store, then a weekly or monthly amount. At the end of the period, underspending is moved to a goal. The help article does not document how partial periods or overspending are handled.
- **Why it helps**: It rewards underspending, the missing half of most budgets, which only punish overspending. **High** as a planning feature: "you had 60 left in Dining this month; move it to Holiday?"

### 52 Week Rule

- **What it does**: A savings ladder that increases the weekly amount by $1 every week for a year.
- **How it works**: Start with a base amount; each week adds $1. From $1 the total is $1,378. The general formula is 52 × base + (0 + 1 + … + 51) = 52 × base + 1,326. The help article's $5 example quotes $1,568, which does not match that formula ($1,586), so the exact convention is unverified. Qapital's blog calls it the 52-week challenge "with a Qapital twist".
- **Why it helps**: Ready-made plans remove decision fatigue. **Medium**. It is a template for a contribution schedule.

### Payday Rule and Freelance Rule

- **What it does**: Saves a percentage of income when it arrives.
- **How it works**: Both are configured with a _minimum deposit amount_ and a _percentage_. Every deposit to the funding account over that amount triggers a transfer of the percentage. Qapital warns that the rule fires on _all_ deposits above the threshold, including manual transfers, ATM cash and cheque deposits, not only salary. The Freelance Rule is positioned for irregular income.
- **Why it helps**: "Pay yourself first" as a percentage works for both salaried and variable-income users worldwide. **High**.

### Set & Forget Rule

- **What it does**: A fixed recurring contribution.
- **How it works**: Daily, weekly or monthly. The weekly rule triggers in the app on Sunday and transfers on Monday. The monthly rule triggers on the 1st and transfers on the next batch day (Monday–Thursday).
- **Why it helps**: This is the baseline automation every goal should have. **High** as a planned or reminded contribution.

### IFTTT and Apple Health rules

- **What it does**: Saves money when something happens in another app: a Fitbit step goal, a Strava workout, a social media post.
- **How it works**: Built on a partnership with IFTTT since 2015. Some rules are set up in-app, others on IFTTT's website. The help article was updated in June 2026, so the feature is still supported.
- **Why it helps**: A fun motivator, but it needs third-party integrations. **Low** for us.

### Payday Divvy

- **What it does**: When a paycheck lands, it allocates it across needs (rent, utilities), current spending and goals or investments.
- **How it works**: Launched in November 2018 on the paid tiers. You set the pay frequency and allocation once; when a deposit arrives, the app prompts you, calculates the amounts and moves money in the background. The rest stays in the linked bank account, and the plan can be paused anytime. The help pages do not document whether allocations use fixed amounts or percentages (unverified).
- **Why it helps**: It is the same idea as Monzo's Salary Sorter. **High**.

### Spending Sweet Spot (weekly spending target)

- **What it does**: A weekly budget for discretionary spending such as coffee, eating out and entertainment. Essentials like groceries are excluded.
- **How it works**: The week starts on Monday, so the weekend comes at the end of the budget; Ariely's argument is that this prevents blowing the budget on Friday and Saturday. Notifications update you through the week. The launch post says underspending can be saved automatically. It tracks spending on the Qapital debit card.
- **Why it helps**: Weekly feedback matches how discretionary money is spent. **High**, and it complements our monthly budgets.

### Money Missions

- **What it does**: Behavioural-science challenges that teach why you spend and help you spend on what matters.
- **How it works**: Designed with behavioural economists and available only on the top tier. The content is educational with actionable tips; its mechanics are not documented publicly.
- **Why it helps**: Guided habit change for beginners. **Medium**. It is content-heavy and could come later.

## Fit for CoinKeeper

| Feature                                        | Usefulness for our user | Model changes?                                | API / services                            | UI changes                    | Effort (S/M/L) | Priority (Now/Next/Later/Skip) |
| ---------------------------------------------- | ----------------------- | --------------------------------------------- | ----------------------------------------- | ----------------------------- | -------------- | ------------------------------ |
| Goals with image/emoji, target, date, progress | High                    | `goals`, `goal_allocations` (shared proposal) | Goals service                             | Goals screen, goal cards      | M              | Now                            |
| Set & Forget → scheduled contribution reminder | High                    | `goal_plans` (type `fixed_schedule`)          | Due-contribution calculator               | "Due this week" list on Goals | S              | Now                            |
| Payday / Freelance → % of income suggestion    | High                    | `goal_plans` (type `income_percent`)          | Trigger on income transaction ≥ threshold | Review inbox prompt           | M              | Next                           |
| Spend Less → sweep unspent budget to a goal    | High                    | `goal_plans` (type `budget_leftover`)         | Month-close calculation from `budgets`    | Month-end review screen       | M              | Next                           |
| Weekly discretionary target                    | High                    | `budgets.period` or `spending_targets`        | Weekly spent over selected groups         | Weekly card on dashboard      | M              | Next                           |
| Guilty Pleasure → per-payee "fine" suggestion  | Medium                  | `goal_plans` (type `per_purchase`)            | Count matching transactions per period    | Goal detail                   | S              | Later                          |
| 52-week / challenge templates                  | Medium                  | `goal_plans` (type `ladder`)                  | Schedule generator                        | Goal wizard templates         | S              | Later                          |
| Round-up suggestion                            | Low                     | `goal_plans` (type `round_up`)                | Round-up sum over spending                | Insight card                  | S              | Later                          |
| Joint goals (Dream Team)                       | Medium                  | Sharing / household model                     | Multi-user access                         | Invite flow                   | L              | Later                          |
| Money Missions                                 | Medium                  | Content tables                                | —                                         | Lessons                       | L              | Later                          |
| IFTTT / Apple Health rules                     | Low                     | —                                             | Integrations                              | —                             | L              | Skip                           |

### Goals with a funding plan ("rules" re-imagined as suggestions)

- **What is it for?** It gives every goal (vacation, house deposit, car, emergency fund) a picture, a target, a date and at least one _plan_ that says when to contribute and how much. CoinKeeper cannot move money, so a plan produces **due contributions**: a list of "move 50 to Savings for Holiday", computed from the ledger. The user records the real transfer with one click, and it is linked to the goal. Usefulness: High. This is the heart of what makes Qapital work.
- **Model changes**, respecting integer minor units, the ledger as truth and soft delete:
  - `goals` and `goal_allocations` as proposed in the Monzo document. Add `image` (emoji or uploaded key) and `colour` to `goals`.
  - `goal_plans`: `id`, `user_id`, `goal_id`, `type` enum `fixed_schedule | income_percent | budget_leftover | per_purchase | ladder | round_up`, `active`, `deleted_at`, timestamps, plus typed nullable parameters rather than a JSON blob:
    - `amount_minor` (fixed, per-purchase fine or ladder base)
    - `step_minor` (ladder increment)
    - `basis_points` (percent × 100)
    - `min_trigger_minor` (income threshold)
    - `frequency` enum `daily | weekly | monthly`
    - `anchor_date`
    - `payee_id` / `category_id` / `category_group_id` (trigger scope)
    - `round_to_minor` (round-up unit)
  - Add CHECK constraints per `type` so that only the relevant columns are non-null.
  - `goal_contributions_due` is **not** stored. It is computed for a date window from plans plus the ledger:
    - fixed schedule: occurrences in the window
    - income percent: for each income transaction ≥ threshold, `floor(amount × bp / 10000)`
    - budget leftover: `max(0, budget − spent)` at month close
    - per purchase: count × amount
    - round-up: Σ (`ceil(|amount| / unit) × unit − |amount|`) over spending rows
  - "Done" means an allocation exists linked to the plan and period: add `goal_allocations.plan_id` and `period_key` (for example `2026-W39`). Skipping records an allocation of 0 with a note, or uses a `goal_plan_skips` table.
  - All amounts are in the goal's currency. For income in another currency, show the suggestion in the income currency with a converted hint, and never sum across currencies silently.
- **UI.**
  - A goal creation wizard: name, picture, target and date, then "How will you fund it?" with plan templates in plain language ("Every month, 100", "10% of every salary above 1,000", "Whatever is left in Dining Out each month", "Each time I buy at _Coffee Shop_, 2", "52-week challenge").
  - Goals screen: cards with image, progress and a pace indicator (on track / behind, compared with the linear path to `target_date`).
  - A "Due contributions" panel on the dashboard, with Record transfer (opens the transfer form prefilled from the checking account to the goal's account) and Skip actions.
- **Implementation steps.**
  1. Ship goals and allocations (Now).
  2. Add `goal_plans` with `fixed_schedule` only, plus the due-contributions endpoint and panel.
  3. Add `income_percent`, triggered in the create and import service. It adds a review-inbox item instead of acting silently.
  4. Add `budget_leftover` in a month-close view.
  5. Add the remaining templates.

  Each calculator is a pure helper in `packages/shared/src/lib/` with tests.

- **Risks and open questions.**
  - Users may confuse "suggested" with "done"; the wording and a checklist UI matter.
  - Income detection depends on correct categories (income groups) and the review inbox.
  - Qapital's own warning applies: "all deposits over threshold" catches refunds and transfers. We should exclude transfers (`kind = 'transfer'`) and allow a payee filter.

### Weekly discretionary spending target

- **What is it for?** It gives a weekly allowance for "fun" categories, reset every Monday, next to the monthly budgets. Usefulness: High for impulse spenders, and it pairs with the daily allowance idea from Revolut.
- **Model.** Option A: `spending_targets` (`id`, `user_id`, `currency`, `period` enum `week | month`, `week_start` smallint (1 = Monday, locale default), `amount_minor`, `category_group_ids` via a join table `spending_target_groups`, `deleted_at`). Option B: add `period` to `budgets`. That is riskier, because `budgets` is keyed by month and category today. Prefer A.
- **UI.** A dashboard card "This week: 64 of 120 used" with a day-by-day bar, and a setting to choose which category groups count as discretionary.
- **Implementation.** Compute weekly spent with SQL over `transactions` (standard kind, not excluded, category in the selected groups), grouped by currency, using `week_start` from the setting.
- **Risks.** Week boundaries and time zones; use `user_settings.locale` or an explicit week-start setting.

## What not to copy

- **Automatic money movement between bank accounts**: we are not a bank, and Qapital's multi-day transfer delays show the operational pain.
- **US-only bank linking via an aggregator**: conflicts with our region-agnostic principle.
- **Subscription dark patterns (auto-upgrade to the priciest tier, cancellation requiring a zero balance, no human support)**: these are the main source of Qapital's negative reviews.
- **Paywalling core behavioural features (Payday Divvy, Money Missions)**: basic goal funding should be free for our users.
- **Rules that fire on "all deposits"**: too blunt. Use categories, payees and the transfer flag.
- **Debit card and investment portfolios**: banking and brokerage products, out of scope.
- **IFTTT fitness rules**: fun but tied to third-party services and not core to financial control.

## Sources

- [Qapital – Pricing](https://www.qapital.com/pricing/)
- [Qapital – Saving (goals, rules, Dream Team)](https://www.qapital.com/saving/)
- [Qapital Help – Rules & Goals collection](https://help.qapital.com/en/collections/11080668-rules-goals)
- [Qapital Help – How Rules Work collection](https://help.qapital.com/en/collections/11080669-how-rules-work)
- [Qapital Help – Round Up Rule](https://help.qapital.com/en/articles/10245400-round-up-rule)
- [Qapital Help – Spend Less Rule](https://help.qapital.com/en/articles/10245398-spend-less-rule)
- [Qapital Help – Guilty Pleasure Rule](https://help.qapital.com/en/articles/10245399-guilty-pleasure-rule)
- [Qapital Help – 52 Week Rule](https://help.qapital.com/en/articles/10245396-52-week-rule)
- [Qapital Help – Freelance Rule](https://help.qapital.com/en/articles/10245397-freelance-rule)
- [Qapital Help – Payday Rule](https://help.qapital.com/en/articles/10245401-payday-rule)
- [Qapital Help – Set & Forget Rule](https://help.qapital.com/en/articles/10245402-set-forget-rule)
- [Qapital Help – IFTTT Rules](https://help.qapital.com/en/articles/10245393-ifttt-rules)
- [Qapital Help – Create Goals](https://help.qapital.com/en/articles/10245417-create-goals)
- [Qapital blog – The Qapital journey continues (Nov 2018 relaunch)](https://www.qapital.com/blog/the-qapital-journey-continues/)
- [Qapital blog – Budget instantly with Payday Divvy](https://www.qapital.com/blog/budget-instantly-with-payday-divvy/)
- [Qapital blog – Spending Sweet Spot / weekly spending target](https://www.qapital.com/blog/weekly-spending-target-budget)
- [Qapital blog – The Rules: how to save money with Qapital (search result)](https://www.qapital.com/blog/save-money-qapital-rules/)
- [Wikipedia – Qapital](https://en.wikipedia.org/wiki/Qapital)
- [Tearsheet – Dan Ariely on how Qapital uses behavioral finance (2019)](https://tearsheet.co/new-banks/dan-ariely-on-how-qapital-uses-behavioral-finance-principles-to-help-people-save-more/)
- [Entrepreneur – Behavioral economist helps solve money problems (search result)](https://www.entrepreneur.com/living/how-this-famous-behavioral-economist-is-trying-to-help/251662)
- [FinanceBuzz – Qapital review (Nov 2024)](https://financebuzz.com/qapital-review)
- [MoneyDoneRight – Qapital review: no longer free](https://moneydoneright.com/personal-finance/saving-and-budgeting/qapital-review/)
- [The College Investor – Qapital review, new pricing plans (search result)](https://thecollegeinvestor.com/20472/qapital-review/)
- [Trustpilot – Qapital reviews (search result)](https://www.trustpilot.com/review/qapital.com)
- [BBB – Qapital complaints (search result)](https://www.bbb.org/us/ny/new-york/profile/banking-services/qapital-inc-0121-164482/complaints)
- [Revelio Labs – Qapital employees 2026 (search result)](https://www.reveliolabs.com/companies/qapital/employees)
