# Goodbudget

> Summary: Goodbudget, the manual-first digital envelope system shared across a household: envelopes, Available, annual and goal envelopes and fills, and why the spending-pace line, due-date fill formula and add-versus-set rollover choice are worth borrowing for CoinKeeper.

## At a glance

|                     |                                                                                                                                                                                                                                                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type                | Digital envelope budgeting (cash-envelope metaphor), manual-first                                                                                                                                                                                                                                                                            |
| Platforms           | Web, iPhone, Android                                                                                                                                                                                                                                                                                                                         |
| Pricing (2026)      | **Free forever**: 10 regular envelopes + 10 more (Annual/Goal) envelopes, 2 devices, 1 year of history. **Premium**: US$10/month or US$80/year for unlimited envelopes, 5 devices, 7 years of history and bank sync. Third-party reviews also say the free plan allows only 1 account (not shown on the official plan table, so unverified). |
| Regions / bank sync | Bank sync (Premium, via Plaid) is documented as **US only**. The changelog lists "Plaid International" in September 2025, but the help page was not updated (unverified). Otherwise, manual entry or file import (QFX/OFX; CSV mentioned for advanced users).                                                                                |
| Data entry          | Manual first; file import; Premium bank sync with a "Need to Confirm" queue and a Match tool                                                                                                                                                                                                                                                 |
| Best for            | Couples and families who want a simple shared envelope budget without linking banks                                                                                                                                                                                                                                                          |

## What makes it special

Goodbudget (formerly EEBA, the "Easy Envelope Budget Aid", made by Dayspring Technologies since 2009) copies the paper-envelope routine closely. Money you record as income sits in **Available** until you **fill** envelopes. Spending is recorded against an envelope. When an envelope is empty or red, you stop spending or move money from another envelope. There is no automation on the free plan. Reviewers present that friction as the point: typing every expense makes you think about it.

Its niche is **shared household budgets without bank linking**. Reddit-sourced round-ups in 2026 list Goodbudget among the apps recommended to privacy-conscious people who refuse to link banks, and as a free YNAB-style alternative. The complaints mirror that: every expense must be entered by hand, and the free plan's limits (20 envelopes, 2 devices, 1 year of history) are tight for a family. According to NerdWallet's review, ratings are 4.6 on the App Store and lower (3.5) on Google Play.

Development is slow but steady. The 2025–2026 changelog shows a manual **Match** tool to merge a manual entry with an imported duplicate, swipe-to-confirm on iPhone, envelope suggestions based on payee history (September 2025), **pending bank transactions** (early 2026) and **running balances** on iPhone (March 2026). A November 2025 changelog entry mentions "Plus and Premium" subscribers, which suggests a new tier; it is not on the public plan table (unverified).

## Strongest feature

**Envelopes with a visual spending pace, shared across a household.** Each envelope shows its balance above its budgeted amount, a green bar that shrinks as you spend, and a thin **black line** marking where the balance _should_ be today if you spent evenly. "Am I on track this month?" becomes visible at a glance on the phone, and both partners see the same numbers after each sync. For our target user ("see where my money goes, stop wasting") the pace line is the most transferable idea: it is cheap to build, works with manual entry, and CoinKeeper's current monthly budgets could use it immediately.

## Feature deep dive

### Available money (unassigned funds)

- **What it does**: Holds money that exists in your accounts but has no envelope yet.
- **How it works**: `Available = all account money − all envelope money` (it was called _Unallocated_ until 2023). It goes up when you record income without filling, add an account or raise an account balance, or delete an envelope that still has money in it. It goes down when you fill envelopes.
  - **Overspent (negative) envelopes make Available look higher**; the fix is to fill the negative envelope.
  - A credit card account you pay in full reduces Available, because that money is owed.
  - Imported expenses without an envelope also distort Available until they are assigned.

  Goodbudget suggests keeping part of Available unfilled to build a **one-month cushion**. The same pooling approach is recommended for multiple or variable incomes.

- **Why it helps**: A single "unassigned money" number with plain explanations of why it looks too high or too low, which is good for non-experts. Usefulness: **High**.

### Filling envelopes (Add vs Set, Quick Fills, scheduled fills)

