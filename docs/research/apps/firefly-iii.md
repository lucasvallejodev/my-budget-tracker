# Firefly III

> Summary: Firefly III, the open-source self-hosted finance manager: piggy banks, subscriptions, recurring transactions, its trigger-and-action rules engine, auto-budgets, tags, splits and the Data Importer, with code paths, and why goals, rollover and amount-range subscriptions are worth borrowing.

## At a glance

|                     |                                                                                                                                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type                | Open-source, self-hosted personal finance manager (web app + REST API)                                                                                                                                    |
| Platforms           | Web (self-hosted via Docker or PHP 8.5+), JSON REST API; community mobile apps such as Waterfly III                                                                                                       |
| Pricing (2026)      | Free (AGPL-3.0). About 24.8k GitHub stars. Latest stable v6.7.6, released 2026-09-28; daily develop builds                                                                                                |
| Regions / bank sync | Region-agnostic core. Optional separate Data Importer: CSV, CAMT.05x, and providers such as Enable Banking (EU PSD2), SimpleFIN (US), Lunch Flow, Salt Edge. GoCardless is being phased out by its vendor |
| Data entry          | Manual, file import (CSV/CAMT), optional provider sync, API, recurring transactions                                                                                                                       |
| Best for            | Technically minded users who want full control, data ownership, multi-currency and deep rules and reports, and who accept a steep learning curve                                                          |

## What makes it special

Firefly III is built on real double-entry bookkeeping: "money moves from A to B", and every withdrawal, deposit or transfer is a movement between accounts (asset, expense, revenue, liability). That rigour gives it trustworthy balances, reconciliation, audit reports and good multi-currency handling. Each transaction has a primary amount and an optional foreign amount, and recent releases added conversion to a "primary currency" for charts.

The author, James Cole (JC5), is explicit about his philosophy. A docs page argues that zero-based budgeting ties you to your paycheck, whereas Firefly III asks you to decide per _month_ what you need, budget less than you earn, and put the rest in savings and piggy banks. He keeps only five monthly budgets himself ("Bills", "groceries", "misc", "going out", "work-related") and uses piggy banks for every large future expense. This "budget the outflow, earmark the savings" model is very close to what CoinKeeper already does.

Users love the data ownership, the rules engine and the reports. The common criticisms, visible in Hacker News threads from 2019–2024, are complexity and speed. Several long-time users say they moved to Actual Budget because it was "a bit faster, a bit simpler", and others find the anti-zero-based stance odd. One user describes a workflow in which the companion app Waterfly III parses bank SMS notifications and creates transactions instantly, a clever answer to "no bank sync" in regions without open banking. Maintenance is very active (several releases per week in September 2026), but upgrades can be disruptive: v6.5.0 requires PHP 8.5, and v6.6.0 invalidated all OAuth tokens.

## Strongest feature

