# Actual Budget

> Summary: Actual Budget, the free open-source local-first envelope app: its budget automations (goal templates), schedules, rules engine and custom reports, and why schedules and typed budget automations are the ideas most worth borrowing for CoinKeeper.

## At a glance

|                     |                                                                                                                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type                | Envelope (zero-sum) budgeting, with an optional "tracking budget" mode. Open source, local-first.                                                                                                                                                                                                 |
| Platforms           | Web app (self-hosted server, or the browser-only app at app.actualbudget.org), desktop apps (Windows, macOS, Linux; Flathub since January 2026), mobile-responsive web UI. No native mobile app.                                                                                                  |
| Pricing (2026)      | Free (MIT). Hosting is optional: self-host with Docker, or one-click hosting such as PikaPods (about US$1.50/month as of November 2025, US$5 sign-up credit; part of the fee is donated to the project) or Fly.io. The original paid service shut down in 2022 when the project went open source. |
| Regions / bank sync | Optional, bring-your-own-credentials, server only: SimpleFIN Bridge (North America), Enable Banking (Europe, added June 2026), GoCardless Bank Account Data (Europe, **not accepting new accounts**), Pluggy.ai (Brazil), Akahu (New Zealand, July 2026). File import: CSV, QIF, OFX, QFX, CAMT.  |
| Data entry          | Manual, file import, optional bank sync, schedules (recurring), rules                                                                                                                                                                                                                             |
| Best for            | Privacy-minded, somewhat technical users who want YNAB-level budgeting without a subscription or cloud lock-in                                                                                                                                                                                    |

## What makes it special

Actual started as a paid product ($4/month) by James Long. In 2022 he open-sourced it and closed the business: his post said it had about 810 paying subscribers, and the Hacker News thread about it drew more than 800 points. Since then a community of maintainers has shipped a release every month. The GitHub repository has about 29k stars and is pushed daily (as of 28 September 2026). Data lives in a local SQLite database on each device and syncs through a server you control. **End-to-end encryption** is optional (with a second password; bank sync tokens are not covered), and the app keeps working offline.

The budgeting model is YNAB-like but more configurable:

- You can only budget money you have ("To Budget").
- Leftover money rolls over.
- Overspending is subtracted from next month's To Budget automatically.
- Individual categories can be set to carry a negative balance.
- Whole budgets can switch to a **tracking budget** that plans expected income and does not roll money over.

The biggest differentiator is **budget automations**: a small language (and, from June 2026, an experimental form UI) for "budget $50 every other week", "save $1,500 by March", "10% of income to savings" or "split whatever is left 1:2 between vacation and investments".

Community sentiment (Hacker News and Reddit-sourced round-ups) praises the local-first design, the lack of a subscription and the fast pace of development. The costs are self-hosting and setup effort, no native mobile apps, bank sync only through third-party providers you sign up with yourself, and several features still behind "experimental" flags. **Multi-currency is not supported natively**: the docs describe a rule-templating workaround, and currency display work is ongoing.

Recent releases include:

- **26.1.0** (January 2026): currency symbols in the budget view.
- **26.2.0** (February 2026): multiple dashboards, experimental budget analysis report.
- **26.5.0** (May 2026): experimental Sankey and Age of Money reports.
- **26.6.0** (June 2026): Crossover report stable, experimental budget automations UI, Enable Banking.
- **26.7.0** (July 2026): stable CLI, Akahu, better tags.
- **26.8.0** (August 2026): Age of Money and payee locations stable, mobile reconciliation.
- **26.9.0** (1 September 2026): customisable transaction columns, an onboarding tour, an experimental Monte Carlo retirement report.

## Strongest feature

**Budget automations (goal templates).** One click fills the whole month's budget from per-category rules: fixed amounts on any cadence, save-by-date goals that recalculate, covering a linked schedule, averaging past spending, a percentage of income, refilling to a cap, and weighted distribution of the remainder, all run in priority order. For our target user this turns "save for a vacation / emergency fund / yearly insurance" into something that happens automatically every month, without bank sync or regional assumptions. It is the most complete public specification of budget goals we found, and the code is open to study.

## Feature deep dive

### Envelope budget (default)