- **What it does**: Moves money from income or Available into envelopes each budget period.
- **How it works**: The Fill screen has two parts:
  - **Fill from**: a new income, or money in Available.
  - **Amounts**: per envelope, or via a **Quick Fill** preset applied to all envelopes.

  Per envelope there are two modes:
  - **Add budgeted amount** keeps the leftover and adds the budget again (rollover).
  - **Set to budget amount** tops the envelope up to exactly the budget (a reset). On iPhone, "Set" appears when "Rollover remaining balance" is toggled off.

  A live **Still Available** figure turns **red** if you try to fill more than you have. Custom Quick Fills can be saved by name ("Remember Quick Fill as…"). Any fill can be **scheduled** ("Schedule this…"). For example, a monthly scheduled "Set all" fill on the 1st gives a clean reset so envelopes show only the current month's spending.

- **Why it helps**: Makes rollover versus reset an explicit, per-envelope choice instead of a hidden rule. Usefulness: **High**.

### Annual and Goal envelopes

- **What it does**: Saves for yearly costs (gifts, insurance, property tax) and one-off goals (a wedding, a car).
- **How it works**: An **Annual** envelope has a yearly budget and an optional due date, and repeats every year. A **Goal** envelope is a one-time target with an optional due date. Suggested fill per period:
  - **Annual, no due date**: annual budget ÷ budget periods per year ($1,200 → $100/month).
  - **Goal, no due date**: fill amount is always 0 (you fund it manually).
  - **Annual or Goal with a due date**: (budget − amount already filled or transferred in) ÷ periods until the due date. Examples: ($1,200 − 0) ÷ 4 months = $400; semi-monthly ($1,200 − 50) ÷ 8 = $143.75.
  - **Caveat**: the formula uses what was _filled_, not the current _balance_, so money already spent from the envelope still counts as progress.

  Annual and Goal envelopes are the "10 more" envelopes on the free plan.

- **Why it helps**: Direct support for "save for a vacation, house, car, emergency fund" with a transparent formula. Usefulness: **High**.

### Spending pace line on envelope bars

- **What it does**: Shows whether an envelope is being spent faster than the budget period allows.
- **How it works**: The green bar is the remaining balance. The black line marks the "on budget" balance for today: expected spend = budget ÷ days in period × days elapsed. Example: a $120 monthly envelope five days in means $20 expected spend. If actual spending is $62 in the same period, the envelope is "behind" by the difference between its actual and theoretical balance ($18.90 in the help example) and will go red before month end at this pace. The help centre notes that front-loaded spending (e.g. a big grocery run early) makes you look behind temporarily, and that doing nothing is sometimes fine.
- **Why it helps**: Early warning without notifications or AI, fully computable from manual data. Usefulness: **High**.

### Transfers between envelopes and accounts

- **What it does**: Moves money between envelopes (to cover overspending) or between accounts.
- **How it works**: Add Transaction → **Transfer** tab, then choose an Envelope transfer or an Account transfer. There is also a bulk envelope transfer. The standard answer to a red envelope is to transfer from a fuller envelope or fill it from Available. Envelopes keep negative balances until you fix them; there is no automatic month-end handling (unverified beyond help-centre descriptions).
- **Why it helps**: Supports "roll with the punches" re-budgeting. Usefulness: **High**.

### Debt Accounts and the Debt Progress Report

- **What it does**: Tracks paying off loans and credit cards and shows a debt-free date.
- **How it works**: Debt Accounts are free and unlimited. Each holds a name, current balance, monthly payment and optional interest rate. **Debt Payment** transactions reduce the balance; **Charge** transactions (interest, fees, new purchases) increase it. The **Debt Progress Report** shows a red bar that shrinks as you pay, plus your projected payoff. A Debt Snowball guide combines the Income vs. Spending report with the envelope budget total to find the "snowball" (spare money for extra payments). For a card still in use there are two documented setups:
  1. A Debt Account plus a two-step entry (a New Charge, then an envelope transfer to a "Debt Payment" envelope). These expenses do not appear in reports.
  2. A Credit Card Account for daily spending plus a Debt Account for the old balance.

  Transactions cannot be imported into Debt Accounts.

- **Why it helps**: Debt payoff is a common goal and the payoff maths is universal. The card workflows are clumsy. Usefulness: **Medium**.