**The rules engine combined with subscriptions and piggy banks.** Rules turn imported bank lines into categorised, budgeted, tagged transactions linked to a subscription or piggy bank, applied on create or update or run over history. This makes a manual or CSV-import workflow (no bank sync, like CoinKeeper's) sustainable in the long term. For our non-expert user the full engine is too much, but a friendly subset of it has **High** value, because CoinKeeper's biggest daily friction is categorising imported rows.

## Feature deep dive

### Piggy banks (virtual savings goals)

- **What it does**: Splits the money on a savings account into named goals ("New camera: €300").
- **How it works**:
  - A piggy bank is virtual. Adding or removing money does not change any account balance; it only earmarks part of it. Docs: [explanation](https://docs.firefly-iii.org/explanation/financial-concepts/piggy-banks/), [how-to](https://docs.firefly-iii.org/how-to/firefly-iii/finances/piggy-banks/).
  - Fields: name, optional target amount, start date, target date, notes, attachments and an object "group".
  - In current code a piggy bank links to _one or more_ asset accounts through a pivot table that stores `current_amount` per account (`app/Models/PiggyBank.php`, `accounts()` belongsToMany with pivot `current_amount`, `native_current_amount`).
  - Money is added with [+] and [−], or by linking a **transfer**. If the piggy bank is on the destination account the amount is added; if on the source account, removed. The transfer is always created. If the piggy bank is full it is not changed, and any surplus stays unallocated.
  - Guard in `app/Repositories/PiggyBank/ModifiesPiggyBanks.php::canAddAmount`: amount ≤ min(left on account, target − saved).
  - Suggested monthly saving (`app/Support/JsonApi/Enrichments/PiggyBankEnrichment.php`): `save_per_month = (target − current) / ceil(months until target_date)` when more than one month remains.
  - History is kept in `PiggyBankEvent` rows.
- **Why it helps**: This is exactly the "vacation / car / emergency fund" need, without moving money. **High**.

### Subscriptions (formerly "bills")

- **What it does**: Tracks expected recurring expenses (rent, utilities, streaming) and shows whether each has been paid this period.
- **How it works**:
  - Docs: [explanation](https://docs.firefly-iii.org/explanation/financial-concepts/subscriptions/), [how-to](https://docs.firefly-iii.org/how-to/firefly-iii/finances/subscriptions/).
  - Fields: name, `amount_min` and `amount_max` (the expected range; the average is used for forecasting), first date, `repeat_freq` (weekly, monthly, quarterly, half-year or yearly), `skip` (skip every X occurrences), `end_date`, `extension_date`, active, currency, notes and group.
  - Only withdrawals can be linked.
  - After you create a subscription, Firefly III redirects you to create a **rule** pre-filled with the amount range and description, so future transactions link automatically.
  - The index and dashboard show expected dates, amount paid versus the expected average, and active or inactive state.
  - End and extension dates can trigger warnings via cron (`app/Jobs/WarnAboutBills.php`, `app/Support/Cronjobs/BillWarningCronjob.php`).
  - Subscriptions do _not_ change budgets.
  - The code still calls them `Bill` (`app/Models/Bill.php`).
  - Recent bug reports include a weekly subscription treated as paid for the month, and a minimum amount allowed above the maximum (fixed in the 6.6–6.7 changelog).
- **Why it helps**: It answers "which bills are still to come this month, and did anything change price?" **High**.

### Recurring transactions

- **What it does**: Automatically creates withdrawals, deposits or transfers on a schedule, for users who do not import.
- **How it works**:
  - Docs: [how to use recurring transactions](https://docs.firefly-iii.org/how-to/firefly-iii/finances/recurring/).
  - Repetition types: daily; weekly on day X; monthly on day _n_; monthly on the _n_-th weekday (`ndom`, where "2,3" = second Wednesday); yearly on a date. Each type has a `repetition_skip`.
  - Weekend handling: create on the weekend anyway, skip, move to the Friday before, or move to the Monday after.
  - Day 29, 30 or 31 falls back to the last day of shorter months.
  - Model fields (`app/Models/Recurrence.php`): `first_date`, `repeat_until`, `repetitions` (count), `latest_date`, `apply_rules`, `active`. Repetitions are in `app/Models/RecurrenceRepetition.php` (`repetition_type`, `repetition_moment`, `repetition_skip`, `weekend`).
  - A daily cron (`app/Jobs/CreateRecurringTransactions.php`, `app/Support/Cronjobs/RecurringCronjob.php`) creates the rows.
  - Limitations: no dynamic amounts and no split transactions in recurrences.
  - The docs advise: if you import, use subscriptions; if you enter data by hand, use recurring transactions (they can be linked).
- **Why it helps**: It saves typing for manual users and makes forecasts possible. **Medium–High**. For CoinKeeper, auto-creating ledger rows conflicts with CSV import (duplicates), so "planned occurrences + one-click record" is safer.

### Rules engine (triggers and actions)

- **What it does**: "If a transaction matches these triggers, apply these actions". It runs on create or update, or manually over existing transactions.
- **How it works**:
  - Docs: [how to use rules](https://docs.firefly-iii.org/how-to/firefly-iii/features/rules/), [all triggers](https://docs.firefly-iii.org/references/firefly-iii/rule-triggers/), [all actions](https://docs.firefly-iii.org/references/firefly-iii/rule-actions/).
  - Rules live in ordered **rule groups**.
  - _Strict_ rules need all triggers to match; non-strict rules need any one.
  - Every trigger can be negated.
  - "Stop processing" works at three levels: rule, trigger and action.
  - About 50+ triggers, for example:
    - text: `description_contains`, `starts_with`, `ends_with`, `is`, and `notes_contains`
    - amount: `amount_less`, `amount_greater`, `amount_exactly`
    - currency: `currency_is`, `foreign_currency_is`
    - account: `source_account_name_contains`, `destination_account_iban_is`
    - properties: `has_no_category`, `has_no_budget`, `has_tag`, `has_subscription`
    - dates: `transaction_date_after` / `before` / `on`, with relative forms like `+3d` or `-2w` and patterns like `xxxx-xx-10`
  - Actions:
    - `set_category`, `set_budget`, `set_tag(s)`, `set_subscription`, `set_piggy_bank`
    - clear variants of category, budget and tags
    - `set_description`, `set_notes`
    - source and destination setters, `swap_accounts`, cash account setters
    - `convert_to_deposit` / `withdrawal` / `transfer`, `delete_transaction`
  - Since v6.1 many actions accept an **expression language** (`app/TransactionRules/Engine/CustomExpressionLanguage.php`) to build values.
  - The engine is `app/TransactionRules/Engine/SearchRuleEngine.php`.
  - Limits: rules cannot create transactions, cannot trigger other rules, and cannot combine AND/OR groups.
- **Why it helps**: It automates categorisation and linking. It is powerful but intimidating. **High** (as a simplified subset).

### Budgets, available amount and auto-budgets

- **What it does**: Sets spending limits per budget for a period and fills them automatically each period.
- **How it works**:
  - Docs: [explanation](https://docs.firefly-iii.org/explanation/financial-concepts/budgets/), [how-to](https://docs.firefly-iii.org/how-to/firefly-iii/finances/budgets/).
  - A budget is a label for **withdrawals only**. A `BudgetLimit` gives it an amount for a date range, per currency. Foreign-currency spending does not reduce a budget in another currency unless you add a limit in that currency.
  - Periods: daily, weekly, monthly, quarterly, half-year or yearly. There is no bi-weekly period. Overlapping limits (monthly plus yearly) both get deducted, and "mixing periods" is officially discouraged.
  - Income never raises a budget automatically.
  - **Auto-budgets** (`app/Models/AutoBudget.php`, `app/Jobs/CreateAutoBudgetLimits.php`, cron `app/Support/Cronjobs/AutoBudgetCronjob.php`) are created only on the first day of the period: Monday for weekly, the 1st of the month for monthly, and so on. If the cron misses that day, nothing is set. There are three types (`AutoBudgetType`):
    - **Reset**: the same amount every period.
    - **Rollover**: `new = amount + max(0, prev_limit + prev_spent)`, where spent is negative. For example 25 unspent grows to 50, 75 and so on; overspending never reduces it.
    - **Adjusted** (correct for overspending): `available = prev_limit + amount + prev_spent`. If `available ≥ amount` or `0 < available < amount`, use `available`. If `available < 0`, use a symbolic 1. Docs example: 25/month, spent 35, next month 15. Note the code path creates no limit when `available` is exactly 0.
  - The **available budget** per currency and period is recalculated from the budget limits in that period (`app/Support/Models/AvailableBudgetCalculator.php`, `AvailableBudgetRepository::recalculateAmount`).
- **Why it helps**: Rollover and overspend correction are the missing piece of CoinKeeper's simple monthly limits. **High**.

### Tags

- **What it does**: Free labels across categories and budgets (for example a holiday or a renovation project).
- **How it works**: The `Tag` model has `tag`, optional `date`, `description`, a location (latitude, longitude, zoom) and attachments (`app/Models/Tag.php`). Tags are many-to-many with transactions. Reports can be filtered by tag, and there is a tag report (`/reports/tag/...`). Rule triggers and actions support tags.
- **Why it helps**: It groups spending by event or project independent of category, for example "Italy trip 2026". **Medium–High**.

### Split transactions

- **What it does**: One real-world event (a supermarket receipt, a salary with deductions) is recorded as a group with several splits, each with its own amount, category, budget and tags.
- **How it works**: `TransactionGroup` holds several `TransactionJournal` splits. Constraints: a withdrawal may split destinations (expense accounts) but must share one source; a deposit must end in one asset account; all splits of a transfer share the same source and destination. Recurring transactions cannot be split. Docs: [transactions explanation](https://docs.firefly-iii.org/explanation/financial-concepts/transactions/).
- **Why it helps**: It gives accurate category totals for mixed receipts. **Medium**, and costly to add to CoinKeeper because it touches transfers and budgets.

### Reports

- **What it does**: Configurable reports over accounts, dates and optional budgets, categories or tags.
- **How it works**: Report types are default financial, audit (start and end balance with before and after balance per transaction), budget, category, tag and expense/revenue. The URL encodes the scope, for example `/reports/default/1,2,3/20180101/20180131`. It accepts magic dates (`currentMonthStart`, `previousYearEnd`, `currentFiscalYearStart` and others) and `allAssetAccounts`, `allBudgets`, `allCategories` or `allTags`. Ranges run from 1 day to 20 years. Docs: [how to read reports](https://docs.firefly-iii.org/how-to/firefly-iii/finances/reports/).
- **Why it helps**: Shareable, bookmarkable reports answer "what did 2025 cost me?" **Medium**. The target user needs a few good presets more than a report builder.

### Data Importer

- **What it does**: A separate app that imports files or provider feeds into Firefly III through its API.
- **How it works**:
  - Docs: [introduction](https://docs.firefly-iii.org/explanation/data-importer/introduction/), [providers](https://docs.firefly-iii.org/how-to/data-importer/import/third-party-providers/), [duplicate detection](https://docs.firefly-iii.org/references/data-importer/duplicate-detection/).
  - It has its own installation and uses OAuth for multi-user setups.
  - Formats: CSV with column-role mapping, and CAMT.05x (ISO 20022 XML).
  - Configuration is saved as a reusable JSON file.
  - Providers:
    - Enable Banking: 2,500+ banks in 29 European countries, free "restricted mode" for your own accounts.
    - GoCardless: the vendor is "shifting away" from the product.
    - SimpleFIN.
    - Lunch Flow (paid).
    - Salt Edge and others, with tutorials of varying completeness.
  - Duplicate detection is either **content-based** (Firefly III hashes the submitted transaction array, so later edits and rules don't affect it, but a changed mapping or capitalisation breaks it) or **identifier-based** (a unique column such as external ID or notes).
  - Automated imports run through the CLI or a POST endpoint plus cron.
  - The docs state that manual transactions will "probably not" match imported ones.
- **Why it helps**: Reusable mapping profiles and CAMT support widen CoinKeeper's import beyond ad-hoc CSV. **Medium–High**.

## Fit for CoinKeeper

| Feature                                     | Usefulness for our user | Model changes?                                      | API / services                                    | UI changes                                 | Effort (S/M/L) | Priority (Now/Next/Later/Skip)                |
| ------------------------------------------- | ----------------------- | --------------------------------------------------- | ------------------------------------------------- | ------------------------------------------ | -------------- | --------------------------------------------- |
| Piggy banks → goals earmarking an account   | High                    | `goals`, `goal_allocations` (+ link to transfer)    | Goals service, suggested monthly amount           | Goals screen, account "earmarked/free" bar | M              | Now                                           |
| Budget rollover / overspend correction      | High                    | `budgets.rollover_mode` enum                        | Computed carry-over at read time                  | Budget row shows "carried +12"             | S              | Now                                           |
| Subscriptions with amount range + matching  | High                    | `recurring_items`, `transactions.recurring_item_id` | Occurrence generator, matcher, rule action        | Bills list + calendar, paid/due/overdue    | M              | Now                                           |
| Richer rules (conditions + actions)         | High                    | `rule_conditions`, `rule_actions` tables            | Rule evaluator on create/import + "apply to past" | Rule builder (simple mode)                 | M              | Next                                          |
| Tags (incl. trips/projects)                 | Medium–High             | `tags`, `transaction_tags`                          | Tag filter, tag report                            | Tag chips, tag report                      | M              | Next                                          |
| Recurring transactions (manual users)       | Medium                  | Reuse `recurring_items` + `auto_record` flag        | "Record due items" action, never silent           | Due list with Record button                | S              | Next                                          |
| Saved import profiles + CAMT.053            | Medium–High             | `import_profiles`                                   | CAMT parser, profile reuse                        | Import wizard "use saved profile"          | M              | Next                                          |
| Report presets (year, category, tag, audit) | Medium                  | None                                                | Report endpoints                                  | Reports page                               | M              | Next                                          |
| Split transactions                          | Medium                  | `transaction_splits` or parent/child rows           | Budget/category sums over splits                  | Split editor                               | L              | Later                                         |
| Webhooks / API tokens                       | Low                     | Tokens table                                        | —                                                 | —                                          | M              | Later                                         |
| Provider bank sync                          | Low                     | —                                                   | —                                                 | —                                          | L              | Skip (region-bound, conflicts with principle) |

### Goals as virtual earmarks (piggy banks)

- **What is it for?** "I have 3,000 in savings: 1,200 emergency fund, 800 holiday, 1,000 free." It is the most direct answer to planning a vacation, house, car or emergency fund, and it matches Firefly's proven model. Usefulness: High.
- **Model changes.**
  - `goals` and `goal_allocations`, as proposed in the Monzo and Qapital documents. `goal_allocations.transaction_id` links an allocation to one leg of a transfer, mirroring Firefly's "link a transfer to a piggy bank".
  - Start with **one account per goal**, which avoids per-account pivots and mixed currencies. Firefly only recently added multi-account piggy banks, and its changelog shows related display bugs.
  - Goal balance = `SUM(goal_allocations.amount_minor)`. Account free balance = account balance (ledger) − Σ goal balances on that account. Both are computed and never stored.
  - Soft delete: `deleted_at` on both tables. Archiving a goal keeps its allocations for history.
- **UI.** Goals page with cards (image, progress, target, date, suggested monthly amount). Account detail gets an allocation bar, and the transfer form gets an optional "Goal" select. Deleting a transfer shows "this also removes 200 from Holiday", and undo restores both.
- **Implementation.**
  1. Migration and contracts.
  2. Service validation, the same guard as Firefly's `canAddAmount`: allocation ≤ min(free balance, target − saved).
  3. The transfer create and update path writes or updates the linked allocation in the same DB transaction.
  4. Add the `suggestedMonthly(targetMinor, savedMinor, today, targetDate)` helper in `packages/shared/src/lib/`, using Firefly's formula with `ceil(months)` and integer rounding up.
  5. UI and tests.
- **Risks.** A later withdrawal can leave an account over-allocated. Show a warning and let the user release allocations rather than blocking ledger edits, because the ledger is the truth. Also decide how CSV-imported transfers get linked (a suggestion in the review inbox).

### Budget rollover and overspend correction

- **What is it for?** Unspent money in a category carries to next month (a sinking fund for irregular spending), or overspending is deducted next month. This fixes the "fresh start every month" problem of CoinKeeper's simple limits. Usefulness: High.
- **Model changes.** `budgets.rollover_mode` enum `none | carry_positive | carry_both` (default `none`). Keep **no stored carry-over column**. Effective limit for month _m_ = `amount_minor(m) + carry(m−1)`, where
  - `carry_positive`: `max(0, effective(m−1) − spent(m−1))` (Firefly "rollover")
  - `carry_both`: `effective(m−1) − spent(m−1)`, which can be negative (Firefly "adjusted"). Floor the result at 0 for display instead of Firefly's symbolic 1.

  Compute recursively over a bounded window, for example back to the first month the mode was enabled, stored as `rollover_since` (date). Everything stays per currency.

- **UI.** Budget row: "Limit 200 + carried 35 = 235". A mode selector sits in the budget edit dialog, with plain-language help. "Copy last month" keeps the mode.
- **Implementation.** Pure helper `effectiveLimits(monthlyRows, spentByMonth, mode)` in `packages/shared` with tests (gaps, deleted budgets, currency). Then the budgets service query returns spent per month for the window, and the UI follows.
- **Risks.** Performance of the recursive window; it needs one grouped SQL query per request, not N queries. Editing an old transaction silently changes today's carry-over. That is correct under ledger-as-truth, but it should be explained in the UI.

### Subscriptions / recurring items with amount range and matching

- **What is it for?** A list of expected bills with "paid / due / overdue" status, expected totals for the month, and price-change detection (paid amount outside `[min, max]`). It feeds "left to spend" and bill goals. Usefulness: High.
- **Model changes.**
  - `recurring_items`: `id`, `user_id`, `name`, `kind` enum `expense | income | transfer`, `account_id`, `payee_id`, `category_id`, `currency`, `amount_min_minor`, `amount_max_minor` (CHECK min ≤ max, a bug Firefly shipped), `frequency` enum `weekly | monthly | yearly`, `interval` (int ≥ 1), `anchor_date`, `weekday_ordinal` (nullable, for "2nd Wednesday"), `weekend_policy` enum `keep | before | after | skip`, `end_date`, `active`, `deleted_at`.
  - `transactions.recurring_item_id` (nullable FK).
  - Occurrences are generated on the fly by a pure function with Firefly's month-end fallback rule.
- **UI.** Bills page (list + calendar), a dashboard widget "Bills left this month: 4 · 612 EUR", and a "Link to bill" action on a transaction.
- **Implementation.** Generator helper and tests, CRUD, then a matcher that runs on create and import (payee match + amount within range + date within ±5 days of an unpaid occurrence). Then the rules extension gains a `link_recurring` action.
- **Risks.** Detection versus manual setup (see the Revolut document). Multi-currency bills should be one item per currency.

## What not to copy

- **Hard-coded auto-budget moments that depend on a cron running that day**: compute at read time instead, since our budgets are SQL over the ledger.
- **Symbolic "1" budget after heavy overspend**: confusing; show 0 and an explanation.
- **Auto-creating ledger rows from recurring rules silently**: it causes duplicates with CSV import. Prefer "due → record" with user confirmation.
- **Full double-entry vocabulary exposed to users (expense/revenue accounts, reconciliation types)**: too expert for our target user. Keep payees and categories.
- **Anti-zero-based stance as dogma**: fine as a default, but don't argue with users in the docs.
- **Bank-provider sync through region-specific aggregators (GoCardless, SimpleFIN, Enable Banking)**: region-bound, costly and fragile (GoCardless is winding down), and conflicts with our no-aggregator principle. CAMT and CSV are the portable path.
- **Report configuration via hand-edited URLs**: power-user only. Offer presets.
- **Mixed-period budgets (monthly + yearly on the same budget)**: officially discouraged even by Firefly.

## Sources

- [GitHub – firefly-iii/firefly-iii repository](https://github.com/firefly-iii/firefly-iii)
- [GitHub – Firefly III changelog (v6.5–v6.7.6)](https://github.com/firefly-iii/firefly-iii/blob/main/changelog.md)
- [GitHub – Releases](https://github.com/firefly-iii/firefly-iii/releases)
- [GitHub – app/Jobs/CreateAutoBudgetLimits.php](https://github.com/firefly-iii/firefly-iii/blob/main/app/Jobs/CreateAutoBudgetLimits.php)
- [GitHub – app/Models/PiggyBank.php](https://github.com/firefly-iii/firefly-iii/blob/main/app/Models/PiggyBank.php)
- [GitHub – app/Repositories/PiggyBank/ModifiesPiggyBanks.php](https://github.com/firefly-iii/firefly-iii/blob/main/app/Repositories/PiggyBank/ModifiesPiggyBanks.php)
- [GitHub – app/Support/JsonApi/Enrichments/PiggyBankEnrichment.php](https://github.com/firefly-iii/firefly-iii/blob/main/app/Support/JsonApi/Enrichments/PiggyBankEnrichment.php)
- [GitHub – app/Models/Bill.php](https://github.com/firefly-iii/firefly-iii/blob/main/app/Models/Bill.php)
- [GitHub – app/Models/Recurrence.php](https://github.com/firefly-iii/firefly-iii/blob/main/app/Models/Recurrence.php)
- [GitHub – app/Repositories/Budget/AvailableBudgetRepository.php](https://github.com/firefly-iii/firefly-iii/blob/main/app/Repositories/Budget/AvailableBudgetRepository.php)
- [GitHub – firefly-iii/docs repository (Markdown sources)](https://github.com/firefly-iii/docs)
- [Docs – Budgets (explanation)](https://docs.firefly-iii.org/explanation/financial-concepts/budgets/)
- [Docs – How to manage budgets (auto-budgets)](https://docs.firefly-iii.org/how-to/firefly-iii/finances/budgets/)
- [Docs – Piggy banks (explanation)](https://docs.firefly-iii.org/explanation/financial-concepts/piggy-banks/)
- [Docs – How to use piggy banks](https://docs.firefly-iii.org/how-to/firefly-iii/finances/piggy-banks/)
- [Docs – Subscriptions (explanation)](https://docs.firefly-iii.org/explanation/financial-concepts/subscriptions/)
- [Docs – How to use subscriptions](https://docs.firefly-iii.org/how-to/firefly-iii/finances/subscriptions/)
- [Docs – Recurring transactions (explanation)](https://docs.firefly-iii.org/explanation/financial-concepts/recurring/)
- [Docs – How to use recurring transactions](https://docs.firefly-iii.org/how-to/firefly-iii/finances/recurring/)
- [Docs – How to use rules](https://docs.firefly-iii.org/how-to/firefly-iii/features/rules/)
- [Docs – All rule triggers](https://docs.firefly-iii.org/references/firefly-iii/rule-triggers/)
- [Docs – All rule actions](https://docs.firefly-iii.org/references/firefly-iii/rule-actions/)
- [Docs – Transactions (explanation, splits)](https://docs.firefly-iii.org/explanation/financial-concepts/transactions/)
- [Docs – How to read reports](https://docs.firefly-iii.org/how-to/firefly-iii/finances/reports/)
- [Docs – Zero based budgeting (author's opinion)](https://docs.firefly-iii.org/explanation/firefly-iii/background/zero-based-budgeting/)
- [Docs – Data Importer introduction](https://docs.firefly-iii.org/explanation/data-importer/introduction/)
- [Docs – Third party data providers](https://docs.firefly-iii.org/how-to/data-importer/import/third-party-providers/)
- [Docs – Data Importer duplicate detection](https://docs.firefly-iii.org/references/data-importer/duplicate-detection/)
- [Docs – Enable Banking tutorial](https://docs.firefly-iii.org/tutorials/data-importer/eb/)
- [Hacker News – Firefly III discussion (Feb 2024)](https://news.ycombinator.com/item?id=39392428)
- [Hacker News – Firefly III discussion (May 2022)](https://news.ycombinator.com/item?id=31561575)
- [DeepWiki – Firefly III rules and automation (search result)](https://deepwiki.com/firefly-iii/firefly-iii/4.2-rules-and-automation)
