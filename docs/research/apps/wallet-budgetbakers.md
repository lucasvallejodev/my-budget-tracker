# Wallet by BudgetBakers

> Summary: Wallet by BudgetBakers, the EU feature-rich money manager with manual records and wide bank sync: planned payments, goals, debts, templates, labels and group sharing, and why confirmable planned payments with an expected balance, one-tap templates and debts with people are worth borrowing.

## At a glance

|                     |                                                                                                                                                                                                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type                | Personal and family finance manager (BudgetBakers s.r.o., Czech Republic; also makes Board and ShareCost)                                                                                                                                                              |
| Platforms           | Android, iOS, web app (web.budgetbakers.com); a REST API and MCP server for AI assistants in beta since April 2026                                                                                                                                                     |
| Pricing (2026)      | Free tier for manual tracking; Premium varies by region: the US App Store lists $5.99/month, $14.99/3 months, $24.99/year, $49.99/3 years and a $29.99 lifetime purchase; reviewers quote about €4.49/month in the EU. Group Sharing needs Premium for the owner only. |
| Regions / bank sync | Marketing claims "over 15,000" institutions worldwide; the App Store description says 4,000+; a competitor review describes 5,000+ EU/UK institutions via Salt Edge under PSD2. Strongest in Europe.                                                                   |
| Data entry          | Manual records and templates; file import on web (CSV, XLS, OFX) with saved import rules and a per-account import e-mail address; bank sync (Premium); AI assistants via MCP                                                                                           |
| Best for            | Organised users and households who want one app for records, bills, goals, debts and shared spending, especially in Europe                                                                                                                                             |

## What makes it special

Wallet's philosophy is breadth: it tries to be the single place for everything money-related in a household, not just a transaction list. Around the core ledger of "records" it adds planned payments, budgets, goals, debts, templates, shopping lists, loyalty cards, warranties, a financial-education section ("Wallet Life") and an unusually rich statistics area (balance, cash flow, spending, an "Overlook" forecast, credit and reports that compare periods). Group Sharing lets a Premium owner share chosen accounts and modules with family members who stay on the free plan.

It is also built for many countries: every account has its own currency, exchange rates update overnight but can be overridden, and the company is EU-based with GDPR and ISO 27001 claims. In 2026 BudgetBakers leaned into AI: a beta REST API and MCP server (April 2026) lets Claude, ChatGPT and other clients read data and, if the user opts in per data type, create, update or delete records, capped at 300 requests per hour.

Users on the App Store rate it 4.6 from about 5,900 ratings and praise the "stylish and easy to use" design and the budgeting insights. Complaints cluster around bank connections failing, poor cross-device sync and slow support. Trustpilot is harsher: 2.6/5 from 33 reviews, with 2026 reviews describing crashes at start-up for weeks (Jul 2026) and support replies taking two to three weeks (Feb 2026). An older review reports hundreds of damaged transactions. A reviewer also notes that manual entry on the free tier is "time-consuming", which is why templates matter.

## Strongest feature

**Planned Payments.** A planned payment is a record that repeats on a fixed interval and is either **Manual** (each occurrence waits for your confirmation) or **Automatic** (created without asking). Upcoming payments appear on a home-screen card with dates and a total, and Wallet shows the **expected cash balance after all upcoming payments**. This directly answers the target user's question "can I afford this before payday?" and works perfectly without bank sync, which makes it the single most valuable Wallet idea for CoinKeeper.

## Feature deep dive

### Records: add, clone, split, bulk edit, confirm

- **What it does**: The ledger of income, expenses and transfers, with fast ways to repeat or correct entries.
- **How it works**: Records are added from the "+" button; you can clone a record (save an exact copy or tweak it first), split a record into several categories via the split-arrows icon on the record detail, bulk edit selected records, and resolve duplicates. Bank-synced records cannot be edited or deleted directly (you must disconnect the account first). A **Record Confirmation** green check mark (mobile only) distinguishes reviewed from newly synced records; you confirm by editing and saving or by swiping right.
- **Why it helps**: Clone and split cover real life (a supermarket receipt with food and household items). The confirm check is the same idea as CoinKeeper's `needs_review` inbox. Usefulness: **High** (split and clone are missing in CoinKeeper).

### Templates

- **What it does**: One-tap creation of repetitive records.
- **How it works**: A template stores a name, account (manual accounts only), category, amount, type (expense or income), currency, payee and labels. Picking a template creates a record with those values; you can adjust before saving.
- **Why it helps**: Manual entry speed is the biggest barrier for a manual-first app. "Coffee 2.50", "Bus ticket 1.80" become two taps. Usefulness: **High**.

