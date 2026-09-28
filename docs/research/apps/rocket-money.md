# Rocket Money

> Summary: Rocket Money, the US bank-sync-first app built around finding the leaks: subscription and bill detection, cancellation and negotiation, budgets, goals and alerts, and why ledger-based recurring detection, left-after-bills budgeting and price-increase or duplicate-charge alerts are worth borrowing.

## At a glance

|                     |                                                                                                                                                                                                                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type                | Subscription and bill manager with budgeting, net worth and an AI agent (Rowan)                                                                                                                                                                                                                 |
| Platforms           | iOS, Android; web app for Premium members only                                                                                                                                                                                                                                                  |
| Pricing (2026)      | Free (3 category budgets, subscription list, bill negotiation with success fee). Premium: "pay what you think is fair", $7–$14/month, 7-day trial. Premium+: $15/month, adds the Rowan AI agent and fee-free bill negotiation. Bill negotiation for Free/Premium: 35–60% of first-year savings. |
| Regions / bank sync | US only; Plaid connections to about 12,000 US institutions                                                                                                                                                                                                                                      |
| Data entry          | Sync first; manual transactions are a Premium feature; manual recurring bills mobile-only                                                                                                                                                                                                       |
| Best for            | Hands-off US users who want to stop paying for forgotten subscriptions and do not want to budget in detail                                                                                                                                                                                      |

Recent changes: Truebill was acquired by Rocket Companies and rebranded Rocket Money. Smart Savings was renamed **Financial Goals** in 2025. On **25 August 2026** Rocket Money launched **Rowan**, an SMS-based AI agent built with Anthropic. It watches spending, texts you when it spots savings, and can cancel subscriptions, renegotiate bills and set up automatic savings transfers on request. It is sold in the new **Premium+** tier ($15/month), first to selected subscribers, with wider rollout promised for later in 2026.

## What makes it special

Rocket Money's philosophy is that most people don't lose money through big decisions. They lose it through leaks: subscriptions they forgot, bills that creep up, fees nobody noticed. The app is designed to find those leaks automatically once a bank account is linked, and then to _act_ on them. It offers a cancellation concierge, a bill-negotiation team and now an AI agent. Rocket Money says the concierge has cancelled nearly 2.5 million subscriptions, and one testimonial on its site describes finding almost $50 a month in unused subscriptions.

Users praise the automatic subscription list, a clean and beginner-friendly dashboard, and one-tap cancellation. A June 2026 newspaper review called it arguably the best app for finding hidden recurring costs. The reviewers also cut an internet bill from $90 to $50 through negotiation. As of 2026 the app is rated about 4.5 on the App Store (285k+ ratings) and 4.6 on Google Play, but only about 3.3 on Trustpilot (Wall Street Survivor review).

People leave because of money-taking friction. Common complaints:

- Negotiation fees of 35–60% of first-year savings that users say they didn't realise they had agreed to.
- Difficulty cancelling Premium, or charges after cancellation.
- Email-only support.
- No way to use the app without linking a bank.
- Budgeting that reviewers describe as shallow next to YNAB (budgets are limits; rollover is not documented in the help center).

## Strongest feature

**Automatic subscription and bill detection (the Recurring tab).** Everything else in the app starts from the recurring list: cancellation, negotiation, bill reminders, price-increase alerts, "amount left after bills" in the budget, and Rowan's proactive texts. The Recurring tab has three views: Upcoming (a calendar of the next two weeks), All, and Inactive (items with no payment detected in the past month, which move back to Active when a new payment appears).

For our target user this matters a lot. "Where is my money going and what am I paying every month without thinking?" is the first question a non-expert asks. Rocket Money runs detection over bank feeds. CoinKeeper can run the same detection over its own ledger, which works just as well for CSV imports and manual entries.

## Feature deep dive

### Recurring (subscriptions and bills)

- **What it does**: Lists every subscription and bill with its amount and next due date. It shows what is due in the next two weeks and flags items that stopped charging.
- **How it works**:
  - Rocket Money says it analyses transactions from linked accounts "using advanced algorithms". The exact thresholds (minimum occurrences, interval tolerance) are not published (unverified).
  - Users can edit the next due date and bill amount.
  - Adding a manual bill (mobile only): tap "+" in Recurring, pick a known service or create a custom one, search for and attach related transactions, adjust billing details, save.
  - Manually added items are removed via Options → Edit → Remove From List.
  - Items move to **Inactive** automatically when no payment has been detected for a month.
  - Missing items are usually blamed on unlinked or unsupported accounts, or on sync delays.
- **Why it helps**: It makes fixed costs visible, which is where people find money to cut. Usefulness: **High**.