- **What it does**: Assign money you already have to categories until **To Budget** is 0.
- **How it works**: The account balance is what you can budget. Each category has Budgeted, Spent and Balance columns.
  - **Income**: becomes available immediately. Unbudgeted income rolls into next month's Available Funds; hovering shows which month it came from.
  - **Hold for next month** takes money out of this month's To Budget and adds it to the next month's; holds can span several months. **Reset Next Month's Buffer** brings held money back, and **auto hold** can do it every month for specific income categories (enabled for the current month plus the next 12).
  - **Leftover** category money rolls into next month's Balance.
  - **All overspending** is automatically subtracted from next month's To Budget and the category resets to 0, unless the category has **Rollover overspending** turned on, in which case the negative balance carries forward (useful for reimbursable expenses).
  - **Moving money**: "Transfer to another category" works between categories and To Budget. The month menu offers **Copy last month's budget** and other fill shortcuts.
  - **Credit cards**: treated as accounts with negative balances, which lower On Budget funds. There is no separate payment category; card accounts should stay On Budget.
  - Code: `packages/loot-core/src/server/budget/envelope.ts`, `actions.ts`, `base.ts`. Docs: _How Budgeting Works_.
- **Why it helps**: Unspent money becomes savings, overspending is handled once, and "one month ahead" is supported directly. Usefulness: **High**.

### Tracking budget (optional mode)

- **What it does**: A traditional budget: plan expected income and expenses, then compare with actuals.
- **How it works**: Switched on in Settings ("Switch to tracking budgeting"). You budget income categories as well as expense categories.
  - **Projected Savings** = budgeted income − budgeted expenses, and turns into **Saved** or **Overspent** when the month ends (actual income − actual expenses).
  - Pie charts next to Income and Expenses fill green and turn red when you exceed the budget.
  - No automatic rollover. Per category, you can choose **Rollover Overspending** to carry a deficit forward.
  - The team recommends the envelope budget, but keeps both.
  - Code: `packages/loot-core/src/server/budget/tracking.ts`.
- **Why it helps**: Many beginners think in "limits per category". This mode is essentially CoinKeeper's current model, which shows that the two can live side by side in one product. Usefulness: **High**.

### Budget automations / goal templates

- **What it does**: Automatically fills category budgets each month and shows whether goals are met.
- **How it works**: Automations are written either as note lines (`#template …`, grammar in `packages/loot-core/src/server/budget/goal-template.pegjs`) or, experimentally since 26.6.0, in a form UI opened from a pie-chart icon. Each category uses one source of truth, and notes can be migrated to the UI. The evaluation logic is in `category-template-context.ts`, `goal-template.ts` and `schedule-template.ts`. The types are:
  - **Fixed amount**: `#template 50`; `repeat every week starting 2025-01-03`; `repeat every 2 weeks`, `every 3 months`, `every year`. Weekly amounts count the chosen weekday in the month (5 Saturdays in May 2026 → 5 × amount).
  - **Save by date**: `#template 10000 by 2025-12`. It recalculates the monthly amount as funds are added or removed, with an optional `repeat every year` and **allow early spending** (`spend from 2025-11`) so spending before the deadline does not trigger more saving.
  - **Cover schedule**: `#template schedule Internet`. Either save for the next occurrence or cover the full amount in the month it falls due, with adjustments such as `[increase 20%]` or `[decrease 500]` for rising bills.
  - **From history**: `average 3 months` (spending, completed months only) or `copy from 12 months ago` (budget), with adjustments.
  - **% of income**: `10% of all income`, `10% of Paycheck`, `15% of previous all income`, `12% of available funds`.
  - **Refill to cap / balance cap**: `#template up to 150`, `up to 5 per day`, `up to 100 per week starting …`. The excess is removed unless "retain existing funds over the cap" (`hold`) is on. At most one `up to` per category.
  - **Whatever is left (remainder)**: the leftover To Budget is split by weight, `budgeted = available ÷ sum_of_weights × weight`. Caps are respected with extra passes; for example, 100 across weights 3/1/2 with a 40 cap on the first gives 40/20/40.
  - **Long-term goal**: `#goal 500`. Colours the balance by progress toward a target balance instead of this month's budget.

  **Priorities**: `#template-N`. Priority 0 runs first and **can make To Budget negative**; higher numbers never budget more than is available. Items with the same number run in database order, and the docs suggest spacing priorities 10 apart. **Running**:
  - **Apply budget template** fills only categories that have 0 budgeted.
  - **Overwrite with budget template** replaces all amounts.
  - Each is also available per category or per group, and **Check templates** validates syntax.

  **Indicators**: the balance text turns green (met), orange (not met) or red (negative), with a tooltip. The note syntax has rules: no currency symbols, a `.` decimal separator and no thousands separators.