### Planned payments and planned transfers

- **What it does**: Schedules bills, subscriptions, salary and regular transfers, and forecasts the balance.
- **How it works**: Created like a normal record plus a repeat interval. **Manual** mode: the upcoming occurrence waits for approval; **Automatic** mode: it is created on the date. Once approved, the occurrence becomes a standard record. A home card shows upcoming payments, their dates and total. Wallet shows the expected balance after upcoming payments, and the marketing page says it can detect recurring payments from history and convert an existing record into a planned payment. Edge cases documented: a planned payment set for a day that does not exist in a month (for example the 31st) is **skipped** that month; devices that are offline can create **duplicate** records because they do not know another device already created the occurrence. Planned transfers exist as a separate type.
- **Why it helps**: Bills are the most predictable part of a budget; forecasting them removes nasty surprises. Usefulness: **High**.

### Budgets

- **What it does**: Limits spending per category over a period and forecasts the end-of-period total.
- **How it works**: Weekly, monthly, yearly or custom periods, one-time or recurring. A budget includes every record in the chosen category (optionally narrowed by a label). Budgets are expressed in the main currency. The budget screen shows the percentage spent, total expenses and **estimated expenses at the end of the period**; release 5.7.4 (September 2026) added a "forecasted spend breakdown" explaining how that estimate is calculated. Real-time alerts fire when approaching the limit. BudgetBakers recommends that budgets do not overlap (the same category in two budgets).
- **Why it helps**: The end-of-period forecast warns early instead of after the fact. Usefulness: **High**.

### Goals

- **What it does**: Saving towards a car, trip or emergency fund.
- **How it works**: A goal has a name, a target amount and an optional end date, or you pick a suggested goal. States: active, **paused** (take a break without deleting) and reached. With a target date, Wallet calculates how much to save per period; with a known monthly saving, it estimates how long it will take. When you under-spend a budget, Wallet asks whether to allocate the saved amount to one or more goals. Wallet does **not** move money: the help centre advises transferring goal money to a savings account yourself.
- **Why it helps**: Connects day-to-day discipline ("I spent less on eating out") to a motivating target. Usefulness: **High**.

### Debts (lent and borrowed)

- **What it does**: Tracks simple personal loans with friends and family.
- **How it works**: Record a debt as either money you lent or money you borrowed, with a counterparty and an optional due date. Record each repayment; Wallet shows the amount repaid and the remaining balance, and sends reminders before due dates. A debt can be **closed** when fully repaid or when forgiven; active and closed debts are listed separately. Complex debts (mortgages, bank loans) should be set up as a mortgage account instead.
- **Why it helps**: Lending money to friends is common everywhere and easy to forget. Usefulness: **High**.

### Labels and automatic rules

