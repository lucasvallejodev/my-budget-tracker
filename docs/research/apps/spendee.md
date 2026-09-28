# Spendee

> Summary: Spendee, the design-led wallet-based expense tracker with shared wallets: wallets, multi-currency entry, budgets, labels and sharing, and why per-transaction foreign currency with an editable remembered rate, shared cash wallets and per-day budget allowances are worth borrowing for CoinKeeper.

## At a glance

|                     |                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type                | Mobile-first personal expense tracker and budget app (SPENDEE a.s., Prague)                                                                                                                                                                                                                                                                                          |
| Platforms           | iOS, Android, web app (app.spendee.com; budgets are "coming to web soon")                                                                                                                                                                                                                                                                                            |
| Pricing (2026)      | Free (1 cash wallet, 1 budget); Plus $1.99/month or $14.99/year (unlimited cash wallets and budgets, shared wallets); Premium $5.99/month or $35.99/year (adds bank, e-wallet and crypto connections, Magic AI Scan). 7-day trial; prices vary by country and are bought only through the app stores. The US App Store also lists lifetime options ($44.99–$119.99). |
| Regions / bank sync | Reviewers cite 2,000–2,500+ banks worldwide plus PayPal and crypto exchanges; coverage varies by country and sync reliability is a recurring complaint                                                                                                                                                                                                               |
| Data entry          | Manual (cash wallets), file import on web (XLS, XLSX, CSV), bank sync (Premium), AI receipt scan (Premium)                                                                                                                                                                                                                                                           |
| Best for            | Individuals and couples who want a beautiful, simple tracker with separate wallets for daily life, trips and shared expenses                                                                                                                                                                                                                                         |

## What makes it special

Spendee's philosophy is "wallets first, then look pretty". Every pot of money is a wallet with its own currency; you can keep one for daily cash, one for a trip, one shared with a partner, and see them together in an "All wallets" overview converted into a main currency. The premium plan page explicitly pitches unlimited wallets as a way to separate everyday spending from one-off events such as a vacation or a wedding, which is the same job other apps solve with "events" or "tags".

The app has always sold itself on design. It won the Mobile UX Awards in 2017 and its store listing emphasises colourful charts and a clean overview. In September 2026 the company shipped **Spendee 6**, a large redesign that promises a single-screen flow for adding a transaction, quick actions for transactions, wallets and budgets, AI receipt scanning, automatically detected transfers between accounts and better historical import for connected banks (App Store, version 6.0.3 on 7 Sep 2026, 6.0.4 shortly after).

Sentiment is split between the store and independent review sites. The US App Store rating is 4.6 from about 6,300 ratings, with praise for the intuitive interface, clear visualisations and no ads. On Trustpilot the picture is much worse: 2.4/5 from only 18 reviews, where 2025–2026 reviewers report bank sync that stopped working for weeks, one user who says years of data were deleted (Feb 2026) and another saying the app is "getting worse and slower with every update" (Aug 2026). App Store reviewers also mention crashes, slow transaction entry and graph bugs after updates, and ask for a way to spread a large purchase over several months.

The lesson for CoinKeeper: users love the clarity and the wallet metaphor, and leave when sync and data integrity fail. A manual-first, ledger-as-truth design avoids the most common reason people leave.

## Strongest feature

**Shared wallets with multi-currency wallets underneath.** A Plus or Premium owner can invite anyone by email to a cash wallet; guests use the free app, and everyone can add, edit or delete any transaction in that wallet. Combined with per-wallet currency and per-transaction foreign-currency entry, this makes Spendee a practical tool for a couple's household pot or a group trip. For our target user (a non-expert anywhere in the world), the multi-currency half matters immediately (travel, living abroad, paid in another currency); the sharing half matters for couples and flatmates but requires a big change to our per-user model.

## Feature deep dive

### Wallets and the All Wallets overview

- **What it does**: Groups money into wallets: manual "cash" wallets, connected bank wallets, e-wallets (PayPal) and crypto wallets. The overview shows all or selected wallets together.
- **How it works**: Each wallet has a currency chosen at creation. The wallet currency can only be changed while the wallet has no transactions; after that you must create a new wallet. The overview uses a main ("All") currency set in Settings; you can choose which wallets are included (the help centre suggests excluding wallets "that make your data inaccurate"), merge categories across wallets, and pick a period: weekly, monthly, yearly, custom or all time. Free users get one cash wallet; Plus/Premium are unlimited.
- **Why it helps**: Separating money by purpose (daily, trip, shared) is intuitive for non-experts, and the include/exclude switch keeps reports honest. Usefulness: **High** (we already have accounts; the "include in overview" idea maps to our `counts_in_spending`).

### Multi-currency entry with editable exchange rate

