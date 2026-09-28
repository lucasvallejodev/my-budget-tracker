# Toshl Finance

> Summary: Toshl Finance, the playful multi-currency expense tracker (around 200 currencies, historical rates) with one category plus many tags per entry: budgets, repeats, planning and exports, and why tags, per-entry currency with a stored rate and budget time-passed markers with rollover are worth borrowing.

## At a glance

|                     |                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type                | Personal finance, budget and expense tracker with a public REST API (small team; PitchBook lists 4 employees and a Dover, DE address)                                                                                                                                                                                                   |
| Platforms           | Android, iOS, web app; public API (developer.toshl.com)                                                                                                                                                                                                                                                                                 |
| Pricing (2026)      | Free: 2 financial accounts, 2 budgets, manual entry, file import, CSV export. Pro: $2.99/month or $19.99/year (unlimited accounts and budgets, repeating entries, reminders, planning, receipt photos, PDF/Excel/Google/Evernote exports, app lock). Medici: $4.99/month or $39.99/year (Pro plus bank connections). 30-day free trial. |
| Regions / bank sync | Medici only; about 13,000–14,000 connections via Plaid and Salt Edge (plus crypto exchanges such as Coinbase and Bitstamp); strong in the EU where banks must offer APIs                                                                                                                                                                |
| Data entry          | Manual (fast add flow), file import (CSV, OFX, QFX, TSV, TAB, XLS, TXT, QIF) on every plan, bank sync (Medici), API                                                                                                                                                                                                                     |
| Best for            | Travellers, expats and detail-minded users who want accurate multi-currency tracking, tags and flexible budget periods without heavy automation                                                                                                                                                                                         |

## What makes it special

Toshl's philosophy is "make money tracking fun, but keep the data precise". The tone is deliberately light: friendly monster mascots, a lollipop motif in the charts and copy such as "easy as pie" soften a dull chore (the exact role of the monsters inside the app is decorative and not documented in detail). Underneath, the model is rigorous: every entry has exactly one category and any number of tags, a currency object with its own exchange rate, an optional location, repeat rule, reminders and up to four receipt photos.

Multi-currency is Toshl's heritage. It supports roughly 200 currencies (the App Store says 30 cryptocurrencies; the currencies page says more than 50), ounces of gold (XAU) and silver (XAG), hourly rate updates, and **historical daily rates back to 1999**, so a back-dated entry uses the rate of its own date. You can override the rate on any entry, and when changing the main currency you choose how to convert history. In October 2025 the team published a guide for Bulgarian users moving from lev to euro on 1 January 2026: history stays in BGN with conversion values, new entries go in EUR. That is exactly the "never lose the original currency" principle CoinKeeper follows.

User sentiment is positive but small-sample. The App Store rates it 4.7 from about 1,800 ratings, with users praising that it shows "where my money is disappearing to", flexible budgets for biweekly pay and multi-currency support, while mentioning occasional sync lag and crashes. The iOS listing's latest version was 3.5.13 (December 2024) while Android reached 3.5.22 in March 2026, suggesting slow but continuing maintenance. Independent reviews note that the free tier is restrictive and meaningful features need Pro.

## Strongest feature

**Currency handling at the entry level.** Each entry stores its own currency and rate relative to the account currency, suggested from hourly and historical rates but editable, with a "fixed" flag so repeating entries can keep the original rate or take each date's rate. The add screen doubles as a converter showing the amount in both the account currency and the main currency, and the five most recent currencies (and custom rates) are listed first. For a global target user who travels or earns in another currency, this is the most complete and correct model of the four apps researched, and it aligns with CoinKeeper's rule of never summing across currencies without an explicit rate.

## Feature deep dive

### Fast add-entry flow

- **What it does**: Records an expense, income or transfer in a few taps.
- **How it works**: Amount first, then a required category and optional tags; currency defaults to the last used one; account defaults to the previously selected account (Cash is preset); date defaults to today with a quick "yesterday" option. Extras (location, description, repeat, reminders, photos) sit below; repeat, reminders and photos need Pro. Speed tricks: drag the "+" button in a direction to choose expense, income or transfer; a built-in calculator (Σ) and a percentage tool (%) for tips; swipe from the edges to open the menu or accounts. Transfers pick a source and destination account instead of a category.
- **Why it helps**: Sticky defaults (last currency, last account) are exactly what makes manual entry bearable, especially on a trip. Usefulness: **High**.