- **What it does**: Labels add extra dimensions (for example "business", a person's name in a shared group); rules automate categorisation.
- **How it works**: Multiple labels per record; archiving a label hides it from pickers but keeps it in existing records and statistics. **Automatic rules** match keywords in the note or payee (for example Netflix, Vodafone, an account number) and can assign a contact, change the category or add labels, overriding AI categorisation. Important limit: rules apply only to bank-synced records, not manual ones.
- **Why it helps**: Labels answer cross-category questions; archiving without losing history respects past data. Usefulness: **High** for labels, **Medium** for rules (CoinKeeper already has substring rules that apply to imports).

### Multi-currency

- **What it does**: Tracks accounts in different currencies with a main currency for totals.
- **How it works**: One currency per account; a multi-currency bank account needs one Wallet account per currency. You can set your own exchange rates; rates update automatically overnight, and automatic updates can be switched off. A public feedback request asks for currency and rate to be stored per record because converted balances change every day as rates update, which suggests conversions use current rather than historical rates (unverified in the help centre).
- **Why it helps**: Covers expats and travellers, but the daily-drifting converted totals are exactly what CoinKeeper avoids by never summing across currencies. Usefulness: **Medium** (we already have per-currency reporting).

### Import with saved rules and import e-mail

- **What it does**: Imports statements from a bank, spreadsheets or other apps.
- **How it works**: On the web app you set "import rules" for a file (how to read columns) in three steps; the rules are saved per account. Afterwards you can e-mail future statement files to a unique per-account import address and Wallet imports them with the saved rules. Formats: CSV, XLS and OFX. Imports only work for non-bank-connected ("General") accounts. Duplicate handling is not documented on the public pages.
- **Why it helps**: Saved mappings plus a no-login import channel make a CSV-based workflow nearly as convenient as sync. Usefulness: **High**.

### Group Sharing, shopping lists and other modules

- **What it does**: Shares finances with family or flatmates, plus household lists.
- **How it works**: The Premium owner shares selected accounts with a group; members do not need Premium and keep their own personal Wallet, switching between it and the group. Modules can be shared independently (budgets, goals, planned payments, debts, loyalty cards, shopping lists), even without sharing any account, with per-member access rights. A 2017 blog post mentions up to 10 members per group. Shopping lists hold items with prices, show an estimated total, let you tick items off and create a record, and can be shared. "Wallet Life" is an in-app section of articles on handling money better.
- **Why it helps**: Useful for households; shopping lists and loyalty cards drift away from finance. Usefulness: **Medium** (sharing), **Low** (shopping lists, loyalty cards).

### Statistics and reports

- **What it does**: Charts for balance, cash flow, spending by category, an "Overlook" forecast, credit, period-comparison reports and a location heatmap.
- **How it works**: Filterable by period, account, category and label; the web app offers the richest views.
- **Why it helps**: Period comparison ("this month vs last") is what a non-expert understands. Usefulness: **Medium** (CoinKeeper has a dashboard and analytics page already).

## Fit for CoinKeeper

| Feature                                                | Usefulness for our user | Model changes?                                         | API / services                                      | UI changes                                    | Effort (S/M/L) | Priority (Now/Next/Later/Skip) |
| ------------------------------------------------------ | ----------------------- | ------------------------------------------------------ | --------------------------------------------------- | --------------------------------------------- | -------------- | ------------------------------ |
| Templates / quick-add                                  | High                    | Yes: `transaction_templates`                           | CRUD + "create from template"                       | Template chips in the add form, manage screen | S              | Now                            |
| Planned payments (manual/automatic) + expected balance | High                    | Yes: `scheduled_transactions`, link on `transactions`  | Occurrence generation, confirm/skip, forecast query | Upcoming card, schedule form, confirm inbox   | M              | Next                           |
| Debts with people                                      | High                    | Yes: `counterparties`, `debts`, link on `transactions` | Debt balance from ledger, close/forgive             | Debts screen, "lend/borrow" in add form       | M              | Next                           |
| Goals with pause and forecast                          | High                    | Yes: `goals`                                           | Progress and forecast queries                       | Goals screen, dashboard widget                | M              | Next                           |
| Split transactions                                     | High                    | Yes: split lines or parent id                          | Split validation (sum equals parent)                | Split editor                                  | M              | Next                           |
| Clone transaction                                      | Medium                  | No                                                     | Reuse create                                        | "Duplicate" action                            | S              | Now                            |
| Budget end-of-period forecast                          | Medium                  | No                                                     | Linear projection in budget summary                 | "Projected: 540 of 500" on budget card        | S              | Now                            |
| Labels with archive                                    | High                    | Yes: `tags`, `transaction_tags`                        | Tag CRUD and filters                                | Tag input, filter                             | M              | Next                           |
| Saved import mappings per account                      | High                    | Yes: `import_profiles`                                 | Reuse mapping on upload                             | "Use saved mapping"                           | S              | Next                           |
| Import by e-mail                                       | Low                     | Mail ingestion                                         | Inbound mail service                                | —                                             | L              | Later                          |
| Group Sharing with modules                             | Medium                  | Yes (memberships)                                      | Authorisation rewrite                               | Invite, switcher                              | L              | Later                          |
| Shopping lists, loyalty cards, warranties              | Low                     | —                                                      | —                                                   | —                                             | M              | Skip                           |
| REST API / MCP for AI assistants                       | Low (for now)           | Tokens, scopes                                         | Public API                                          | Settings screen                               | L              | Later                          |

### Templates (quick-add)

- **What is this feature for?** Making manual entry take two taps for recurring small purchases. For a manual-first app this is the highest-leverage speed feature.
- **Should we modify the models?** Add `transaction_templates` (`id`, `user_id`, `name`, `account_id`, `category_id` null, `payee_id` null, `kind` enum expense/income/transfer, `amount_minor bigint` null for "ask each time", `currency char(3)`, `transfer_account_id` null, `memo`, `sort_order`, `use_count`, `last_used_at`, `created_at`, `archived_at`, `deleted_at`). Amount sign follows the kind. A template never touches balances; only the transaction it creates does.
- **Should we improve the UI?** Yes: a row of template chips at the top of the add-transaction form (sorted by `use_count`/`last_used_at`), "Save as template" on any transaction, and a small management page under Settings.
- **How it could be implemented**: Migration; Zod contracts; CRUD routes; `POST /transactions/from-template/:id` (or the client pre-fills the form); tests for per-user scoping and archived templates. Risks: templates pointing to archived accounts or categories (hide them, and show why).

### Planned payments with confirmation and expected balance

- **What is this feature for?** Bills, rent, salary and subscriptions: the user sees what is coming and what will be left.
- **Should we modify the models?** Add `scheduled_transactions` (`id`, `user_id`, `account_id`, `category_id`, `payee_id`, `amount_minor`, `currency`, `kind` standard/transfer, `transfer_account_id`, `memo`, `frequency` enum daily/weekly/monthly/yearly, `interval smallint`, `anchor_date`, `end_date` null, `occurrences_left` null, `mode` enum manual/automatic, `month_day_policy` enum skip/last_day, `next_due_date`, `archived_at`, `deleted_at`). Add `transactions.scheduled_transaction_id` and `transactions.scheduled_for date` with a unique index on the pair so an occurrence can never be created twice (this fixes Wallet's offline duplicate problem server-side). Upcoming occurrences are **not** ledger rows until confirmed, so balances stay pure SQL over real transactions; the forecast is `current balance + sum(upcoming occurrences until date)`, per currency.
- **Should we improve the UI?** Dashboard "Upcoming" card (next 30 days, total per currency, overdue highlighted), an "expected balance on <date>" figure per account, a Confirm / Skip / Edit action on each due item (manual mode), and a schedule section in the transaction form ("Repeat monthly").
- **How it could be implemented**: (1) Table + shared date-recurrence helper with explicit month-end policy (Wallet skips the 31st; we should let users choose "last day of month"). (2) A service that lists due occurrences on read; automatic ones are materialised idempotently when the user loads the app or by a scheduled job. (3) Forecast query. (4) UI. Risks: time zones for "due today", editing a series vs one occurrence, and currency for transfers.

### Debts with people

- **What is this feature for?** "I lent Ana 50", "I owe Tom 20 for the concert". Common worldwide, poorly served by bank-centric apps.
- **Should we modify the models?** Add `counterparties` (`id`, `user_id`, `name`, `archived_at`, `deleted_at`) and `debts` (`id`, `user_id`, `counterparty_id`, `direction` enum lent/borrowed, `currency`, `due_date` null, `status` enum open/closed/forgiven, `note`, timestamps, `deleted_at`). Link ledger rows with `transactions.debt_id`. The **outstanding balance is computed** from linked transactions (principal out minus repayments in), never stored. The money leaving the account is not "spending": give linked rows a dedicated system category or exclude them from spending reports, just like transfers. Forgiving a loan creates an explicit expense or income entry for the remaining amount (a documented decision).
- **Should we improve the UI?** A Debts screen with two tabs ("They owe me", "I owe"), per person totals per currency, a "Record repayment" button, and in the add form a "Lend / Borrow" mode.
- **How it could be implemented**: Migration; service computing outstanding per debt in SQL; close automatically when outstanding reaches zero; reports excluding debt-linked rows from spending; tests. Risks: partial repayments in another currency (require same currency or store the original-currency fields).

## What not to copy

- **Automatic rules that only apply to bank-synced records**: rules must work for manual and imported rows alike, as ours do.
- **Converting all currencies with today's rate so totals drift daily**: conflicts with our per-currency reporting and dated manual rates.
- **Records that cannot be edited while an account is connected**: the ledger should always be correctable.
- **Client-side creation of scheduled occurrences that duplicates across offline devices**: materialise on the server with a unique key.
- **Module sprawl (loyalty cards, warranties, shopping lists)**: off-mission for "control where my money goes".
- **Region-dependent bank sync as a Premium hook**: not our base; stay manual + CSV.
- **Aggressive tiering (lifetime, 3-year, monthly) that differs by store**: irrelevant and confusing for a web app.

## Sources

- [BudgetBakers Wallet product page](https://budgetbakers.com/en/products/wallet/) – features, 15,000+ institutions, company, lifetime plan
- [Wallet features overview](https://budgetbakers.com/en/products/wallet/features/) – budgets, bank sync, expense tracking
- [Planned Payments feature page](https://budgetbakers.com/en/products/wallet/features/planned-payments/) – expected balance, recurring detection
- [Budgets feature page](https://budgetbakers.com/en/products/wallet/features/budgets/) – periods, alerts
- [Bank Sync feature page](https://budgetbakers.com/en/products/wallet/features/bank-sync/) – coverage claims
- [MCP integration page](https://budgetbakers.com/en/products/wallet/integrations/mcp/) – permissions, rate limit
- [Help: Rest API/MCP](https://support.budgetbakers.com/hc/en-us/articles/10761479741586-Rest-API-MCP) – April 2026 beta (search result)
- [Help: Setup Planned Payments](https://support.budgetbakers.com/hc/en-us/articles/7149523920786-Setup-Planned-Payments) – manual/automatic, skipped days, offline duplicates (search result)
- [Help: Planned Transfers](https://support.budgetbakers.com/hc/en-us/articles/7184048333842-Planned-Transfers) – planned transfers (search result)
- [Help: Setup Budgets](https://support.budgetbakers.com/hc/en-us/articles/7076953735314-Setup-Budgets) – main currency, estimated expenses, no overlap (search result)
- [Help: Setting up Goals](https://support.budgetbakers.com/hc/en-us/articles/7181571852690-Setting-up-Goals) – pause, forecast, no automatic transfer (search result)
- [Blog: Introducing Goals on Wallet](https://budgetbakers.com/en/blog/2017-08-introducing-savings-goals-wallet/) – goal fields and budget-savings allocation
- [Help: Setting up Debts and Loans](https://support.budgetbakers.com/hc/en-us/articles/7149520322706-Setting-up-Debts-and-Loans) – lent/borrowed, repayments, close/forgive (search result)
- [Help: Using Templates](https://support.budgetbakers.com/hc/en-us/articles/7077050225042-Using-Templates) – template fields (search result)
- [Help: Everything About Transactions](https://support.budgetbakers.com/hc/en-us/articles/7149271363090-Everything-About-Transactions-Add-edit-clone-split-duplicates) – clone, split, bank-record editing (search result)
- [Help: Record Confirmation (green check mark)](https://support.budgetbakers.com/hc/en-us/articles/9740038391186-Record-Confirmation-Green-check-mark) – review state (search result)
- [Help: Utilising Labels](https://support.budgetbakers.com/hc/en-us/articles/7076564578066-Utilising-Labels) – archiving labels (search result)
- [Help: Automatic Rules](https://support.budgetbakers.com/hc/en-us/articles/7149319175826-Automatic-Rules) – bank-only rules (search result)
- [Help: Multiple Currencies & Exchange Rates](https://support.budgetbakers.com/hc/en-us/articles/7149418777746-Multiple-Currencies-Exchange-Rates) – one currency per account, overnight rates (search result)
- [Feedback: per-record currency request](https://feedback.budgetbakers.com/81) – drifting converted balances (search result)
- [Help: Import your transactions or files](https://support.budgetbakers.com/hc/en-us/articles/7077275632274-Import-your-transactions-or-files) – formats, import e-mail (search result)
- [Blog: Import your data via the Web App](https://budgetbakers.com/imports-web-app/) – import rules, e-mail import
- [Help: Everything about Group Sharing](https://support.budgetbakers.com/hc/en-us/articles/7149394922002-Everything-about-Group-Sharing) – Premium owner, members free (search result)
- [Blog: 8 ways to use Group Sharing](https://budgetbakers.com/en/blog/2017-12-sharing-finances-group-sharing/) – modules, 10 members
- [Help: Shopping List](https://support.budgetbakers.com/hc/en-us/articles/7151701340050-Shopping-List) – shopping lists (search result)
- [App Store listing](https://apps.apple.com/us/app/-/id1032467659) – rating, IAP prices, 5.7.4 notes
- [Trustpilot reviews of budgetbakers.com](https://www.trustpilot.com/review/budgetbakers.com) – 2025–2026 complaints
- [Aayush Bhaskar: Wallet review](https://aayushbhaskar.com/wallet-by-budget-bakers-review/) – statistics sections, Wallet Life
- [Finny: Wallet by BudgetBakers review 2026](https://getfinny.app/blog/wallet-budgetbakers-review-2026) – competitor blog; Salt Edge, PSD2 claims
- [Wealthy Pot: Wallet review 2026](https://wealthypot.com/budgeting-apps/wallet-budgetbakers/) – pricing range