- **Why it helps**: Goals and irregular expenses get funded without monthly maths, with precise, explainable behaviour. Usefulness: **High**.

### End-of-month cleanup

- **What it does**: Sweeps leftovers from over-funded categories, covers overspent ones and sends the rest to savings.
- **How it works**: Categories are marked as **sources** (send leftover to To Budget or to a named pool) or **sinks** (receive leftover, by weight). Named pools allow separate groups, for example a reimbursement pool, and a sink can be limited to "only enough to cover overspending". It runs from the budget header menu. Syntax: `#cleanup source`, `#cleanup sink 2`, `#cleanup <Group> source`. Code: `cleanup-template.ts`, `cleanup-template.pegjs`. Experimental.
- **Why it helps**: Turns month-end surplus into savings or debt payoff deliberately, which suits "stop wasting, save more". Usefulness: **Medium**.

### Schedules

- **What it does**: Tracks recurring bills, subscriptions and paychecks, and optionally posts them automatically.
- **How it works**: A schedule has a payee, an account, an amount and a date or recurrence. Options include:
  - several days per month;
  - "Move schedule" before or after weekends;
  - the 31st, which skips months without one;
  - **amount modes**: exact, **approximately** (±7.5%: $100 matches $92.50–$107.50, shown with a `~`) or a **range**;
  - auto-add versus manual approval.

  Matching links a transaction to a schedule when it falls within **±2 days** of the due date. You can "Find matching transactions", "Skip scheduled date" and set an **upcoming length** (1 day to the end of the month, or custom). Actual also suggests schedules from recurring payees. Since 26.9.0, a future-dated transaction offers a **Schedule** button (Ctrl/Cmd+Shift+Enter) that turns it into a one-time schedule. Schedules generate an underlying rule. Code: `packages/loot-core/src/server/schedules/app.ts`, `find-schedules.ts`.

- **Why it helps**: Recurring costs and subscriptions become visible in advance, and templates can budget for them. Directly useful for "stop wasting" (subscription awareness). Usefulness: **High**.

### Rules (auto-categorisation that learns)

- **What it does**: Cleans payee names, sets categories and notes, and more, on import or sync.
- **How it works**: Rules run in list order in three **stages** (`pre`, `default`, `post`). Within a stage they are **ranked automatically from least to most specific** ("is" ranks above "contains"), so the more specific rule wins because it runs last.
  - **Conditions**: is / is not, contains / does not contain, `matches` (regex), one of / not one of.
  - **Condition fields**: imported payee, payee, account, category, date, notes, amount, amount (inflow/outflow), cleared. All string matching is case-insensitive.
  - **Actions**: set category, payee, notes, cleared, account, date or amount; prepend or append notes; a `delete` action since 25.11.0. There are also experimental formula and templating actions.
  - Actual **creates rules automatically** when you rename payees or categorise the same payee repeatedly.
  - Code: `packages/loot-core/src/server/rules/` (`rule.ts`, `condition.ts`, `action.ts`, `rule-indexer.ts`).
- **Why it helps**: Makes manual/CSV workflows fast: import, and most rows are already categorised. Usefulness: **High**.

### Reports and custom reports

- **What it does**: Lets you analyse your finances on a customisable dashboard.
- **How it works**: Multiple dashboards (26.2.0) with widgets:
  - **Cash Flow** (budgeted accounts only);
  - **Net Worth** (Trend or Stacked);
  - **Spending Analysis**;
  - **Summary card** (sum or monthly average);
  - **Calendar card**;
  - a Markdown text widget;
  - **Crossover Point** (when passive investment income covers expenses);
  - **Age of Money** (stable in 26.8.0).

  Experimental: Budget Analysis (with CSV export), **Balance Forecast** (projects balances from schedules, or from the tracking budget plan), **Sankey**, **Monte Carlo** retirement analysis. **Custom reports** offer table, bar, line, area or donut views of Payment, Deposit or Net, split by category, group, payee, account or month, with a Total or Time mode, live or static date ranges, filters, options (hidden, empty, off-budget, uncategorised) and saving by name.

