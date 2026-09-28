# Lunch Money

> Summary: Lunch Money, the multi-currency-first budgeting app with a developer API: rules, tags, recurring items, splits and groups, rollover and the query tool, and why multi-condition rules, tags, budget suggestions and windowed recurring matching are worth borrowing for CoinKeeper.

## At a glance

|                     |                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type                | Independent, customer-funded budgeting and net-worth web app with mobile companions                                                                                                                                                                                                                                                                                                                              |
| Platforms           | Web (primary); iOS and Android companion apps (review, categorise, notes, recurring; setup is best done on desktop)                                                                                                                                                                                                                                                                                              |
| Pricing (2026)      | Pay-what-you-want annual plan with a minimum of **$60/year since 15 March 2026** (was $50; people who subscribed before that date keep $50 for life), or $10/month. Every price gets every feature. Price-lock guarantee: your price never rises while subscribed. 30-day trial with no card. Billing in USD, CAD or EUR                                                                                         |
| Regions / bank sync | Plaid in the US, Canada and about 17 European countries (France, Netherlands, Spain, Ireland, Germany, Poland, Portugal, Sweden, Denmark, Belgium, Italy, Norway, Austria, Finland, Estonia, Lithuania, Latvia); no sync for investment or loan accounts. Elsewhere: CSV/PDF import, the API, or third-party bridges (Lunch Flow, Synci, Lunch Sync). Lunch Money says almost 40% of its users are international |
| Data entry          | Sync, CSV and PDF import, manual entry, developer API                                                                                                                                                                                                                                                                                                                                                            |
| Best for            | Multi-currency people (expats, travellers, freelancers), spreadsheet-minded users and developers                                                                                                                                                                                                                                                                                                                 |

## What makes it special

Lunch Money began in 2019 as a solo-founder project, is still "fully independent and customer-funded", and designs for people who want to see and shape their data rather than be coached. Its signature is **multi-currency by default**: every transaction keeps its own currency, and totals convert to a chosen primary currency using the _historic_ rate of the transaction's date. That makes it one of the very few mainstream apps that work for someone paid in euros, renting in pounds and holding dollars.

The rest of the product is a toolkit. There is a rules engine with several conditions and several actions, recurring items that match transactions by payee, amount range and date window, tags, split and grouped transactions, budgets with custom periods (weekly, bi-weekly, pay-cycle) and two kinds of rollover, a query tool for ad-hoc analysis, crypto balances and a public API (v2 in open alpha) that a community uses to build bank bridges and tools. Collaboration is free: an unlimited number of contributors, each with their own login.

On Product Hunt, users praise it as "lightweight, fast, intuitive", and value its multi-currency support, analytics and fair pricing. The recurring complaints are a mobile app that is only a companion, occasional bugs, some cluttered screens, slow support responses, and inconsistent sync at some banks. For CoinKeeper it is the closest philosophical match: global, currency-correct, CSV-friendly and transparent.

## Strongest feature

**Currency-correct everything.** Lunch Money supports 160+ currencies. You pick a **primary currency** (used for every summary, budget total and chart) and a list of **supported currencies** (which appear in the amount pickers). Rates are fetched daily, and each transaction converts at the **historic rate for its date**, falling back to the closest available day when a rate is missing. The API exposes both the original `amount` + `currency` and `to_base` (the amount in the primary currency). Crypto balances refresh every few minutes.

For our target user "anywhere in the world" this is essential: travel spending, foreign salaries and savings in a second currency are common, and most competitors (Monarch, Copilot, Simplifi) simply cannot represent them. CoinKeeper already keeps currencies apart and uses manual FX. Lunch Money shows the next step: optional _automatic_ historic rates, and a primary-currency view everywhere. The exact per-transaction behaviour in budgets is not fully documented (unverified).

## Feature deep dive

### Multi-currency with historic rates

- **What it does**: each transaction, account and balance keeps its native currency. Summaries convert to the primary currency.
- **How it works**: rates are fetched daily for 160+ currencies. A missing rate uses the closest day's rate. You can change the primary currency at any time in Settings (whether history is recalculated is not documented). Removing a currency from the "supported" list does not touch existing transactions. There is no documented manual rate override. In the API, `to_base` is a floating-point double and `amount` is a string with 4 decimals.
- **Why it helps**: real life happens in several currencies. **Usefulness: High.**