### Categories and tags

- **What it does**: Categorises every entry once and describes it further with any number of tags.
- **How it works**: Exactly one category per entry (required); zero or more tags. Tags are filed under categories only to improve suggestions: after you pick a category, that category's tags are suggested first, **weighted by how often you use them**, but any tag can be used with any category. Deleting a category asks you to move its entries elsewhere or delete them; deleting a tag only removes the tag from entries. Categories merge by drag and drop (the target's name survives); tags merge via "Merge with tag". Bulk tools add a tag to all entries that already have another tag, or to all entries in a date range. Toshl also learns from corrections, matching changed categories and tags to parts of the description.
- **Why it helps**: Categories answer "what kind of spending"; tags answer "for what, where, with whom" (a trip, a project, a child). This is the cleanest answer to events, labels and sub-categories in one mechanism. Usefulness: **High**.

### Multi-currency and exchange rates

- **What it does**: Tracks any currency accurately and reports in a main currency.
- **How it works**: Three levels: **main currency** (all graphs and sums), **account currency** and **entry currency** (becomes the "active" currency for the next entry). The entry's `currency` object stores `code`, `rate` (to the account currency), a read-only `main_rate` and `fixed`. Rates come from Open Exchange Rates, updated hourly, with history back to 1999; the suggested rate is shown in grey when you type a custom one, and custom rates appear in the recently used list. For repeating entries in a foreign currency you choose a fixed rate or a new rate per occurrence. Changing the main currency offers three modes: historical rates (recommended), one rate for all, or change the symbol only (to fix a setup mistake). The help notes that custom rates can be lost when switching main currency repeatedly. Currencies have a type (fiat, commodity, crypto, deprecated) and a precision of 0–9 decimals.
- **Why it helps**: Accuracy for travellers and expats, plus clean handling of currency changes like Bulgaria's euro adoption. Usefulness: **High**.

### Budgets

- **What it does**: Limits spending over any period, with rollover and fine-grained filters.
- **How it works**: Amount types: a **static** number; **income minus** a number; **income plus** a number; or a **percentage of income** (the API names these `regular`, `delta` and `percent`). Periods: one-time, daily, weekly, monthly, yearly with an interval (for example every 2 weeks), or custom date ranges. **Rollover** ("move remaining funds to the next period") carries surplus or deficit forward; an override lets you set a custom rollover amount. Filters: include or exclude categories, tags and accounts (the API uses a `!` prefix for exclusion). A budget has its own currency and can accept entries in any currency. Status: active, inactive, archived. Only one active monthly "all expenses" budget is allowed per user. The API returns `amount` (spent) and `planned` (future planned expenses in the period).
- **How it looks**: A blue bar shows what remains; overspending appears in red from the left. A dark grey "today" lollipop marks time passed; compare it with the blue "remaining" lollipop: aligned means on track, grey ahead means under-spending, blue behind means over-spending. Red columns show daily expense sums; a history graph shows past periods (budgeted, spent, saved or overspent), and "Included expenses" lists the entries.
- **Why it helps**: Biweekly salaries, percentage-of-income saving and trip budgets in a foreign currency are all first-class. The time-passed marker is the most intuitive pacing signal of the four apps. Usefulness: **High**.

### Repeating entries and reminders (bills)

- **What it does**: Automates bills and salary and reminds you to pay.
- **How it works**: Frequencies: daily, weekly, monthly, yearly, weekdays, weekends, or custom (every N units; API interval 1–255, with `byday`, `bymonthday` and `bysetpos` for patterns like "last Friday"). End: never, on a date, or after N repetitions (the first counts). Future occurrences are generated as **planned entries** marked with an "R" icon. Editing asks whether to change only this entry, all repetitions or only future ones. Weekly, monthly and yearly repeats automatically get two reminders (one day before and on the due date), editable, up to five per entry, each with a period, number and time. An entry's `completed` flag records whether a bill with reminders has been paid. Pro only.
- **Why it helps**: The this / all / future edit choice and the paid flag are the details that make recurring items trustworthy. Usefulness: **High**.

### Planning (forecast)