- **What it does**: Lets you record, say, a USD expense in a EUR wallet and see everything in your main currency.
- **How it works**: Rates are updated automatically every 24 hours. When a transaction's currency differs from the wallet or main currency, you can set your own rate for that transaction and choose to remember it for next time. Transactions are stored in the wallet currency and displayed converted into the main currency in the overview and timeline; changing the main currency recalculates all views. Third-party reviews cite support for 160+ currencies (unverified on Spendee's own pages). How transfers between wallets of different currencies are handled is not documented.
- **Why it helps**: A traveller pays in the local currency, the bank charges in the home currency, and the exact rate actually paid differs from the market rate. Letting the user type the real rate once and reuse it is the right level of control. Usefulness: **High**.

### Shared wallets

- **What it does**: Tracks a household or group pot together; "always know who paid for what".
- **How it works**: Owner opens a cash wallet, taps the three-dot menu, **Invite People**, enters an email; the invitee accepts in the app or by email. Only the owner needs Plus/Premium. Owner and guests have equal transaction rights (add, edit, delete any transaction regardless of author). Only the owner can create, edit or delete categories. Bank wallets cannot be shared. Budgets are not shared: each member creates their own budgets over the shared wallet, and free members are still limited to one budget.
- **Why it helps**: Couples and flatmates want one list both can edit. The deliberately flat permission model keeps it simple, but there is no settle-up or "who owes whom" calculation. Usefulness: **Medium** (valuable for couples; a large architectural change for us).

### Budgets with daily allowance

- **What it does**: Sets a spending limit and tells you how much you can spend per day to stay on track.
- **How it works**: When creating a budget you choose expense categories (or all expenses), a recurrence, the wallets it covers, a start date, a name and a limit. Notifications fire at **75%** and **90%** of the limit. The budget screen shows a per-day allowance for the rest of the period. Free: 1 budget; paid: unlimited. Budgets are not yet available on the web app.
- **Why it helps**: "You can spend 12.40 per day" is a far more actionable number for a non-expert than "63% used". Usefulness: **High**.

### Scheduled transactions (recurring and one-time future)

- **What it does**: Records rent, insurance and other regular payments ahead of time.
- **How it works**: More → Scheduled Transactions, with two sections: **Recurring** (a transaction plus a recurring rule) and **One-Time** (future non-recurring transactions). They can be edited from the More menu, a wallet's Scheduled section or the home screen. Recurring transactions work only in manual (cash) wallets. Frequency options, reminder behaviour and whether occurrences post automatically are not documented publicly (unverified).
- **Why it helps**: Removes repetitive entry and shows upcoming commitments. Usefulness: **High**.

### Labels

- **What it does**: Adds free-form extra information to a transaction, on top of its single category.
- **How it works**: More → Labels → (+). Multiple labels per transaction. The help centre suggests using them as sub-categories (e.g. "pizza", "restaurant", "takeaway" under Food & Drink) or to track specific shops or behaviours. Import supports an optional labels column. Whether reports can filter by label is not documented.
- **Why it helps**: Lets the user answer questions categories cannot ("how much did the Lisbon trip cost?", "how often do I order takeaway?"). Usefulness: **High**.

### Transfers

- **What it does**: Moves money between the user's own wallets.
- **How it works**: Plus button → **Transfer** → amount, outgoing and incoming wallet; or "Out of Spendee" for money leaving the app's scope. Transfers are excluded from income and expense categories and reports but appear in cash flow. A wrongly linked transfer must be converted back to an income or expense before relinking. Spendee 6 adds automatic transfer detection for connected accounts.
- **Why it helps**: Same invariant as CoinKeeper (transfers never count as spending). Usefulness: **High** (we already have it).

### Data import (web)

- **What it does**: Brings history in from a bank export or another app.
- **How it works**: Web app only; XLS, XLSX or CSV up to 10 MB. Required columns: date format, date, category name, amount; optional labels. Only into cash wallets. No duplicate detection (the help centre advises importing only missing rows) and no transfer recognition (convert manually afterwards).
- **Why it helps**: Essential for a manual-first world, but Spendee's version is weaker than CoinKeeper's (we already have mapping, duplicate detection and transfer suggestions). Usefulness: **High** (already covered).

### Magic AI Scan

- **What it does**: Creates a transaction from a receipt photo.
- **How it works**: Plus → Magic AI Scan → photograph the receipt; amount, category and labels or notes are filled in. Reads receipts in multiple languages. Premium only; usage caps are not documented.
- **Why it helps**: The fastest possible manual entry, especially abroad. Usefulness: **Medium** (valuable, but depends on an AI provider and costs money per scan).

### Privacy touches: hide amounts on shake, passcode