- **Why it helps**: Answers "where does my money go?" at any level of detail. The forecast answers "will I run short?". Usefulness: **High** (custom reports and forecast), **Low** (Crossover and Monte Carlo for our non-expert user).

### Local-first sync and privacy

- **What it does**: Keeps all data on your devices and optionally syncs it through your own server.
- **How it works**: Each device keeps a full local copy. Changes sync in the background to the chosen server when online. Optional end-to-end encryption uses a second password; the data cannot be recovered if you lose it. Bank sync tokens are stored on the server outside the encryption.
- **Why it helps**: Privacy and ownership appeal to many users worldwide. It is not directly transferable to CoinKeeper's server-side SQL design. Usefulness: **Medium**.

### Import, splits, tags and transfers

- **What it does**: Covers everyday data handling.
- **How it works**: Imports CSV, QIF, OFX, QFX and CAMT. CSV import supports field mapping, date formats, delimiters, "Flip amount", separate inflow and outflow columns, and a **multiplier** (e.g. a rough currency conversion), plus duplicate avoidance. **Split transactions** use child rows that must add up to the parent, with a "tax-style" distribution since 26.5.0. **Tags** in notes gained bulk actions and "has any / all tags" filters (26.7.0). **Transfers** link two accounts.
- **Why it helps**: Import is at parity with CoinKeeper. Splits and tags are gaps in CoinKeeper today. Usefulness: **High** (splits), **Medium** (tags).

## Fit for CoinKeeper

| Feature                                                                           | Usefulness for our user | Model changes?                                          | API / services                                               | UI changes                                               | Effort (S/M/L) | Priority (Now/Next/Later/Skip) |
| --------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------- | -------------- | ------------------------------ |
| Budget automations (typed targets + priorities + remainder)                       | High                    | `budget_automations` table (typed JSON params)          | Evaluator service with preview, apply and overwrite          | Automation editor per category, "Fill budget" menu       | L              | Next (start with 3 types Now)  |
| Schedules (recurring transactions)                                                | High                    | `schedules` table + `transactions.schedule_id`          | Occurrence expansion, matching (±2 days, ±7.5%), suggestions | Schedules screen, "upcoming" in the ledger and dashboard | M              | Now                            |
| Envelope mode alongside tracking mode                                             | High                    | `user_settings.budget_mode`, `categories.rollover_mode` | Month service for both modes                                 | Mode switch, To Budget banner                            | L              | Next                           |
| Rule improvements (auto-learn, specificity ranking, conditions on amount/account) | High                    | Extend `rules` (conditions/actions JSON, stage)         | Rule engine v2                                               | Rule editor                                              | M              | Next                           |
| Balance forecast from schedules                                                   | High                    | None (computed from schedules)                          | Forecast endpoint per account/currency                       | Forecast chart                                           | M              | Next (after schedules)         |
| Split transactions                                                                | High                    | `transactions.parent_id` (child rows)                   | Split-aware aggregates                                       | Split editor                                             | M              | Next                           |
| Custom reports (group by, chart type, saved)                                      | Medium                  | `saved_reports`                                         | Generic aggregate endpoint                                   | Report builder                                           | L              | Later                          |
| End-of-month cleanup (sources/sinks)                                              | Medium                  | Part of automations                                     | Cleanup run                                                  | Menu action                                              | M              | Later                          |
| Age of Money                                                                      | Medium                  | None                                                    | FIFO over the ledger                                         | Stat card                                                | M              | Later                          |
| Hold for next month                                                               | Medium                  | `budget_holds(month, currency, amount_minor)`           | Month service                                                | "Hold" action on To Budget                               | S              | Later (envelope mode)          |
| Local-first / E2E encryption                                                      | Low                     | —                                                       | —                                                            | —                                                        | L              | Skip                           |
| Crossover / Monte Carlo                                                           | Low                     | —                                                       | —                                                            | —                                                        | —              | Skip                           |

### Budget automations (goal templates)

