# Copilot Money

> Summary: Copilot Money, the design-led Apple-first US budgeting app: its learned To review inbox, pace-aware budgets, rebalancing, recurrings and goals, and why pace-based budget status, one-tap rebalancing and budget suggestions from history are worth borrowing for CoinKeeper.

## At a glance

|                     |                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Type                | Subscription personal-finance app focused on spending tracking, budgets, recurrings, goals and investments                                             |
| Platforms           | iPhone, iPad, Mac; web app launched 15 December 2025 (more limited than the native apps); no Android app and no announced timeline                     |
| Pricing (2026)      | $13/month or $95/year (≈ $7.92/month); 1-month free trial with card and auto-renewal; no free tier; no household plan (two people = two subscriptions) |
| Regions / bank sync | United States only (10,000+ US institutions through aggregators). No multi-currency support documented                                                 |
| Data entry          | Sync-first; manual accounts and manual transactions; **no CSV/XLS import** and no way to import historic balances; CSV export is supported             |
| Best for            | Solo US iPhone/Mac users who want a beautiful, automated tracker and are willing to review transactions often                                          |

## What makes it special

Copilot is the design benchmark of the category. It was an Apple Design Awards finalist, has been featured in App Store "Editor's Choice" and "Apps We Love" lists, and holds a 4.8/5 rating from more than 30,000 App Store reviews. Its philosophy is to remove friction: the app builds starting budgets from your history, detects recurrings during onboarding, and asks you only to _review_ what it guessed. Reviewers describe checking it "like Instagram". Money with Katie, for example, reports reviewing more than 7,000 transactions over five years and praises the custom names, colours and emoji for categories, and the haptics.

The heart of the product is the **To review** inbox combined with **Copilot Intelligence**, a per-user machine-learning model that learns from each transaction you approve or correct. The budget screens avoid the usual "limit vs spent" bars: they show whether you are _on pace_, with an ideal-spending line to compare against. The app also treats recurring bills as spending that is already committed before they post.

People leave for predictable reasons. It is iOS/Mac-first: the December 2025 web app is described by reviewers as basic, and there is still no Android app. It costs $95/year per person. Its only data path is US bank sync. Engadget also noted that it miscategorised more than the top competitors in its test, although other reviewers rate its categorisation the best in the category. On community forums some users moved to Monarch for Android and couples support. The 2026 roadmap pushes AI: a "Money Assistant" beta (April 2026) that watches accounts and proposes budget changes, an MCP connector for Claude and ChatGPT (May 2026), rebuilt splits on the web (June 2026) and running totals in the transaction list (September 2026).

## Strongest feature

**The review loop: "To review" plus a personal categorisation model.** Every new transaction lands in a To review list. After you have reviewed 30 transactions, Copilot Intelligence switches on. It trains a model _for your account only_ on the transaction name, amount, day of the week, the card used and "a few other data points". A prediction is applied only when the model is confident, and the transaction then shows an Intelligence badge. When the model is unsure it applies nothing. When it is wrong, the two most likely categories appear at the top of the picker. The loop makes categorising feel like clearing an inbox, and every correction makes the next month faster.

For our target user this matters a lot: categorisation is the tax you pay for "seeing where money goes". CoinKeeper already has a review inbox and a payee default category learned from 2 of the last 3 transactions. Copilot shows the next steps: confidence-gated auto-apply, top-2 suggestions and a visible "learned" badge. Without sync, this matters most right after a CSV import.

## Feature deep dive

### To review inbox and Copilot Intelligence

- **What it does**: queues new transactions for a quick approve-or-fix pass. It learns your categorisation habits.
- **How it works**: it activates after 30 reviewed transactions. The inputs are name, amount, weekday and card, and each user gets their own model built in-house. Predictions are confidence-gated (low confidence means no auto-category). Correct predictions show a badge. When the model is wrong, the top 2 alternatives are pinned first in the category list. Copilot encourages a "zero inbox" because every reviewed transaction improves the model.
- **Why it helps**: fast, low-effort categorisation that gets better with use. **Usefulness: High.**

### Transaction types (Regular, Income, Internal transfer)