- **What it does**: Hides balances and amounts with a shake of the phone; app lock with passcode, Touch ID or Face ID.
- **How it works**: More → toggle **Hide Amounts on Shake**; shaking hides all balances and transaction amounts, shaking again reveals them.
- **Why it helps**: People check finances on the bus or at work. A web equivalent (a keyboard shortcut or eye icon that blurs amounts) is cheap. Usefulness: **Medium**.

## Fit for CoinKeeper

| Feature                                                           | Usefulness for our user | Model changes?                                            | API / services                                                                           | UI changes                                            | Effort (S/M/L) | Priority (Now/Next/Later/Skip) |
| ----------------------------------------------------------------- | ----------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------- | ------------------------------ |
| Per-transaction foreign currency with editable, rememberable rate | High                    | Yes: original amount, currency and rate on `transactions` | Transaction create/update accepts original amount; rate suggestion from `exchange_rates` | Currency picker and rate field in transaction form    | M              | Now                            |
| Daily allowance in budgets                                        | High                    | No                                                        | Budget summary returns remaining per day                                                 | Budget card shows "per day left"                      | S              | Now                            |
| Budget alert thresholds (75/90%)                                  | Medium                  | Optional per-budget threshold                             | Existing budget status; later notifications                                              | Status chips already exist (80%)                      | S              | Next                           |
| Labels / tags                                                     | High                    | Yes: `tags`, `transaction_tags`                           | Tag CRUD, filter by tag, report by tag                                                   | Tag input in transaction form, tag filter, tag report | M              | Next                           |
| Scheduled (recurring + one-time future) transactions              | High                    | Yes: `scheduled_transactions`                             | Materialisation service                                                                  | Upcoming list, schedule form                          | M              | Next                           |
| Include/exclude accounts in overview                              | Medium                  | Already have `counts_in_spending`                         | Reuse                                                                                    | Toggle in overview filter                             | S              | Now                            |
| Shared wallet (account shared with another user)                  | Medium                  | Yes: account membership, author column                    | Authorisation changes throughout                                                         | Invite flow, member list, "added by"                  | L              | Later                          |
| Hide amounts toggle                                               | Medium                  | No (per-user setting optional)                            | None                                                                                     | Eye toggle blurs amounts                              | S              | Next                           |
| Receipt AI scan                                                   | Medium                  | Attachments table                                         | External AI/OCR provider                                                                 | Scan flow                                             | L              | Later                          |
| Crypto / e-wallet connections                                     | Low                     | —                                                         | Third-party aggregators                                                                  | —                                                     | L              | Skip                           |

### Per-transaction foreign currency with an editable rate

- **What is this feature for, and how useful could it be for our users?** A traveller or expat pays 45.00 USD from a EUR card or cash wallet. They want the ledger to show the EUR amount that actually left the account, but also remember that the purchase was 45 USD at an actual rate. This is one of the most requested things in travel tracking and is core to "global, not tied to a country". Very useful.
- **Should we modify the models?** Yes, additively. Keep `transactions.amount_minor` + `currency` as the ledger truth in the account's currency (balances stay SQL sums). Add nullable `original_amount_minor bigint`, `original_currency char(3) references currencies`, and `original_rate numeric(20,10)` (a decimal, never a float, stored as the rate used: account units per original unit), with a check constraint that the three are either all null or all set and `original_currency <> currency`. Optionally add `user_settings.remember_rates boolean` or reuse the manual `exchange_rates` table as the "remembered" rate source (upsert a rate for that date when the user ticks "remember").
- **Should we improve the UI to fit this feature?** Yes: the transaction form gets a currency selector defaulting to the account currency (or the last used currency), and when a different currency is chosen a second line shows "= 41.37 EUR at 0.9193" with the rate editable and a "remember this rate" checkbox. Transaction lists show the original amount as secondary text. Reports can later group trip spending by original currency.
- **How it could be implemented**: (1) Migration adding the three columns and constraint. (2) Extend the shared Zod contract for transaction create/update with an optional `original` object; the service computes `amount_minor = round(original_amount_minor × rate × 10^(accountExp − originalExp))` using integer/decimal arithmetic in a tested helper in `packages/shared/src/lib/`, or accepts the user's account-currency amount and derives the rate. (3) Suggest the rate from the latest `exchange_rates` row for that pair and date. (4) Form and list UI. Risks: rounding rules for currencies with 0 or 3 decimals; CSV import rows that already carry both amounts; editing an old transaction must not silently re-rate it.

### Budgets with a daily allowance and threshold alerts

- **What is this feature for?** It turns a budget from a report into guidance: "you can spend X per day until the end of the month". Spendee's 75%/90% alerts are the same idea as our "Near limit" at 80%.
- **Should we modify the models?** No for the allowance: `(limit_minor − spent_minor) / days_remaining_including_today`, computed in SQL or in a shared helper with integer division and remainder handling, per currency. Optionally `budgets.alert_threshold_pct smallint` later.
- **Should we improve the UI?** Yes: each budget card on the budgets page and dashboard shows "≈ 12.40 EUR/day for 9 more days", and turns into "over by 30.00" when exceeded.
- **How it could be implemented**: Add the computation to the budget summary service; add a tested helper `dailyAllowanceMinor(limit, spent, today, periodEnd)`; render it in the existing budget component. Open question: for past months show nothing; for future months divide by all days.