- **What is it for?** It fills the month's budget in one click from explicit rules and tracks goals. For our user it automates "save 10% of income", "put aside for yearly insurance", "$1,500 for a vacation by June" and "whatever is left goes to the emergency fund".
- **Should we modify the models?** Use a typed table, not a text DSL:
  - `budget_automations(id, user_id, category_id, type enum('fixed','by_date','schedule','average','copy','percent_income','refill_cap','remainder','long_term_goal'), priority smallint >= 0, params jsonb, note text, created_at, updated_at, deleted_at)`.
  - `params` is validated by a Zod discriminated union in `packages/shared`. Examples: `{ amountMinor, currency, cadence:{unit:'week', every:2, start:'2026-01-02'} }`, `{ targetMinor, currency, byMonth:'2027-06', repeatYearly:false, spendFrom:null }`, `{ weight: 2 }`.
  - An optional `categories.balance_cap_minor` + `retain_over_cap` for caps.

  All amounts are integer minor units in one currency per automation. The evaluator runs per currency and never mixes them. Output is written to the existing `budgets` rows (with a preview first), so the ledger and budgets stay the source of truth.

- **Should we improve the UI?**
  - Each category row gets an "automation" icon that opens a side panel listing its automations with a live **projected amount** (as Actual does).
  - The Budgets header gets a **Fill budget** menu (Preview → Apply to empty → Overwrite all), plus a per-group action.
  - Balance or status colours show met / not met / negative.
  - New components: `AutomationEditor`, `FillBudgetDialog`.
- **How to implement**:
  1. Start with three types: fixed monthly, by-date, and remainder by weight.
  2. Write the shared pure evaluator `evaluateAutomations(month, currency, categories, context)` with exhaustive Vitest cases taken from Actual's docs (weeks per month, the 3/1/2 weights with a 40 cap, priority-0 overdraft).
  3. Add `POST /budgets/:month/automations/preview` and `/apply` endpoints.
  4. Build the UI.
  5. Add schedule-based, average, percent and cap types later.

  **Risks:** complexity for non-experts. Hide advanced types behind "More options" and show plain-language summaries ("Saves 125.00 per month to reach 1,500.00 by June 2027"). In tracking mode the "by date" type needs a definition of progress (cumulative budgeted minus spent), so decide this per mode.

### Schedules (recurring transactions and subscriptions)

- **What is it for?** Makes bills, subscriptions and paychecks visible before they happen, reduces manual entry, and powers forecasts and "cover schedule" budgeting. For "stop wasting money", a list of all recurring payments with yearly totals is a strong eye-opener.
- **Should we modify the models?**
  - `schedules(id, user_id, account_id, payee_id?, category_id?, amount_minor, amount_mode enum('exact','approx','range'), amount_max_minor?, currency, rrule text, weekend_shift enum('none','before','after'), auto_post bool, next_date date, created_at, archived_at, deleted_at)`.
  - `transactions.schedule_id` nullable FK for matched or posted occurrences.
  - Occurrences are expanded on read (not stored) until they are posted as normal ledger rows. A transfer schedule posts paired rows.
- **Should we improve the UI?**
  - A new **Schedules** screen with next date, amount (`~` for approximate) and status (upcoming / due / missed / paid).
  - "Upcoming" rows in the account ledger and on the dashboard.
  - A "Create schedule from transaction" action and suggestions from recurring payees in the review inbox.