### Subscription cancellation concierge

- **What it does**: Premium users ask Rocket Money to cancel a subscription and staff (and now Rowan) contact the merchant.
- **How it works**: Pick a subscription and request cancellation. The team works with the provider, which requires sharing account details with the merchant. It is a Premium feature. Rocket Money claims about 2.5 million cancellations.
- **Why it helps**: It removes the effort of cancelling. But it depends on US merchant relationships and on handing over credentials. Usefulness for us: **Low** (we can link to a merchant's cancellation page at most).

### Bill negotiation

- **What it does**: Staff call internet, cable, phone and security providers to get discounts or credits.
- **How it works**:
  - The fee is 35–60% of the **annualised first-year savings**, and the user picks the percentage.
  - Nothing is charged if nothing is saved.
  - Savings usually appear within 1–2 billing cycles.
  - The fee is charged 48 hours after completion unless a payment plan is set up.
  - Premium+ removes the fee.
- **Why it helps**: Real savings for US households, but it is a fee-taking service and a frequent source of complaints. Usefulness: **Low** (region-specific; conflicts with our principles).

### Budgets ("left after bills")

- **What it does**: A monthly plan built from income, fixed bills and discretionary category budgets.
- **How it works**:
  - Income is estimated from deposits and can be edited.
  - **Bills & Utilities** is pre-filled from the recurring list; the user can add or remove services.
  - Category budgets are suggested from past spending.
  - The screen shows **Total budget = bills + Σ category limits**, **Amount left after bills = income − bills**, and **Projected savings = income − bills − category budgets** ("what you'll save if you hit your budget").
  - Amounts are adjusted with sliders and +/−, and every estimate can be traced to its transactions.
  - Free users get up to 3 category budgets; Premium gets unlimited budgets and custom categories.
  - Rollover appears in marketing copy but is not documented in the help center (unverified).
- **Why it helps**: It links fixed costs to discretionary spending in one view. That is exactly what a non-expert lacks. Usefulness: **High**.

### Financial Goals (formerly Smart Savings)

- **What it does**: Automatically moves money from checking into savings goals.
- **How it works**:
  - Two modes. **Smart Savings (autopilot)** transfers varying amounts every few days based on the checking balance, at a Comfy, Moderate or Aggressive level. **Custom Savings** makes small, frequent transfers that add up to roughly a chosen monthly amount.
  - Money is held in a non-interest-bearing FBO custodial account at an FDIC-insured partner bank.
  - Goals have a target date, can be paused, and pause automatically when the target is reached.
  - Settings are mobile-only.
- **Why it helps**: It automates "pay yourself first". The money-movement part needs a US bank partner. The _goal tracking_ part (target, date, progress) is universal. Usefulness: **High** for goals; **Low** for money movement.

### Alerts and notifications

- **What it does**: Warns about overdraft fees, interest charges, late fees, upcoming annual fees, **subscription price increases**, **duplicate charges**, **large transactions** and **low balance**.
- **How it works**:
  - The low-balance alert is created automatically at a $200 threshold and can be customised.
  - Channels are email, push and in-app banners, each toggled per alert type in settings.
  - Price-increase alerts fire when a known subscription charges more than before.
- **Why it helps**: It catches problems when they happen instead of at month end. Price-increase and duplicate-charge alerts can be computed from our ledger. Fee alerts would need a "fees" category. Usefulness: **High** (subset).

### Transaction rules

- **What it does**: Automatically changes transactions that match a rule.
- **How it works**:
  - Conditions match on transaction description (name) and/or amount.
  - Actions: change category, **assign to a bill**, **ignore from budget**, **rename**, **tag**.
  - Premium-only. Found under Settings → Categories, Tags & Rules (mobile) or Settings → Transaction Rules (web).
  - Whether rules apply retroactively is not documented.
- **Why it helps**: Recurring Venmo or Zelle payments can become "Rent" or "Daycare" and be linked to a bill. Usefulness: **Medium** (CoinKeeper already has category rules; the extra actions are the lesson).

### Net worth and credit

- **What it does**: Assets minus liabilities, updated automatically (Premium), including a live home-value estimate. There is also a weekly FICO Score 2 from Experian.
- **How it works**: Sums linked account balances, plus a property valuation feed.
- **Why it helps**: Net worth is useful and CoinKeeper already has it per currency. Credit scores and home valuations are US-specific. Usefulness: **Low** (beyond what we already have).

### Rowan AI agent (Premium+, August 2026)

- **What it does**: An agent that works over SMS. It texts when it spots savings (a forgotten subscription before it renews, a bill creeping up). The user replies in plain language and Rowan acts: cancel, negotiate, set up savings such as round-ups.
- **How it works**: Built on Anthropic models. Rocket Money describes a stack of agents plus deterministic code "where certainty is required". Available to selected Premium+ subscribers now.
- **Why it helps**: It shows where the category is heading: proactive, conversational coaching. For CoinKeeper the useful part is **proactive insight generation**. The action-taking needs integrations we don't have. Usefulness: **Medium** (later).

## Fit for CoinKeeper

| Feature                                                             | Usefulness for our user | Model changes?                                                   | API / services                               | UI changes                                                          | Effort (S/M/L) | Priority (Now/Next/Later/Skip) |
| ------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------- | -------------- | ------------------------------ |
| Recurring detection over the ledger (subscriptions + bills)         | High                    | New `recurring_series` table; `transactions.recurring_series_id` | Detection service + CRUD routes              | New Recurring screen (Upcoming/All/Inactive), badge on transactions | M              | Now                            |
| Upcoming bills and "left after bills" in budgets                    | High                    | None beyond recurring                                            | Budget summary endpoint gains `committed`    | Budget header: income, bills, budgets, projected savings            | S              | Next                           |
| Price-increase / duplicate / new-subscription alerts                | High                    | `insights` table (derived, dismissible)                          | Insight generator job or on-read computation | Insights inbox / dashboard card                                     | M              | Next                           |
| Savings goals (tracking only, no money movement)                    | High                    | `goals` table                                                    | Goals CRUD + progress query                  | Goals screen, dashboard widget                                      | M              | Next                           |
| Richer rule actions (rename payee, exclude, link to recurring, tag) | Medium                  | Extend `rules` with action columns                               | Rule engine                                  | Rule editor                                                         | S              | Next                           |
| Low-balance alert per account                                       | Medium                  | `accounts.low_balance_threshold_minor`                           | Computed on read                             | Account card warning                                                | S              | Later                          |
| AI agent / chat over the ledger                                     | Medium                  | Chat history table (later)                                       | LLM integration with tool calls              | Chat panel                                                          | L              | Later                          |
| Cancellation concierge                                              | Low                     | —                                                                | —                                            | Link to merchant's cancel page at most                              | —              | Skip                           |
| Bill negotiation                                                    | Low                     | —                                                                | —                                            | —                                                                   | —              | Skip                           |
| Credit score, home value                                            | Low                     | —                                                                | —                                            | —                                                                   | —              | Skip                           |

### Recurring detection (subscriptions and bills)

- **What is it for, and how useful is it?** It answers "what am I committed to paying every week, month and year?" It surfaces forgotten subscriptions and lets budgets subtract committed costs. It is the single most useful thing Rocket Money does, and it needs no bank sync: three CSV imports or three months of manual entry are enough to find a monthly pattern.
- **Should we modify the models?** Yes. Proposed tables and columns (money stays integer minor units, everything per user, soft delete):
  - `recurring_series`: `id`, `user_id`, `name`, `payee_id` (nullable), `match_pattern` (nullable, case-insensitive substring on `original_payee` for payees not yet normalised), `account_id` (nullable), `category_id` (nullable), `currency`, `kind` enum `subscription | bill | income`, `cadence` enum `weekly | biweekly | four_weekly | monthly | bimonthly | quarterly | semiannual | yearly | custom`, `interval_days` (for `custom`), `expected_amount_minor` (signed), `amount_min_minor` and `amount_max_minor` (tolerance band, like Emma's min/max), `anchor_date`, `next_due_date` (derived; could also be computed on read), `status` enum `suggested | active | inactive | dismissed | cancelled`, `source` enum `detected | manual`, `cancelled_at`, `created_at`, `updated_at`, `deleted_at`.
  - `transactions.recurring_series_id` (nullable FK). Occurrences are always real ledger rows. The series only describes the expected pattern, so there is no cached balance.
  - Price history is derived on read from linked transactions (amount by date), so there is no extra table.
- **Should we improve the UI?** Yes:
  - A new **Recurring** screen with tabs **Upcoming** (next 14/30 days, grouped by date), **All** (monthly-equivalent cost per item, total per currency) and **Inactive**.
  - A **Suggested** banner ("We found 4 possible subscriptions: confirm or dismiss").
  - A series detail page with a payment-history sparkline and a price-change marker.
  - A small "recurring" chip in the transactions list.
  - An option to create a series from a transaction ("Make this recurring").
- **How to implement it**:
  1. Add the migration and shared Zod contracts.
  2. Put a pure cadence classifier in `packages/shared/src/lib/recurrence.ts`.
  3. Write the detection query (below), run it on demand and after each CSV import, and insert new candidates as `suggested`.
  4. Link matching transactions: same payee (or pattern), same currency, amount within the band, date within ±N days of the expected date.
  5. Add CRUD routes and "confirm/dismiss/cancel".
  6. Add a monthly-equivalent total per currency.

  The detection sketch:

  ```sql
  WITH outflows AS (
    SELECT COALESCE(t.payee_id::text, lower(trim(t.original_payee))) AS payee_key,
           t.currency, t.date, -t.amount_minor AS amount_minor
    FROM transactions t
    WHERE t.user_id = $1 AND t.kind = 'standard' AND t.amount_minor < 0
      AND t.deleted_at IS NULL AND NOT t.excluded
      AND t.date >= current_date - 400
  ), gaps AS (
    SELECT *, date - LAG(date) OVER w AS gap_days
    FROM outflows WINDOW w AS (PARTITION BY payee_key, currency ORDER BY date)
  )
  SELECT payee_key, currency, count(*) AS n,
         percentile_cont(0.5) WITHIN GROUP (ORDER BY gap_days) AS median_gap,
         percentile_cont(0.5) WITHIN GROUP (ORDER BY amount_minor) AS median_amount,
         stddev_pop(amount_minor) / NULLIF(avg(amount_minor), 0) AS amount_cv,
         max(date) AS last_date
  FROM gaps GROUP BY payee_key, currency
  HAVING count(*) >= 3;
  ```

  Then, in TypeScript:
  - Map `median_gap` to a cadence window: 6–8 days weekly, 13–16 biweekly, 27–32 monthly, 58–63 bimonthly, 85–95 quarterly, 175–190 semiannual, 350–380 yearly. Yearly needs n ≥ 2.
  - Require at least 70% of the gaps to fall inside the window.
  - `amount_cv ≤ 0.05` → `subscription` (fixed price); `≤ 0.35` → `bill` (variable); otherwise reject.
  - `next_due = last_date + cadence`.
  - `inactive` when `today > next_due + max(7, 0.5 × interval)` days.
  - Income series are detected the same way with `amount_minor > 0`.

- **Risks and open questions**:
  - Payee normalisation quality: the same merchant can appear under different CSV descriptions. Mitigate with our payees table plus fuzzy grouping later.
  - Groceries at the same shop weekly will look recurring. Mitigate with the variance limit, an optional category allow-list (subscriptions, utilities, insurance, housing) and always-suggest-never-auto-confirm.
  - Series must never be summed across currencies.
  - Deleting a series soft-deletes it and unlinks nothing destructively.

### Upcoming bills and "left after bills" budgeting

- **What is it for, and how useful is it?** It turns budgets from "limits per category" into a plan: income − committed bills − category budgets = projected savings. That is Rocket Money's budget header, and it gives users one understandable number. Usefulness: **High**.
- **Should we modify the models?** No new tables beyond `recurring_series`. Optionally add `user_settings.expected_monthly_income_minor` per currency, or derive expected income from `recurring_series` of kind `income`.
- **Should we improve the UI?** Yes. The Budgets page gets a header strip: **Income (expected / received)**, **Bills (paid / still due this month)**, **Budgeted**, **Projected savings**. The dashboard gets an "Upcoming this week" list.
- **How to implement it**:
  1. Build a budget summary service that returns, per currency: `income_received`, `income_expected` (active income series due this month and not yet matched), `bills_paid` (linked transactions this month), `bills_due` (active series with an expected date this month and no linked transaction yet), `budgeted` (Σ budgets), and `projected_savings = max(income_expected, income_received) − (bills_paid + bills_due) − budgeted`.
  2. Everything is computed in SQL on read.
- **Risks**: Double counting when a bill's category also has a budget. Rocket Money and PocketGuard both tell users not to budget bill categories. We could exclude categories linked to active series from the "budgeted" sum, or warn the user.

### Subscription insights and alerts (price increase, duplicate, new, inactive-but-charging)

- **What is it for, and how useful is it?** It gives the "stop wasting money" nudges without bank sync. Usefulness: **High**.
- **Should we modify the models?** Add an `insights` table: `id`, `user_id`, `type` enum `price_increase | duplicate_charge | new_recurring | large_transaction | bill_due_soon`, `transaction_id` and `recurring_series_id` (nullable), `currency`, `amount_minor`, `previous_amount_minor`, `detected_at`, `dismissed_at`, `deleted_at`. It stores derived facts only, is regenerable and never a source of truth.
- **Should we improve the UI?** Yes. Add an "Insights" card on the dashboard and a badge in the nav. Each insight links to the transaction or series and has a Dismiss action.
- **How to implement it** (heuristics):
  - **Price increase**: a new transaction linked to a series has `amount > median(previous 3) × 1.02` and a difference of at least 1 minor-unit threshold.
  - **Duplicate**: same payee, same currency, same amount, within 3 days, both `standard` and not a transfer.
  - **Large transaction**: `|amount| > max(3 × median outflow for that category over 6 months, user threshold)`.
  - **New recurring**: a series became `suggested` in this run.
  - Generate after CSV import and on transaction create.
  - Risk: alert fatigue. Emma is criticised for notification overload, so start in-app only and keep it dismissible.

## What not to copy

- **Bill negotiation for a success fee (35–60% of first-year savings)**: US-only provider deals, a fee-taking model and a major source of complaints.
- **"Pay what you think is fair" pricing with opaque tiers**: reviewers call it unclear. We should be transparent.
- **Cancellation concierge**: needs merchant relationships and user credentials for third-party services, which conflicts with our credential-safety stance.
- **Mandatory bank linking (Plaid)**: our base is manual + CSV, and the app must work worldwide.
- **Custodial savings accounts (FDIC FBO)**: requires a US banking partner and makes us a money transmitter.
- **FICO score and home-value estimates**: US-specific data feeds.
- **Paywalling manual transactions and the web app**: for us, manual entry is the core, not an upsell.
- **An agent that acts via SMS without in-app review**: it moves money and cancels services outside our audit trail. Any AI features should be read-only and suggest actions.
- **Default $200 low-balance alert**: a hard-coded USD threshold. Thresholds must be per account and per currency.

## Sources

- [Rocket Money pricing: Free vs Premium vs Premium+ (Jan 2026)](https://www.rocketmoney.com/learn/personal-finance/how-much-does-rocket-money-cost)
- [Help: Managing your bills and subscriptions](https://help.rocketmoney.com/en/articles/2185531-managing-your-bills-and-subscriptions)
- [Help: Missing subscriptions](https://help.rocketmoney.com/en/articles/934383-missing-subscriptions)
- [Help: Where can I view my subscriptions and bills?](https://help.rocketmoney.com/en/articles/3117398-where-can-i-view-my-subscriptions-and-bills)
- [Help: Creating a Budget](https://help.rocketmoney.com/en/articles/2649810-creating-a-budget)
- [Help: Financial Goals overview](https://help.rocketmoney.com/en/articles/2620940-financial-goals-overview)
- [Help: Your new home for savings: Financial Goals](https://help.rocketmoney.com/en/articles/10446041-your-new-home-for-savings-financial-goals)
- [Help: Creating transaction rules](https://help.rocketmoney.com/en/articles/10328100-creating-transaction-rules)
- [Help: Bill Negotiation savings process](https://help.rocketmoney.com/en/articles/9744501-bill-negotiation-savings-process)
- [Help: Bill Negotiation charge explained](https://help.rocketmoney.com/en/articles/9744474-bill-negotiation-charge-explained)
- [Help: How to customize a low balance alert](https://help.rocketmoney.com/en/articles/8418019-how-to-customize-a-low-balance-alert)
- [Help: Updating your notification settings](https://help.rocketmoney.com/en/articles/934668-updating-your-notification-settings)
- [Rocket Money: Manage subscriptions feature page](https://www.rocketmoney.com/feature/manage-subscriptions)
- [Rocket Money FAQ](https://www.rocketmoney.com/faq)
- [PR Newswire: Rocket Money's Rowan (Aug 2026)](https://www.prnewswire.com/news-releases/rocket-moneys-rowan-rewrites-what-ai-can-do-in-personal-finance-302859522.html)
- [FinTech Global: Rocket Money launches AI agent (Sep 2026)](https://fintech.global/2026/09/03/rocket-money-launches-ai-agent-to-manage-finances/)
- [The Spokesman-Review: Does Rocket Money actually help you save cash? (Jun 2026)](https://www.spokesman.com/stories/2026/jun/09/does-rocket-money-actually-help-you-save-cash/)
- [Wall Street Survivor: Is Rocket Money worth it? (ratings, complaints)](https://www.wallstreetsurvivor.com/is-rocket-money-worth-it/)
- [FinCompareLab: Rocket Money pricing and hidden fees](https://www.fincomparelab.com/guides/rocket-money-pricing/)
- [The Motley Fool: Rocket Money promises to make budgeting easy](https://www.fool.com/money/banks/articles/rocket-money-promises-to-make-budgeting-easy-does-it-deliver)
- [CB Insights: Truebill company profile](https://www.cbinsights.com/company/truebill)