### Shared cash wallet (later)

- **What is this feature for?** Couples and flatmates entering into one pot. Spendee proves a flat model works: everyone edits everything, the owner controls categories, budgets stay personal.
- **Should we modify the models?** Yes, significantly: an `account_members` table (`account_id`, `user_id`, `role` enum owner/editor, `invited_email`, `status` enum invited/active/left/removed, timestamps, soft delete), `transactions.created_by_user_id`, and a rule for categories (use the owner's categories, as Spendee does). Every per-user query on accounts and transactions must become "owned by or member of", which weakens the "every row is per-user" invariant and must be documented in `agents/architecture.md`.
- **Should we improve the UI?** Invite dialog, member list on the account page, "added by" avatars in the transaction list, a shared badge on the account.
- **How it could be implemented**: Only after tags, recurring and debts. Risks: authorisation bugs leaking data across users, category mismatch between members, and conflicting edits.

## What not to copy

- **Bank, e-wallet and crypto-exchange sync as the core**: coverage is country-dependent and it is the main source of Spendee's complaints; stay manual + CSV first.
- **Features that only work on some wallet types** (recurring only in cash wallets, import only into cash wallets): confusing; our ledger treats all accounts the same.
- **Wallet currency locked after the first transaction without a migration path**: better to allow changing it only with an explicit conversion, or not at all but with a clear message.
- **Import without duplicate detection or transfer recognition**: we already do better; keep it.
- **Paywalling basic structure (one wallet, one budget on free)**: not relevant to our open app and hurts first impressions.
- **Region-varying prices bought only via app stores**: not applicable to a web app.

## Sources

- [Spendee pricing page](https://www.spendee.com/pricing) – plans, prices, 7-day trial
- [Spendee home page](https://www.spendee.com/) – feature list, Prague, Mobile UX Awards 2017
- [Help: What is Spendee Premium?](https://help.spendee.com/article/202-what-is-spendee-premium) – Premium features, app-store purchase
- [Help: Spendee Features category](https://help.spendee.com/category/129-spendee-features) – list of feature articles
- [Help: Shared Wallets](https://help.spendee.com/article/224-shared-wallets) – invite flow and permissions
- [Help: Can I share budgets?](https://help.spendee.com/article/215-is-it-possible-to-share-budgets) – budgets not shared
- [Help: Budgets](https://help.spendee.com/article/131-budget-my-money) – setup, 75%/90% alerts, daily allowance
- [Help: Scheduled transactions](https://help.spendee.com/article/229-scheduled-transactions) – recurring and one-time, cash wallets only
- [Help: Transfers](https://help.spendee.com/article/234-transfers) – transfers excluded from reports
- [Help: Labels](https://help.spendee.com/article/237-what-are-labels-and-how-to-use-them) – labels usage
- [Help: All Wallets Overview](https://help.spendee.com/article/169-all-wallets-overview) – main currency, wallet selection
- [Help: How to set/change the currency and exchange rate](https://help.spendee.com/article/231-how-to-setchange-the-currency-and-exchange-rate) – per-transaction rates
- [Help: How to Change Currency](https://help.spendee.com/article/242-how-to-change-currency) – currency settings (search result)
- [Help: Data Import](https://help.spendee.com/article/209-data-import) – formats, columns, limits
- [Help: Magic AI Scan](https://help.spendee.com/article/248-magic-ai-scan) – receipt scanning, Premium
- [Help: Hide amounts on shake](https://help.spendee.com/article/250-hide-amounts-on-shake) – privacy toggle
- [Help: Tracking of Crypto Wallets](https://help.spendee.com/article/243-tracking-of-crypto-wallets) – crypto wallets (search result)
- [App Store listing](https://apps.apple.com/us/app/expense-budget-app-spendee/id635861140) – rating, IAP prices, Spendee 6 release notes
- [Trustpilot reviews of spendee.com](https://www.trustpilot.com/review/spendee.com) – 2025–2026 user complaints
- [Frugal for Less: Spendee review 2026](https://www.frugalforless.com/spendee-review/) – independent review
- [WealthRocket: Spendee review](https://www.wealthrocket.com/budgeting/spendee-review/) – bank coverage, pros and cons
- [Finny: Best multi-currency expense tracking apps 2026](https://getfinny.app/blog/best-multi-currency-expense-tracking-apps-2026) – competitor blog, 160+ currencies claim (search result)