### Household sync

- **What it does**: Several people and devices share one budget.
- **How it works**: You register a "Household", and a partner **logs in with the same email and password** on their device. The app syncs each time it is opened or a transaction is recorded. Free allows 2 devices, Premium 5; an error appears when the device limit is reached.
- **Why it helps**: Couples budgeting together is a core use case and a reason people choose Goodbudget. The shared-credentials model is a security weakness. Usefulness: **Medium** (the concept is high; this implementation should not be copied).

### Reports

- **What it does**: Shows spending by envelope and whether you live within your means.
- **How it works**: **Spending by Envelope** (a colourful breakdown for any date range; tap an envelope to highlight it) and **Income vs. Spending** (counts fills from income and income to Available; account transfers are excluded) exist on web and mobile, alongside the Debt Progress Report. The complete web report list was not verified.
- **Why it helps**: Covers "where did my money go?". CoinKeeper's dashboard already covers similar ground. Usefulness: **Medium**.

### Scheduled transactions, import and matching

- **What it does**: Reduces manual typing.
- **How it works**: Any transaction or fill can be scheduled to repeat (rent, paycheck fills). Free users can upload QFX/OFX files from their bank; the import either creates transactions or matches them to existing ones. Premium users get bank sync, a **Need to Confirm** queue, pending transactions and a manual **Match** tool. Since September 2025, choosing a payee suggests an envelope based on history.
- **Why it helps**: Recurring entries and matching are what make manual budgeting bearable. Usefulness: **High** (recurring transactions are missing in CoinKeeper today).

## Fit for CoinKeeper

| Feature                                          | Usefulness for our user | Model changes?                                          | API / services                                                                 | UI changes                                                         | Effort (S/M/L) | Priority (Now/Next/Later/Skip) |
| ------------------------------------------------ | ----------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------ | -------------- | ------------------------------ |
| Spending pace line on budget bars                | High                    | None                                                    | Add `expectedSpentMinor` to the budget month response (or compute client-side) | Pace marker on the budget progress bar, "ahead / behind by X" text | S              | Now                            |
| Annual / Goal budgets with due-date fill formula | High                    | `category_targets` (cadence yearly / one-off, due date) | Need-per-month calculation                                                     | Target editor, "save X/month to reach Y by Z"                      | M              | Now                            |
| Rollover choice per category (Add vs Set)        | High                    | `categories.rollover` (or a `rollover_mode` enum)       | Carried balance in the month service                                           | Toggle on the category, carried amount on the row                  | M              | Now                            |
| Unassigned money (Available) explanation         | High                    | None                                                    | Month summary per currency                                                     | Tooltip / "why is this number…" help                               | S              | Next (with envelope mode)      |
| Recurring transactions / scheduled fills         | High                    | `schedules` table                                       | Generator job or on-read materialisation                                       | Schedules screen, "upcoming" list                                  | M              | Next                           |
| Saved fill presets (Quick Fills)                 | Medium                  | `budget_templates` or reuse targets                     | Apply-template endpoint                                                        | "Fill from template" menu                                          | S              | Later                          |
| Debt accounts with payoff date                   | Medium                  | Loan fields on `accounts`                               | Payoff projection                                                              | Debt progress card                                                 | M              | Later                          |
| Household sharing                                | Medium                  | Households and memberships (changes per-user scoping)   | Authorisation rewrite                                                          | Invite flow                                                        | L              | Later (never shared passwords) |
| Device limits / history limits                   | Low                     | —                                                       | —                                                                              | —                                                                  | —              | Skip                           |

### Spending pace line