- **What it does**: A year view of past and future months: balances, spending, income and net worth.
- **How it works**: Combines **planned entries** (future entries you typed or that repeats generated) with **estimates** that project past trends forward. Monthly balance = incomes this month − expenses this month. Past months are drawn in full colour, future months as semi-transparent columns; pressing a column shows a lollipop with exact values, 12-month averages (past) or estimates (future). Planned and estimates can be toggled; filters by category, tag, account and location apply. The API returns, per month, `sum`, `planned` and `estimated` for expenses, incomes, balance and net worth, plus averages and min/max ranges. Pro only.
- **Why it helps**: Shows whether you are on course to save for a goal and when a tight month is coming. Usefulness: **Medium** now (it needs recurring entries first), **High** later.

### Exports and reports

- **What it does**: Gets data out for printing, spreadsheets or an accountant.
- **How it works**: Free: CSV. Pro/Medici: PDF (print-optimised with category, tag and account summaries), Excel, Google Sheets and Evernote. Filters: accounts, categories, tags, locations; periods: current month, custom range or all data. Automatic monthly e-mail reports are available.
- **Why it helps**: Data portability builds trust; a monthly e-mailed summary is a gentle habit loop. Usefulness: **Medium**.

### Locations and attachments

- **What it does**: Remembers where you spent and keeps receipt photos.
- **How it works**: An entry can carry coordinates and a Foursquare venue id; reports and exports filter by location. Up to 4 images per entry (Pro), with upload states new, uploaded, error, deleting.
- **Why it helps**: Receipts help with warranties and disputes; location is nice-to-have. Usefulness: **Medium** (attachments), **Low** (location).

### Public API

- **What it does**: Lets developers and power users read and write their data.
- **How it works**: OAuth2 bearer tokens or long-lived personal tokens; resources for entries, accounts, categories, tags, budgets, currencies, planning, exports and bank connections; ISO 8601 dates; pagination (up to 200 per page); ETags on currencies; rate-limit headers. Entry amounts are decimal numbers (expenses negative).
- **Why it helps**: Openness and portability. Usefulness: **Low** for the target user, but CoinKeeper already has a REST API that could be exposed with personal tokens later.

## Fit for CoinKeeper

| Feature                                                                | Usefulness for our user | Model changes?                                       | API / services                                      | UI changes                            | Effort (S/M/L) | Priority (Now/Next/Later/Skip) |
| ---------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------- | --------------------------------------------------- | ------------------------------------- | -------------- | ------------------------------ |
| Tags alongside categories (with suggestions and merge)                 | High                    | Yes: `tags`, `transaction_tags`                      | Tag CRUD, merge, bulk tag, filter and report by tag | Tag input, tag filter, tags page      | M              | Now                            |
| Sticky defaults in add form (last account, last currency, "yesterday") | High                    | Optional `user_settings` fields                      | None                                                | Transaction form                      | S              | Now                            |
| Per-entry currency and rate, fixed-rate repeats                        | High                    | Yes: original amount/currency/rate on `transactions` | Rate suggestion from `exchange_rates`               | Currency picker with converter        | M              | Now                            |
| Budget "time passed" marker and pacing                                 | High                    | No                                                   | Budget summary adds period progress                 | Budget bar marker                     | S              | Now                            |
| Budget rollover                                                        | High                    | Yes: `budgets.rollover`                              | Carry computed from previous months in SQL          | Rollover toggle, carried amount shown | M              | Next                           |
| Budget filters by tag/account, exclusions                              | Medium                  | Yes: budget filter tables                            | Budget query joins                                  | Budget editor                         | M              | Later                          |
| Percentage-of-income budgets                                           | Medium                  | Yes: `budgets.amount_type`, `percent`                | Limit computed from month income                    | Budget editor                         | M              | Later                          |
| Repeating entries with this/all/future edits, reminders, paid flag     | High                    | Yes: `scheduled_transactions`                        | Occurrence service                                  | Upcoming list, edit dialog            | M              | Next                           |
| Planning / forecast year view                                          | Medium                  | No (uses schedules)                                  | Forecast query                                      | Planning page                         | M              | Later                          |
| Change main currency with conversion modes                             | Medium                  | No (per-currency data unaffected)                    | Settings update                                     | Settings dialog                       | S              | Next                           |
| Exports (PDF, monthly e-mail report)                                   | Medium                  | No                                                   | Report rendering, mail                              | Export page                           | M              | Later                          |
| Receipt attachments                                                    | Medium                  | Yes: `attachments`                                   | File storage                                        | Upload in form                        | M              | Later                          |
| Locations                                                              | Low                     | —                                                    | —                                                   | —                                     | M              | Skip                           |
| Bank connections via Plaid/Salt Edge                                   | Low                     | —                                                    | —                                                   | —                                     | L              | Skip                           |