- **What it does**: classifies each transaction as **Regular** (spending or refunds; counted in budgets), **Income** (excluded from budgets) or **Internal transfer** (credit card payments and moves between accounts; excluded from budgets).
- **How it works**: only Regular transactions can have a category. Income and transfers use Tags if you want sub-types. A transaction can become Income only if its amount is net-positive. The "Other" category cannot be deleted but can be renamed and given a $0 budget. There are also excluded categories, whose spending never counts toward totals.
- **Why it helps**: stops double counting of card payments and keeps "spending" honest. **Usefulness: High.** CoinKeeper already models this with paired transfers and `excluded`.

### Pace-aware budgets and the spending line

- **What it does**: the Dashboard shows a month-to-date chart with a **dotted line** (the ideal rate to stay within this month's budget) and a **solid line** (your actual cumulative spending). The dot at the end of the solid line is today. Category bars are **green** when you are on pace, **yellow to orange** when you are on pace to go over, and **red** once the budget is exceeded. **Outlined (unfilled)** portions of a bar show expected spending from recurrings that have not been paid yet; solid portions are money already spent.
- **How it works**: Copilot does not publish the exact formula. The documented behaviour matches a linear pace: `ideal_to_date = budget × day_of_month / days_in_month`, compared with actual spending to date including committed recurrings. With budgeting turned off ("Optional budgeting"), the same chart compares this month with **last month**: the dotted line becomes last month's total spread evenly, and a projection says whether you will end above or below it.
- **Why it helps**: "80% spent" on the 25th and on the 5th mean very different things. Pace answers "am I OK _for today_?". **Usefulness: High.**

### Rebalance budgets

- **What it does**: one button that redistributes category budgets to match reality when some categories run far over or under.
- **How it works**: a button sits at the bottom of the Categories tab on iPhone and at the top on Mac/iPad. It previews the suggested new amounts (the algorithm is not documented, and the total budget is kept). You choose **"Only this month"** or **"From now on"** (this month and future months, except months you have already customised), then Save. An earlier version could also revert budgets to the original amounts when the month ends.
- **Why it helps**: fixes an unrealistic budget in seconds instead of making the user edit 15 numbers. That kind of editing is where many people give up. **Usefulness: High.**

### Budgets from history, per-month edits and optional budgeting

- **What it does**: onboarding builds initial budgets from your past spending. You can then change a budget for one month only, or turn budgeting off entirely.
- **How it works**: budgets are "same for all months" by default, with per-month overrides. Budget amounts at $0 hide the bar. With budgeting off, rebalancing is disabled and categories compare with the previous month. Excluded categories stay excluded either way. The Categories tab shows totals for the year and the **average monthly spend**, which is the sum of _completed_ months divided by their count; the current month is excluded and the value updates on the 1st.
- **Why it helps**: users get a sensible starting budget, and people who hate budgets still get month-over-month feedback. **Usefulness: High.**

### Recurrings

- **What it does**: tracks bills and subscriptions, shows the next expected date, and counts them as already spent within the month.
- **How it works**: recurrings are created from existing transactions (you cannot create one from scratch), either on the Recurrings view (+, search, pick one or more transactions) or from a transaction (Recurring › New). Frequencies are weekly, bi-weekly, monthly or non-monthly, and Copilot guesses the frequency from history. Matching uses **filters**: a name fragment (for example "Uber" to catch "Uber One" and "Uber Pass"), an **amount range** ("$9 to $10") and a date window ("around the 23rd"). Amount ranges let you keep several recurrings for one merchant (two different "Apple" subscriptions). Matched transactions get an [R] label and take the recurring's display name. Recurring transactions cannot be marked excluded. Recurring income is not supported.
- **Why it helps**: shows committed money before it leaves and catches price increases. **Usefulness: High.**

### Rollovers

- **What it does**: carries leftover or overspent budget into the next month.
- **How it works**: you turn it on globally in Settings and pick a **first month with rollover**. From then on rollovers are **cumulative**, so surpluses and overspending both accumulate. You can switch rollover off per category (for example a fixed internet bill). Editing a month's budget changes the following rollovers. Switching rollovers off globally turns everything back into independent monthly budgets.
- **Why it helps**: smooths lumpy categories and supports sinking funds. **Usefulness: High.**

### Savings goals (Active → Ready to spend → Archived)

- **What it does**: pools of money you save into and later spend through categories, kept apart from spending so Cash Flow stays correct.
- **How it works**: a goal has a name, emoji, target amount and starting balance. You can allocate part of an account balance by dragging a bar, or tick "Always use the entire balance". Tracking is either **by target date** (Copilot computes the monthly amount, and the last day of the target month counts as on time) or **by monthly contribution** (Copilot projects the finish date). Goal progress is monthly: green means on track, yellow means behind. The states are **Active**, **Ready to spend** (target reached; spending transactions can be linked to the goal) and **Archived**. The option **"Reactivate when funds dip"** moves a goal back to Active when spending takes it under target, which suits sinking funds. The option **"Update budgets on spend"** shows goal-funded spending as separate **blue bars** in categories that do not count toward the monthly budget; when it is off, that spending counts like any other.
- **Why it helps**: a clean answer to "I saved for the vacation, now I spend it without breaking my budget". **Usefulness: High.**

### Splits (including spread over months)

- **What it does**: splits a transaction into parts, or spreads one payment across several months.
- **How it works**: the web split tool, rebuilt in June 2026, offers equal, custom-amount and percentage splits, with shortcuts to divide across multiple transactions or to spread over 3, 6 or 12 months. The original unsplit amount is kept.
- **Why it helps**: an annual insurance premium paid in March can count 1/12 per month, which keeps charts honest. **Usefulness: Medium.**

### Money Assistant and MCP (2026)

- **What it does**: an AI assistant (beta since April 2026) that flags activity, suggests budget changes, has an adjustable tone and draws charts in chat. MCP (beta since May 2026) gives Claude or ChatGPT read-only access to spending, budgets and accounts.
- **Why it helps**: convenience for power users. **Usefulness: Low** for our target user today.

## Fit for CoinKeeper

| Feature                                                             | Usefulness for our user | Model changes?                                                                             | API / services                                                                   | UI changes                                                                            | Effort (S/M/L)       | Priority (Now/Next/Later/Skip)       |
| ------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------- | ------------------------------------ |
| Pace-aware budget status + spending line                            | High                    | No                                                                                         | Budget service returns `expected_to_date`, `projected_end` per category/currency | Budget bars get pace colours; dashboard month-to-date chart with ideal vs actual line | S                    | Now                                  |
| Rebalance budgets (this month / from now on)                        | High                    | Maybe `budgets` already per month; add "apply forward" logic                               | `POST /budgets/rebalance/preview` + apply                                        | Rebalance dialog on the Budget page                                                   | M                    | Next                                 |
| Budgets suggested from history (avg of completed months)            | High                    | No                                                                                         | Suggestion query (avg of last N completed months, per currency)                  | "Suggest" button when creating or copying budgets                                     | S                    | Now                                  |
| Smarter review inbox (confidence, top-2 suggestions, learned badge) | High                    | Maybe `transactions.category_source` enum (`manual`, `rule`, `payee_default`, `suggested`) | Suggestion service using payee history + rules                                   | Top-2 chips in the review row; badge for auto-applied categories                      | M                    | Next                                 |
| Recurrings counted as committed spend (outlined bar)                | High                    | Needs recurring series (see Monarch/Lunch Money docs)                                      | Budget service adds expected unpaid occurrences                                  | Two-tone bars                                                                         | M (after recurrings) | Next                                 |
| Optional budgeting (compare with last month)                        | Medium                  | `user_settings.budgets_enabled`                                                            | Month-over-month comparison query                                                | Budget page fallback view                                                             | S                    | Later                                |
| Goals: Ready to spend, reactivate on dip, spending shown separately | High                    | Extends `goals` (status, `reactivate_on_dip`) + `goal_spends` link                         | Goals service                                                                    | Goal state chips; blue "from goal" bar segment                                        | M                    | Next (with goals)                    |
| Split / spread over months                                          | Medium                  | Split lines table (see Lunch Money doc)                                                    | Split service                                                                    | Split editor                                                                          | M–L                  | Later                                |
| Personal ML model                                                   | Medium                  | Model store                                                                                | ML pipeline                                                                      | none                                                                                  | L                    | Skip (use deterministic suggestions) |
| AI assistant / MCP                                                  | Low                     | No                                                                                         | LLM                                                                              | Chat                                                                                  | L                    | Skip                                 |

### Pace-aware budget status and the spending line

- **What is it for?** It tells a non-expert whether today's spending is fine _given the day of the month_. Our current statuses (On track below 80%, Near limit from 80%, Exceeded above 100%) ignore time. On the 5th, 70% spent is alarming, yet we show it as "On track". Pace fixes this with zero extra input. High value.
- **Should we modify the models?** No. Everything derives from `budgets` and the ledger. Add pure helpers in `packages/shared/src/lib/` (all in integer minor units, with integer division and explicit rounding):
  - `expectedSpendToDate(budgetMinor, dayOfMonth, daysInMonth)`, which returns `floor(budget × day / days)`;
  - `projectedMonthEnd(spentMinor, dayOfMonth, daysInMonth)`, which returns `round(spent × days / day)`;
  - `paceStatus(spent, budget, expected, projected)`: `exceeded` if spent > budget, `over_pace` if projected > budget, otherwise `on_pace`. We can keep `near_limit` for ≥ 80% as a secondary label.
- **Should we improve the UI?** Budget rows get a thin marker at the "ideal today" position and pace-coloured bars. The colour must not be the only signal, so a status label goes next to it. The dashboard gains a month-to-date line chart per currency with a dotted ideal line (Recharts `ReferenceLine`/second `Line`). For past months, pace is irrelevant, so only final status shows.
- **How to implement**: (1) shared helpers + unit tests (month lengths, leap years, day 1, the user's time zone from locale settings); (2) extend the budget response with `expectedToDateMinor`, `projectedMinor` and `paceStatus`; (3) a daily cumulative spending query (`SUM() OVER (ORDER BY date)` per currency) for the chart; (4) UI. **Risks**: linear pacing is wrong for categories paid once a month (rent). Apply pace only to "flex" categories, or treat fixed categories as spent on their due date. This ties in with the Monarch buckets and recurrings.

### Rebalance budgets

- **What is it for?** Keeping a budget realistic without a spreadsheet session. When groceries run €80 over and restaurants €60 under, one tap moves the limits and keeps the total. High value, because stale budgets are the main reason people stop budgeting.
- **Should we modify the models?** Not required: `budgets` already holds one row per category, month and currency. "From now on" means writing the new amount into the current month and every future month that has no explicit row. We may add `budgets.source` enum `manual | copied | rebalanced` for audit and undo. Rebalancing works only within one currency.
- **Should we improve the UI?** Add a "Rebalance" button on the Budget page that opens a preview table (category, current limit, spent, suggested limit, delta), a scope toggle (This month / From now on) and Apply, with undo through our existing undo pattern.
- **How to implement**: suggested limit = `max(spent_to_date, projected_month_end)` for over-pace categories, with the surplus taken proportionally from categories whose projected spend is under their limit, keeping `Σ limits` constant. Put it in a shared pure function with tests, then a preview endpoint and an apply endpoint. **Open questions**: should fixed and non-monthly categories be locked out of rebalancing? (Probably yes.) How should this interact with rollover? Rebalancing the current month changes the next month's carry, which is correct but should be shown.

### Smarter review inbox

- **What is it for?** Making categorisation after a CSV import as quick as Copilot's review flow, without a black-box ML model.
- **Should we modify the models?** Add `transactions.category_source` enum `manual | rule | payee_default | suggestion | import` (nullable for legacy rows). Optionally add `rules.hit_count` for ranking. Keep `needs_review` as it is.
- **Should we improve the UI?** Each review row shows the chosen category plus **two suggestion chips**, ranked from the payee's history, matching rules and similar amounts. A small badge shows _why_ a category was chosen ("rule: Uber", "usual for this payee"). Add keyboard shortcuts for fast clearing and a "clear all with suggestions" bulk action.
- **How to implement**: a suggestion service that scores categories by payee frequency over the last N transactions, then rule matches, then the category distribution for similar `original_payee` tokens; confidence = top score share, and auto-apply only above a threshold (for example ≥ 0.8), otherwise suggest. Tests for determinism. **Risks**: wrong auto-applies erode trust, so suggestions must be undoable and the badge must be visible.

## What not to copy

- **US-only bank sync as the only data path, no CSV import**: our base is manual entry + CSV. Copilot's lack of import is a gap, not a model.
- **Apple-only native apps**: excludes most of the world's phone users. We stay web-first and responsive.
- **No household plan (pay twice for two people)**: a pricing choice that users criticise.
- **Card-required trial with auto-renewal and a large monthly-vs-annual gap ($13 vs $7.92)**: users call it a "price trap".
- **Recurring transactions that can never be excluded, and income that cannot be categorised**: rigid rules that confuse users. Our `excluded` flag and income categories are better.
- **Per-user opaque ML model**: hard to explain and debug. Deterministic, explainable suggestions fit our transparency better.
- **Investment benchmarking, Venmo/Amazon/Zillow integrations**: US-specific services.
- **Sending financial data to third-party AI tools (MCP) by default**: privacy risk that is off-mission for a first version.

## Sources

- [Copilot Help – Quick Start Guide](https://help.copilot.money/en/articles/11157550-quick-start-guide)
- [Copilot Help – Copilot Intelligence for Spending](https://help.copilot.money/en/articles/8182433-copilot-intelligence-for-spending)
- [Copilot Help – Transaction Types](https://help.copilot.money/en/articles/3971267-transaction-types)
- [Copilot Help – Transactions FAQ](https://help.copilot.money/en/articles/10761907-transactions-faq)
- [Copilot Help – Transactions Tab Overview](https://help.copilot.money/en/articles/9554412-transactions-tab-overview)
- [Copilot Help – Categories FAQ](https://help.copilot.money/en/articles/10216528-categories-faq)
- [Copilot Help – Categories Tab Overview](https://help.copilot.money/en/articles/9504513-categories-tab-overview)
- [Copilot Help – Dashboard Tab Overview](https://help.copilot.money/en/articles/6045480-dashboard-tab-overview)
- [Copilot Help – Cash Flow Tab Overview](https://help.copilot.money/en/articles/9682232-cash-flow-tab-overview)
- [Copilot Help – Understanding Key Metrics for Spending](https://help.copilot.money/en/articles/6918427-understanding-key-metrics-for-spending)
- [Copilot Help – Rebalancing Your Budget](https://help.copilot.money/en/articles/6206302-rebalancing-your-budget)
- [Copilot Help – Budget Rollovers](https://help.copilot.money/en/articles/3790828-budget-rollovers)
- [Copilot Help – Optional Budgeting](https://help.copilot.money/en/articles/6282850-optional-budgeting)
- [Copilot Help – Editing Budgets by Month](https://help.copilot.money/en/articles/6206293-editing-budgets-by-month)
- [Copilot Help – Creating Recurrings](https://help.copilot.money/en/articles/3760068-creating-recurrings)
- [Copilot Help – Optimizing Recurrings](https://help.copilot.money/en/articles/3783499-optimizing-recurrings)
- [Copilot Help – Recurrings FAQ](https://help.copilot.money/en/articles/10244751-recurrings-faq)
- [Copilot Help – Creating New Goals](https://help.copilot.money/en/articles/11100462-creating-new-goals)
- [Copilot Help – Savings Goal Tab Overview](https://help.copilot.money/en/articles/11470324-savings-goal-tab-overview)
- [Copilot Help – Spending from Savings Goals](https://help.copilot.money/en/articles/11100511-spending-from-savings-goals)
- [Copilot Help – Goals FAQ](https://help.copilot.money/en/articles/11139571-goals-faq)
- [Copilot Help – Understanding Manual Accounts](https://help.copilot.money/en/articles/10682991-understanding-manual-accounts)
- [Copilot Help – Exporting Your Transaction Data](https://help.copilot.money/en/articles/5944414-exporting-your-transaction-data)
- [Copilot Money – Home page (pricing, platforms, awards)](https://www.copilot.money/)
- [Releasebot – Copilot Money release notes 2025–2026](https://releasebot.io/updates/copilot-money)
- [Copilot on X – Rebalance can revert budgets after the month](https://x.com/copilotmoney/status/1534934801135845376)
- [Money with Katie – Copilot review (updated 2026)](https://moneywithkatie.com/copilot-review-a-budgeting-app-that-finally-gets-it-right/)
- [FinCompareLab – Copilot Money review (couples pricing, regions)](https://www.fincomparelab.com/reviews/copilot-money-review/)
- [Finny – Copilot Money pricing 2026](https://getfinny.app/blog/copilot-money-pricing-2026)
- [Engadget – The best budgeting apps for 2026](https://www.engadget.com/apps/best-budgeting-apps-120036303.html)
- [Team Blind – user discussion of Copilot vs alternatives](https://www.teamblind.com/post/empower-per-vs-monarch-vs-copilot-dg33qmaw)