- **What is it for?** It tells the user mid-month whether a category is being used up too fast, before it goes over. That serves "stop wasting money" directly and fits our existing budget statuses (On track / Near limit 80% / Exceeded), which only react _after_ 80% is spent.
- **Should we modify the models?** No. With budget `B` (minor units), days in month `D` and days elapsed `d` (in the user's locale and time zone): `expected = floor(B × d / D)`. Pace delta = `spent − expected`. Everything stays per currency, as budgets already are. Add a shared helper `computeSpendingPace({ budgetMinor, spentMinor, date, month })` in `packages/shared/src/lib`, with TSDoc and tests for month boundaries, the first and last day, February, and past or future months (100% or 0% elapsed).
- **Should we improve the UI?** The Budgets screen and the dashboard's budget widgets get a small marker on each progress bar at `expected / B`, and a caption such as "{amount} ahead of pace" or "{amount} over pace". A new status `Behind pace` could sit between On track and Near limit. Colour must not be the only signal (text plus marker), in line with WCAG.
- **How to implement**:
  1. Write the shared helper and tests.
  2. Add `expectedSpentMinor` and `paceStatus` to the budget contract (computed in the service using the user's locale date).
  3. Add a marker element to the existing progress bar component (a BEM `__marker` element), plus unit tests.

  **Risks:** lumpy categories (rent, annual bills) always look "behind" or "ahead", so disable the pace for categories flagged as fixed or for funds. A `categories.pace_enabled` boolean, defaulting on for expense groups, would handle it.

### Annual / Goal budgets (due-date saving)

- **What is it for?** Our user wants to save for a vacation, a car, a house or a yearly insurance bill. Goodbudget's formula (remaining amount ÷ periods left) is the simplest possible "how much per month?" answer.
- **Should we modify the models?** Use one shared table across all target types (see the YNAB doc): `category_targets(id, user_id, category_id, kind enum('monthly','yearly','by_date','balance'), amount_minor, currency, due_month date, repeats bool, created_at, archived_at, deleted_at)`. Do **not** copy Goodbudget's "filled, not balance" shortcut. Compute progress from assignments + ledger, so spending from the goal is honestly reflected, or offer an "allow early spending" flag like Actual.
- **Should we improve the UI?** A "Goals" view (or a section on Budgets) lists each goal with a progress ring, target, due date and "save {x}/month". The dashboard gets a "Goals" card. In tracking mode, the monthly suggestion can prefill the category's budget for the month.
- **How to implement**:
  1. Migration.
  2. Shared `monthlyNeedByDate(targetMinor, progressMinor, monthsLeft)` using integer ceiling division.
  3. Service returns the goals with progress per currency.
  4. UI.

  **Open question:** should goals always be tied to a category (Goodbudget, YNAB) or also allow account-based goals (e.g. "emergency fund = my savings account balance")? Supporting both via a nullable `account_id` is cheap and fits users who keep savings in a separate account.

### Rollover choice per category

- **What is it for?** Some categories should roll over (gifts, car maintenance) and others should reset (dining out). Goodbudget exposes this at fill time; CoinKeeper can make it a category setting so it applies every month.
- **Should we modify the models?** Add `categories.rollover_mode` enum `none | positive | all` (default `none` = today's behaviour). The carried balance is derived: for `positive`, carry = max(0, previous month's budget − spent + previous carry). It is computed month by month in SQL (a recursive CTE) or in the service from monthly aggregates. Nothing is stored.
- **Should we improve the UI?** Add a toggle in the category editor, a "+{carried} from last month" line on the budget row, and change the status maths to use (budget + carry) as the limit.
- **How to implement**: migration → aggregate query per category, month and currency → shared `rollForward(months[], mode)` helper with tests → contract fields `carriedInMinor` / `availableMinor` → UI. **Risk:** performance over long histories. Limit the lookback to the first month the category had a budget.

## What not to copy

- **Sharing a household by sharing one login and password.** A security anti-pattern. Use per-person accounts with memberships if we ever add households.
- **US-only Plaid bank sync as the Premium centrepiece.** Region-locked; our base is manual entry plus CSV.
- **Freemium limits on envelopes, devices and history (e.g. 1 year of history).** They cut against a tool meant to give full visibility; history is the user's data.
- **Two-step credit-card entry (charge plus envelope transfer) whose expenses disappear from reports.** CoinKeeper's paired transfers and credit card account type already model this correctly.
- **Fill progress counted from what was filled rather than the balance.** It can report a goal as funded after the money has been spent; derive progress from the ledger instead.
- **Debt accounts that cannot receive imports.** Loans should be ordinary liability accounts in the same ledger.

## Sources

- [Goodbudget: plans and pricing (sign-up page)](https://goodbudget.com/signup)
- [Goodbudget Help Center index](https://goodbudget.com/help/)
- [Goodbudget Help: What is Available money?](https://goodbudget.com/help/budgeting-with-goodbudget/what-is-available-money/)
- [Goodbudget Help: Why is my Available balance…?](https://goodbudget.com/help/budgeting-with-goodbudget/why-is-my-available-balance/)
- [Goodbudget Help: Step 1. Add Envelopes to Create a Budget](https://goodbudget.com/help/getting-started-guide/step-1-add-envelopes/)
- [Goodbudget Help: Step 4. Fill Your Envelopes](https://goodbudget.com/help/getting-started-guide/step-4-fill-envelopes/)
- [Goodbudget Help: Step 5. Record Your Expenses](https://goodbudget.com/help/getting-started-guide/step-5-record-expenses/)
- [Goodbudget Help: Re-Fill Your Envelopes Each Budgeting Period](https://goodbudget.com/help/budgeting-with-goodbudget/refill-each-period/)
- [Goodbudget Help: Custom Quick Fills](https://goodbudget.com/help/customize-your-goodbudget/quick-fills/)
- [Goodbudget Help: Reset Envelope balances every month](https://goodbudget.com/help/customize-your-goodbudget/reset-envelope-balances/)
- [Goodbudget Help: Annual / Goal Envelope fill amounts](https://goodbudget.com/help/budgeting-with-goodbudget/fill-amounts-annual-goal/)
- [Goodbudget Help: Set Goals and Track Progress with More Envelopes](https://goodbudget.com/help/customize-your-goodbudget/goals-and-annuals/)
- [Goodbudget Help: What's that line on my Envelope bar?](https://goodbudget.com/help/budgeting-with-goodbudget/black-line/)
- [Goodbudget Help: How much do I have left in my Envelope?](https://goodbudget.com/help/budgeting-with-goodbudget/how-much-left-in-envelope/)
- [Goodbudget Help: Handle Multiple or Variable Incomes](https://goodbudget.com/help/customize-your-goodbudget/multiple-variable-incomes/)
- [Goodbudget Help: Build up a One Month Cushion](https://goodbudget.com/help/budgeting-with-goodbudget/one-month-cushion/)
- [Goodbudget Help: Starting with Debt](https://goodbudget.com/help/tackling-debt/starting-with-debt/)
- [Goodbudget Help: Debt Snowball using Debt Accounts](https://goodbudget.com/help/tackling-debt/debt-snowball/)
- [Goodbudget Help: Credit Card Payments](https://goodbudget.com/help/tackling-debt/credit-card-payments/)
- [Goodbudget Help: Using Your Card While You Pay It Off](https://goodbudget.com/help/tackling-debt/using-card-while-paying-off/)
- [Goodbudget Help: Manually Import Transactions](https://goodbudget.com/help/using-accounts/import/)
- [Goodbudget Help: Can I Link my Bank Accounts?](https://goodbudget.com/help/using-accounts/link-bank-accounts/)
- [Goodbudget Help: Which Banks Can Sync (US only)](https://goodbudget.com/help/automatic-bank-sync/which-banks-can-i-link-to-my-accounts/)
- [Goodbudget Help: Share your budget with a partner](https://goodbudget.com/help/mobile-apps/share-budget-w-partner/)
- [Goodbudget Changelog (2025–2026)](https://goodbudget.com/changelog/)
- [Goodbudget blog: 2025 features recap](https://goodbudget.com/blog/2025/11/2025-goodbudget-features-recap/)
- [Goodbudget blog: pending transactions (2026)](https://goodbudget.com/blog/2026/03/gb-finally-imports-pending-transactions/)
- [Goodbudget blog: Reports help you see where it all goes](https://goodbudget.com/blog/2016/11/reports-help-you-see-where-it-all-goes/)
- [NerdWallet: Goodbudget app review](https://www.nerdwallet.com/finance/learn/goodbudget-app-review)
- [EnvelopeBudgeting.com: Goodbudget in 2026 review](https://envelopebudgeting.com/articles/goodbudget-alternative)
- [Finny: Budget apps Reddit recommends in 2026](https://getfinny.app/blog/best-budget-apps-reddit-recommends-2026)
- [CostBench: Goodbudget pricing 2026](https://costbench.com/software/personal-finance/goodbudget/)