### Tags alongside categories

- **What is this feature for, and how useful could it be?** Categories stay a small, stable taxonomy for budgets and reports; tags capture everything else: a trip ("Lisbon 2026"), a person ("kids"), a project ("renovation"), a habit ("takeaway"). One mechanism covers events, labels and sub-category detail across all four apps researched. Very useful and a prerequisite for trip reports, tag budgets and better search.
- **Should we modify the models?** Add `tags` (`id uuid`, `user_id`, `name citext`, `colour` from the palette tokens or null, `category_id` null used only for suggestions, `archived_at`, `deleted_at`, unique `(user_id, lower(name))` where not deleted) and `transaction_tags` (`transaction_id`, `tag_id`, primary key on the pair). Both per-user; deleting a tag is a soft delete that hides it from pickers while history still shows it (or offers "remove from entries"). Tag reports are SQL over the ledger grouped by currency; transfers excluded.
- **Should we improve the UI?** Yes: a tag input with autocomplete in the transaction form (suggest tags linked to the chosen category first, ordered by usage count), tag chips in transaction lists, a tag filter on the transactions and analytics pages, a Tags management page (rename, merge, archive), and bulk "add tag" on selected transactions and in the import review.
- **How it could be implemented**: (1) Migration and Zod contracts in `packages/shared`. (2) Tag CRUD plus `POST /tags/:id/merge`. (3) Extend transaction create/update/list with `tagIds` and a `tag` filter. (4) Tag summary endpoint (per currency, per category). (5) UI components in `apps/web/src/components/finance/`. (6) Tests for scoping, merge and soft delete. Risks: tag explosion (offer merge and suggestions), and deciding whether rules can add tags (Wallet's rules can; a later extension of our `rules`).

### Per-entry currency with stored rate and fixed-rate repeats

- **What is this feature for?** Recording a purchase in the currency it happened in while the ledger stays in the account's currency, with the actual rate, and letting repeats either keep that rate or follow each date's rate.
- **Should we modify the models?** Keep `transactions.amount_minor` + `currency` as ledger truth. Add nullable `original_amount_minor bigint`, `original_currency char(3)`, `original_rate numeric(20,10)` (decimal string in the API, never a float), all-or-nothing check constraint. For schedules add `scheduled_transactions.rate_mode` enum `fixed`/`per_occurrence`. Rate suggestions come from our manual `exchange_rates` table by date; automatic rates stay out of scope until we choose a provider.
- **Should we improve the UI?** The transaction form gets a currency selector with the five most recent currencies on top; when it differs from the account currency, show a live "= X in account currency" line with an editable rate (suggested rate in grey) and the converted main-currency amount as secondary text.
- **How it could be implemented**: Migration; a tested helper in `packages/shared/src/lib/` converting between minor units of currencies with different exponents using the rate and banker's or half-up rounding (documented); contract and service changes; UI. Risks: exponent differences (JPY 0, KWD 3), imports that contain both amounts, and not re-rating historic rows when the manual rate table changes.

### Budget pacing and rollover

- **What is this feature for?** Knowing mid-month whether you are ahead or behind, and letting a careful month fund a heavier one.
- **Should we modify the models?** Pacing needs nothing: expected spend so far = `limit × days_elapsed / days_in_period`, compared with actual spent (SQL). Rollover needs `budgets.rollover boolean default false` (and later `rollover_override_minor bigint null`). The carried amount is **computed** from the previous months' limits minus spent in SQL (a recursive or windowed query per category and currency), never stored as a balance, keeping the ledger-as-truth invariant.
- **Should we improve the UI?** Add a "today" marker on each budget bar, a label such as "3.20 ahead of pace" or "12.00 behind", and when rollover is on, show "limit 300 + 45 carried = 345".
- **How it could be implemented**: Pacing: extend the budget summary service and component (small). Rollover: migration, a SQL function or query with tests covering negative carry, months with no budget row (does the chain break?), and copying last month's budget. Open question: should a deficit carry forward (Toshl does both surplus and deficit)?

## What not to copy

- **Bank connections via Plaid and Salt Edge as a premium tier**: region-dependent aggregators, explicitly outside our base.
- **Decimal (floating-point-looking) amounts in the API**: we keep integer minor units.
- **Converting everything into one main currency for all graphs**: we report per currency and offer a converted total only with explicit rates.
- **Losing custom rates when the main currency changes**: store rates with the entry so nothing depends on the main currency.
- **Free tier capped at 2 accounts and 2 budgets**: a paywall pattern irrelevant to our product and a poor first experience.
- **Foursquare venue lookups for locations**: third-party dependency with privacy cost for little value.
- **Mascot-heavy tone everywhere**: charming, but keep CoinKeeper's tone calm and clear; borrow only small moments of delight.

## Sources

- [Toshl pricing](https://toshl.com/pricing/) – Free, Pro, Medici features and limits
- [Toshl home page](https://toshl.com/) – features and tone
- [Toshl currencies page](https://toshl.com/currencies/) – hourly rates, history since 1999, crypto
- [Toshl budgeting page](https://toshl.com/budgeting/) – periods, rollover, income-based budgets
- [Toshl bank connections page](https://toshl.com/bank-connections/) – connection methods
- [Blog: FAQ](https://toshl.com/blog/frequently-asked-questions-faq/) – Plaid and Salt Edge, exports, rollover
- [Blog: Currencies in Toshl (web)](https://toshl.com/blog/currencies-in-toshl-finance-ounces-of-gold-welcome-web-app/) – currency hierarchy, custom and fixed rates, main-currency change
- [Blog: Bulgaria joins the euro area](https://toshl.com/blog/bulgaria-joins-the-euro-area-on-jan-1st-2026-how-to-handle-the-change-in-toshl/) – October 2025 guidance
- [Blog: How to add expenses, incomes and transfers (iOS)](https://toshl.com/blog/how-to-track-expenses-incomes-and-transfers-ios/) – add flow and defaults
- [Blog: Edit categories and tags](https://toshl.com/blog/edit-categories-and-tags-web-app/) – tag and category mechanics
- [Blog: Spending categories that learn from you](https://toshl.com/blog/spending-categories-that-learn-from-you/) – correction learning
- [Blog: Merge, add and remove multiple tags](https://toshl.com/blog/merge-add-and-remove-multiple-tags/) – bulk tagging (search result)
- [Blog: How to set up your budgets (web)](https://toshl.com/blog/how-to-set-up-your-budgets-and-control-your-spending-web-app/) – budget amount types, filters
- [Blog: How to use the budgets (web)](https://toshl.com/blog/how-to-use-the-budgets-web-app/) – bars, lollipops, colours
- [Blog: Repeating entries (web)](https://toshl.com/blog/organize-bills-and-salary-by-repeating-entries-automatically-web-app/) – frequencies, reminders, edit scope
- [Blog: Financial planning (web)](https://toshl.com/blog/financial-planning-web-app/) – planned entries and estimates
- [Blog: Financial data exports (web)](https://toshl.com/blog/financial-data-exports-web-app/) – formats and filters
- [Blog: Tutorials and manuals](https://toshl.com/blog/tutorials-manuals/) – tutorial index
- [Developer docs overview](https://developer.toshl.com/docs/) – authentication, resources
- [Developer docs: entries](https://developer.toshl.com/docs/entries/) – entry fields, repeat and reminder objects
- [Developer docs: budgets](https://developer.toshl.com/docs/budgets/) – budget types, rollover, filters, limits
- [Developer docs: planning](https://developer.toshl.com/docs/planning/) – sum, planned, estimated
- [Developer docs: currencies](https://developer.toshl.com/docs/currencies/) – currency types and precision
- [App Store listing](https://apps.apple.com/us/app/toshl-finance-best-budget/id921590251) – rating, prices, reviews
- [Trustpilot reviews of toshl.com](https://www.trustpilot.com/review/toshl.com) – small-sample sentiment
- [SuperMoney: Toshl reviews](https://www.supermoney.com/reviews/money-management/toshl) – restrictive trial complaint
- [PitchBook: Toshl Finance profile](https://pitchbook.com/profiles/company/54459-91) – company size (search result)
- [Uptodown: Toshl Finance for Android](https://toshl-finance.en.uptodown.com/android/download) – Android version 3.5.22, March 2026 (search result)