- **How to implement**:
  1. Migration.
  2. Shared recurrence helper (with a small RRULE subset: every N days/weeks/months/years, specific month days) plus tests (the 31st, weekends).
  3. Matching service (±2 days, ±7.5% for approx) applied during CSV import next to duplicate detection.
  4. An "Post due schedules" action (on login or manual, avoiding background jobs at first).
  5. UI.

  **Open questions:** time zones for due dates (use the user's locale setting), and whether auto-posting runs server-side on a timer or lazily on first request of the day.

### Envelope mode next to tracking mode

- **What is it for?** Actual shows that one product can offer both a simple "limits" budget and a zero-sum envelope budget. CoinKeeper's current budgets map to Actual's tracking budget. Adding envelope mode serves users who want to take control more fully.
- **Should we modify the models?**
  - `user_settings.budget_mode` enum.
  - `categories.rollover_mode` enum `none | positive | all` (maps to Actual's "Rollover overspending").
  - An optional `budget_holds(user_id, month, currency, amount_minor)` for "hold for next month".
  - To Budget, balances and carried overspending are all computed from `budgets` + the ledger per currency.
- **Should we improve the UI?** The Budgets screen switches columns by mode (tracking: Budgeted / Spent / Remaining + Projected Savings; envelope: Budgeted / Spent / Balance + To Budget). Add a mode switch in Settings with an explanation.
- **How to implement**: see the YNAB doc (same month-series query). Follow Actual's overspending rule (subtract from next month's To Budget, reset the category to 0 unless `rollover_mode = all`), since it is simpler than YNAB's cash-versus-credit split.

## What not to copy

- **Text DSL in category notes as the primary interface** (`#template-1 150 up to 200`). Powerful but error-prone (no currency symbols, `.` decimal only). Use typed forms, as Actual itself is now moving to.
- **Priority 0 allowed to overdraw To Budget.** A surprising edge case; our evaluator should never assign money that isn't there unless the user explicitly allows it.
- **Bring-your-own bank-sync credentials** (SimpleFIN, GoCardless, Pluggy). Too technical for our target user, and region-fragmented.
- **Local-first SQLite with client-side sync.** Conflicts with our server-side Postgres ledger architecture; not worth the rewrite.
- **Multi-currency via rule-templating workarounds.** CoinKeeper already models currency per row, which is better.
- **Many features parked behind experimental flags.** Ship fewer, finished features to non-expert users.

## Sources

- [Actual Budget docs: How Budgeting Works](https://actualbudget.org/docs/budgeting/)
- [Actual Budget docs: Envelope Budgeting](https://actualbudget.org/docs/getting-started/envelope-budgeting)
- [Actual Budget docs: Tracking Budget](https://actualbudget.org/docs/getting-started/tracking-budget)
- [Actual Budget docs: Budget Automation (experimental UI)](https://actualbudget.org/docs/experimental/budget-automation)
- [Actual Budget docs: Goal Templates (note syntax)](https://actualbudget.org/docs/experimental/goal-templates)
- [Actual Budget docs: End of Month Cleanup](https://actualbudget.org/docs/experimental/monthly-cleanup)
- [Actual Budget docs: Schedules](https://actualbudget.org/docs/schedules)
- [Actual Budget docs: Rules](https://actualbudget.org/docs/budgeting/rules/)
- [Actual Budget docs: Reports dashboard](https://actualbudget.org/docs/reports/)
- [Actual Budget docs: Custom Reports](https://actualbudget.org/docs/reports/custom-reports)
- [Actual Budget docs: Balance Forecast Report](https://actualbudget.org/docs/experimental/balance-forecast-report)
- [Actual Budget docs: Credit Cards](https://actualbudget.org/docs/budgeting/credit-cards/)
- [Actual Budget docs: Multi-Currency](https://actualbudget.org/docs/budgeting/multi-currency)
- [Actual Budget docs: Syncing Across Devices / E2E encryption](https://actualbudget.org/docs/getting-started/sync)
- [Actual Budget docs: Importing Transactions](https://actualbudget.org/docs/transactions/importing)
- [Actual Budget docs: Split Transactions](https://actualbudget.org/docs/transactions/split-transactions)
- [Actual Budget docs: Joint Accounts strategies](https://actualbudget.org/docs/budgeting/joint-accounts)
- [Actual Budget docs: Bank Sync providers](https://actualbudget.org/docs/advanced/bank-sync)
- [Actual Budget docs: Installing Actual](https://actualbudget.org/docs/install/)
- [Actual Budget docs: PikaPods hosting](https://actualbudget.org/docs/install/pikapods)
- [Actual Budget release notes (25.9.0 – 26.9.0)](https://actualbudget.org/docs/releases)
- [GitHub: actualbudget/actual repository](https://github.com/actualbudget/actual)
- [GitHub source: goal-template.pegjs](https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/server/budget/goal-template.pegjs)
- [GitHub source: category-template-context.ts](https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/server/budget/category-template-context.ts)
- [GitHub source: envelope.ts](https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/server/budget/envelope.ts)
- [GitHub source: rules engine folder](https://github.com/actualbudget/actual/tree/master/packages/loot-core/src/server/rules)
- [GitHub source: schedules](https://github.com/actualbudget/actual/tree/master/packages/loot-core/src/server/schedules)
- [Hacker News: "Actual is going open-source" (2022 discussion)](https://news.ycombinator.com/item?id=31206536)
- [Actual blog post: going open source (linked from HN)](https://actualbudget.com/open-source)