### Rules engine

- **What it does**: automatically updates transactions that match conditions.
- **How it works**:
  - **Conditions**: payee name (_contains_ and _starts with_ are case-insensitive; _matches exactly_ is case-sensitive), category, notes (same three modes), amount with expense/income direction and an operator (`between`, `>`, `>=`, `<`, `<=`, `=`), day-of-month range (it can wrap across month end, for example the 28th to the 3rd), and account.
  - **Actions**: set payee, notes, category or tags; link or unlink a recurring item; mark reviewed or unreviewed; split the transaction; send an e-mail notification; delete; set uncategorised. _Splitting_ and _updating the original's properties_ are mutually exclusive.
  - **Priority** orders rules that must fire in sequence.
  - **When rules run**: on synced transactions, on manual transactions and on CSV/PDF imports (a toggle). They do not run on API-created transactions by default (also a toggle). The option "Run rule on transaction updates" re-applies rules when a transaction is edited.
  - **Auto-created rules**: changing a category offers to create a rule (can be disabled), as can renaming a payee (preference), matching a new recurring item, or choosing "Create a rule" in the transaction editor.
  - **One-time rules**: create a manual transaction now (for example a cheque you wrote), plus a rule that deletes the manual copy when the imported one arrives. The rule is flagged "delete rule after use".
- **Why it helps**: after a month of rules, categorising an import becomes almost automatic. **Usefulness: High.**

### Recurring items

- **What it does**: represents bills, subscriptions and income that repeat, and links matching transactions.
- **How it works**: the required fields are merchant/payee, an estimated billing date, category, cadence and amount (fixed, or fluctuating with a min–max range). "Paid from account" is optional. In API v2, the cadence is `granularity` (day, week, month, year) × `quantity` (interval) from an `anchor_date`, with an optional `start_date` and `end_date`; for flexible items `amount` is the average of min and max. Creating an item creates a matching rule with a **date window**: for a bill around the 3rd, the rule matches from the 1st to the 5th. It also includes the amount and, if set, the account. Lunch Money then back-links existing matches. Detection suggests new recurring items when a payee and amount repeat on a regular cadence (from sync or CSV). Suggestions wait on a separate page for **approval or rejection**. Linked transactions cannot change category or payee (you edit the recurring item instead) and cannot be split or grouped. Recurring totals feed budget suggestions. A calendar view shows bills relative to paydays.
- **Why it helps**: shows committed money and missing or changed bills, and works with CSV imports as well as sync. **Usefulness: High.**

### Budgets: custom periods, income modes, rollover and the general pool

- **What it does**: category budgets per period, with "Left to budget" / "Overbudgeted" for income that has not been assigned.
- **How it works**:
  - **Periods**: monthly by default (starting on the 1st), or any custom frequency (weekly, bi-weekly or other) with a **"Starting on"** anchor date. For example, bi-weekly from 1 Jan gives 1–14 Jan, 15–28 Jan, 29 Jan–11 Feb. **Changing the period deletes all historical budgets.**
  - **Income modes** (what is "available to budget"): _Expected income_ (forecast), _Actual income_ (received only), or _Larger of expected/actual_.
  - **Rollover**: _same-category_ (a category's leftover or overspend carries into that category) or _to the general pool_ (the leftover joins the pool of unassigned money). General-pool rollover also carries "Left to budget" or "Overbudgeted" into the next period.
  - **Tools**: suggestions (this period's spend, last period's spend, 3-period average, the sum of recurring items expected in the period, presets); **presets** (fixed amount, fill to a target, match history); **move money** between categories or the pool (current period only); copy budgets between periods; **balance adjustments** that reset a category's available balance from a date (for switching apps or fixing errors); budget notes; hiding inactive categories; category-group budgets.
  - **Category flags**: `is_income`, `exclude_from_budget`, `exclude_from_totals`, `is_group`.
- **Why it helps**: fits pay cycles and irregular income and supports sinking funds without full envelope budgeting. **Usefulness: High.**

### Tags

- **What it does**: free labels across categories (for example "Trip to Japan", "Wedding", "Work reimbursable").
- **How it works**: many tags per transaction, bulk add and remove, applied by rules, filterable everywhere, exported to CSV, and usable as query-tool breakdowns (tag, tag/category, category/tag, account/tag).
- **Why it helps**: answers "how much did the vacation cost?", which is essential for goal-oriented users. **Usefulness: High.**

### Split and grouped transactions

- **What it does**: _split_ one transaction into several (a supermarket receipt covering groceries and household items); _group_ several into one (a restaurant bill paid back by friends, or a refund with its purchase).
- **How it works**: splits can be even, custom amounts, or equal payments over time. The parts must sum to the original before you can save. Each part becomes its own row with `split_parent_id`, and the parent is flagged `is_split_parent`. Groups have no size limit. The group has its own date, category, payee, notes and tags, while its members keep their original data "in the background" (`group_parent_id`) and are hidden from normal views but still reachable through filters. Transfers are grouped automatically and show as one zero-sum entry. Transactions linked to a recurring item cannot be split or grouped.
- **Why it helps**: accurate categories without lying about bank amounts, and shared expenses shown at their net cost. **Usefulness: Medium–High.**

### Query tool, stats and trends

- **What it does**: ad-hoc reports over income and expenses.
- **How it works**: output types are Report (a table with totals, averages and counts), Pie, Bar, Line and Stacked bar. Granularity is day, week, month or year. Date ranges can be preset or custom. Filters include or exclude categories, accounts, tags, payees and recurring items. Two-level breakdowns show only in tables. Results export to CSV. Saving queries is not documented (unverified).
- **Why it helps**: power users can answer any question. For a non-expert it is less important than good default reports. **Usefulness: Medium.**

### Import: CSV and PDF

- **What it does**: imports statements from any bank.
- **How it works**: CSV files up to 3 MB and 10,000 rows per upload. Columns are auto-mapped from headers and then adjusted by hand. Amounts can be one signed column, separate inflow/outflow columns, or an amount plus a type column (outflow/inflow/debit/credit). Dates and types can be corrected before import. The optional duplicate filter flags rows whose **date, payee and amount match exactly**; they are excluded but stay visible. **PDF statements** are parsed by a third-party service (Bank Statement Converter); the PDF is not stored by Lunch Money. Rules can run on imports.
- **Why it helps**: this is the global path. **Usefulness: High** (CoinKeeper already has most of this).

### Developer API (v2)

- **What it does**: full read/write access for automations and community bank bridges.
- **How it works**: `https://api.lunchmoney.dev/v2` with a Bearer token from the app's developer page. The resources are `/me`, `/categories`, `/manual_accounts`, `/plaid_accounts`, `/crypto-manual`, `/crypto-synced`, `/balance_history`, `/recurring_items`, `/tags`, `/transactions` (including bulk operations), `/budgets` and `/summary`. The spec is OpenAPI-first, there is a mock server at `mock.lunchmoney.dev/v2` that accepts any token of 11+ characters, and there is an official TypeScript SDK. Transaction `status` is one of `reviewed`, `unreviewed` or `delete_pending`. v2 is not backward-compatible with v1 and is in open alpha.
- **Why it helps**: lets the community fill gaps (regional bank sync) without the vendor. **Usefulness: Low** directly for our user, **Medium** strategically.

### Crypto, net worth and collaboration

- Crypto: synced balances from Coinbase and Kraken (API keys) and Ethereum wallets (address); 300+ coins can be tracked manually; balances only, no transactions. Net worth covers assets minus liabilities across currencies. Collaboration: unlimited contributors with their own logins. A directory of certified financial coaches (paid separately). **Usefulness: Low–Medium.**

## Fit for CoinKeeper

| Feature                                                                                       | Usefulness for our user | Model changes?                                              | API / services                                                      | UI changes                                          | Effort (S/M/L)                     | Priority (Now/Next/Later/Skip) |
| --------------------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------- | ------------------------------ |
| Multi-condition rules (payee/notes/amount/account/day → category, tags, payee rename, review) | High                    | Yes: `rule_conditions`, `rule_actions`                      | Rule evaluator in shared; run on create, import, optionally on edit | Rule builder; "create rule from this change" prompt | M                                  | Now                            |
| Tags                                                                                          | High                    | Yes: `tags`, `transaction_tags`                             | CRUD + filters + report breakdown                                   | Tag picker, filter chips, tag report                | S–M                                | Now                            |
| Recurring items with matching window + suggestions                                            | High                    | Yes: `recurring_series`, `transactions.recurring_id`        | Detector, matcher, occurrence generator                             | Recurring page (list + calendar), suggestions inbox | L                                  | Next                           |
| Split transactions                                                                            | Medium–High             | Yes: split lines                                            | Split service; reports use lines                                    | Split editor on transaction                         | M                                  | Next                           |
| Grouped transactions (net shared costs, refunds)                                              | Medium                  | Yes: `transaction_groups`                                   | Group-aware reports                                                 | Group action in bulk select                         | M                                  | Later                          |
| Rollover: same category or to a general pool                                                  | High                    | Rollover columns (see Monarch doc) + `rollover_target` enum | Budget service                                                      | Rollover toggle with target                         | M                                  | Next                           |
| Income mode (expected / actual / larger)                                                      | Medium                  | `user_settings.plan_income_mode`                            | Budget/plan service                                                 | Setting + explanation                               | S                                  | Later                          |
| Budget suggestions (last period, 3-period average, recurring sum)                             | High                    | No                                                          | Suggestion query                                                    | "Suggest" menu per category                         | S                                  | Now                            |
| Category flags `exclude_from_budget` / `exclude_from_totals`                                  | Medium                  | Two booleans on categories                                  | Budget and report filters                                           | Category editor toggles                             | S                                  | Next                           |
| Custom budget periods (weekly / bi-weekly / pay-cycle)                                        | Medium                  | `budget_period` settings; budgets keyed by period start     | Period calendar helper                                              | Period switcher                                     | L                                  | Later                          |
| Automatic historic FX rates (keep manual override)                                            | Medium                  | `exchange_rates.source` enum `manual                        | provider`                                                           | Daily rate fetch job (provider TBD)                 | Settings toggle; rate source badge | M                              | Later |
| Query tool                                                                                    | Medium                  | No                                                          | Generic aggregate endpoint                                          | Analytics builder                                   | M–L                                | Later                          |
| One-time rules / expected manual entries                                                      | Low–Medium              | `rules.delete_after_use`                                    | Import matcher                                                      | Checkbox                                            | S                                  | Later                          |
| PDF statement import                                                                          | Medium                  | No                                                          | Third-party parser (privacy review)                                 | Import wizard option                                | M                                  | Skip for now                   |
| Personal API tokens                                                                           | Low                     | `api_tokens` (hashed)                                       | Token auth scope                                                    | Settings page                                       | M                                  | Later                          |
| Crypto sync                                                                                   | Low                     | —                                                           | Exchange APIs                                                       | —                                                   | L                                  | Skip                           |

### Multi-condition rules engine

- **What is it for?** Our rules are "case-insensitive substring → category, with priority". Lunch Money shows what makes rules pay off: combine payee **and** amount **and** account (for example "AMAZON, amount > 100 → Electronics"), use day windows for bills, and act on more than the category (tags, a clean payee name, mark reviewed, link recurring). It is the main lever for fast CSV imports without sync. High value.
- **Should we modify the models?** Keep `rules (id, user_id, name, priority, is_active, stop_processing boolean, run_on_update boolean, delete_after_use boolean, created_at, deleted_at)`. Migrate the current `pattern` and `category_id` into child rows:
  - `rule_conditions (id, rule_id, field enum payee|original_payee|memo|amount|account|day_of_month|currency, operator enum contains|starts_with|equals|gt|gte|lt|lte|between, value_text text null, value_minor_from bigint null, value_minor_to bigint null, direction enum expense|income|any)`. Amounts are integer minor units and compared only within the matching `currency`, so a rule on "> 100" needs a currency.
  - `rule_actions (id, rule_id, type enum set_category|set_payee|add_tag|set_memo|mark_reviewed|link_recurring|exclude, ref_id uuid null, value_text text null)`.
  - Conditions are ANDed. Regular expressions stay out (and if ever added, they must live in `patterns.ts`).
- **Should we improve the UI?** A rule builder ("When all of these match… then do…") with a live preview: "matches 23 past transactions". "Apply to existing" is an explicit, undoable bulk edit. When a user recategorises in the review inbox, offer "Always do this for _Payee_?", which pre-fills a rule.
- **How to implement**: (1) migration + backfill from the old columns; (2) a pure `evaluateRules(transaction, rules)` in `packages/shared` (deterministic; the first match wins unless `stop_processing` is false; tests for every operator); (3) call it in the create, import and (optional) update paths; (4) builder UI; (5) docs. **Risks**: rule loops (actions changing fields that other rules test). Evaluate once against the original values. Also performance on large imports: load a user's rules once per import.

### Recurring items with matching windows

- **What is it for?** Bills and subscriptions are the missing half of planning: they drive "left to spend", projected balances, the "missed bill" alert and subscription clean-up. Lunch Money's model (payee + amount range + date window + optional account, suggestions that need approval) works the same whether rows come from CSV or from typing. High value.
- **Should we modify the models?**
  - `recurring_series (id, user_id, name, kind enum expense|income|transfer, payee_id null, category_id null, account_id null, currency char(3), amount_minor bigint, amount_min_minor bigint null, amount_max_minor bigint null, cadence_unit enum day|week|month|year, cadence_interval int >= 1, anchor_date date, starts_on date null, ends_on date null, day_tolerance int default 2, status enum suggested|active|paused|dismissed, created_at, archived_at, deleted_at)`.
  - `transactions.recurring_id uuid null` (FK).
  - Occurrences are **not stored**. They are generated from anchor and cadence and paired with linked transactions: a transaction dated within ±`day_tolerance` of the expected date. The derived states are `paid`, `paid_different_amount` (outside min/max), `upcoming` and `missed` (past the window with no link). This keeps "ledger as truth".
- **Should we improve the UI?** A new Recurring page with a list (next date, amount, yearly cost, status chip) and a month calendar. A **Suggestions** tab lists detected series with Approve and Dismiss. The transaction detail gets "Make recurring" and shows the link. The dashboard gets "Upcoming bills (7 days)".
- **How to implement**: (1) schema; (2) shared `expandOccurrences()` and `matchOccurrence()` with edge-case tests (the 31st, leap years, bi-weekly anchors); (3) a detector job run after import: group by payee, currency and similar amount (±10%), and check interval regularity over ≥ 3 occurrences; (4) matching on insert/import; (5) UI. **Open questions**: whether linking locks category/payee as in Lunch Money (probably not: keep it editable, and suggest updating the series). Handling price changes (a subscription going from €9.99 to €11.99) means prompting "update expected amount?".

### Tags plus split transactions

- **What is it for?** Tags answer project questions ("the Japan trip cost ¥412,000 + €1,900") that categories cannot, and they are the natural way to tie spending to a goal. Splits make a mixed supermarket receipt honest. Together they give users the "where does my money _really_ go" view. High value for tags, medium–high for splits.
- **Should we modify the models?**
  - `tags (id, user_id, name, colour token, created_at, archived_at, deleted_at)` with a unique name per user among live rows. `transaction_tags (transaction_id, tag_id)`.
  - Splits: `transaction_splits (id, transaction_id, category_id, amount_minor bigint, memo, created_at, deleted_at)`. The service enforces `Σ split.amount_minor = transaction.amount_minor`, and splits inherit the parent currency. The ledger row remains the single bank-matching row, so balances are unchanged. Reports and budgets use `COALESCE(split rows, parent row)`: a view `transaction_lines` that yields either the splits or the unsplit transaction. Splits are not allowed on transfers.
- **Should we improve the UI?** A tag picker and chips in the transaction form, table and review inbox; tag filters; a "By tag" report. A split editor with remaining-amount feedback, "split evenly", and category per line; split rows show an indicator in lists.
- **How to implement**: tags first (small), then the `transaction_lines` view and migrating budget and report queries to it, then the split editor. **Risks**: every aggregate query must switch to lines, so add tests that the totals are unchanged for unsplit data. CSV export must decide between one row per line and one row per transaction.

## What not to copy

- **Floating-point `to_base` and decimal-string amounts in the API**: conflicts with our integer-minor-unit invariant. We keep conversions as integers with explicit rounding.
- **Changing the budget period deletes all historical budgets**: destructive; conflicts with soft delete/archive. Periods must be versioned instead.
- **Hard "delete transaction" as a rule action and `delete_pending` status**: we soft-delete only, so any "delete" action must be a soft delete with undo.
- **Plaid-dependent sync (US/CA/EU subset) and paid third-party bridges**: not a base for a global app.
- **Sending PDF statements to a third-party parser**: privacy and data-residency risk. Consider only with local parsing and explicit consent.
- **Crypto exchange API keys stored with the budgeting app**: security burden, and outside our target user's needs.
- **Locking category/payee on transactions linked to recurring items**: surprising for non-experts. Prefer "edit and offer to update the series".
- **Pay-what-you-want pricing mechanics**: a business choice, not a product feature to copy.

## Sources

- [Lunch Money – Home page](https://lunchmoney.app/)
- [Lunch Money Knowledge Base – Rules](https://support.lunchmoney.app/setup/rules)
- [Lunch Money Knowledge Base – Multicurrency](https://support.lunchmoney.app/settings/multicurrency)
- [Lunch Money Knowledge Base – Crypto](https://support.lunchmoney.app/setup/crypto)
- [Lunch Money Knowledge Base – Budget](https://support.lunchmoney.app/finances/budget)
- [Lunch Money Knowledge Base – Budgeting guide, Step 2: Setting up your budget](https://support.lunchmoney.app/guides/budgeting/step-2-setting-up-your-budget)
- [Lunch Money Knowledge Base – Budgeting guide, Step 4: Budgeting](https://support.lunchmoney.app/guides/budgeting/step-4-budgeting)
- [Lunch Money Knowledge Base – Recurring Items](https://support.lunchmoney.app/finances/recurring-items)
- [Lunch Money Knowledge Base – Creating Recurring Items](https://support.lunchmoney.app/finances/recurring-items/creating-recurring-items)
- [Lunch Money Knowledge Base – Transactions (split and group)](https://support.lunchmoney.app/finances/transactions)
- [Lunch Money Knowledge Base – Transaction Actions](https://support.lunchmoney.app/finances/transactions/transaction-actions)
- [Lunch Money Knowledge Base – Other transaction features](https://support.lunchmoney.app/finances/transactions/other-features)
- [Lunch Money Knowledge Base – Analyze (Query Tool)](https://support.lunchmoney.app/finances/analyze)
- [Lunch Money Knowledge Base – Setup (CSV/PDF import)](https://support.lunchmoney.app/setup)
- [Lunch Money Knowledge Base – Automatic Imports (Plaid regions, bridges)](https://support.lunchmoney.app/guides/automatic-imports)
- [Lunch Money blog – Annual plan minimum update (15 Mar 2026)](https://lunchmoney.app/blog/an-update-to-our-annual-plan-minimum-effective-march-15-2026)
- [Lunch Money blog – 11 features you should be using](https://lunchmoney.app/blog/11-lunch-money-features-you-should-be-using-and-why)
- [Lunch Money – Pricing](https://lunchmoney.app/pricing)
- [Lunch Money Developer Docs – v2 API (alpha)](https://alpha.lunchmoney.dev/)
- [Lunch Money v2 OpenAPI specification](https://alpha.lunchmoney.dev/v2/openapi)
- [Lunch Money Developer Portal](https://lunchmoney.dev/)
- [GitHub – lunch-money/developers](https://github.com/lunch-money/developers)
- [GitHub – lunch-money/support (knowledge base sources)](https://github.com/lunch-money/support)
- [Lunch Money on the App Store](https://apps.apple.com/us/app/lunch-money/id6739028463)
- [Product Hunt – Lunch Money reviews](https://www.producthunt.com/products/lunch-money/reviews)
- [Family Money Adventure – Lunch Money review 2026](https://familymoneyadventure.com/lunch-money-review/)
- [Synci – Bank sync for Lunch Money in Europe & NZ](https://synci.io/destinations/lunch-money)
- [Lunch Flow – Global bank sync for Lunch Money](https://www.lunchflow.app/features/lunch-money-integration)
