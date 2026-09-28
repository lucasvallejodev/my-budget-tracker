# Money Lover

> Summary: Money Lover, the manual-first wallet-based money manager popular in Asia and worldwide: events with Travel Mode, debts and loans, goals, bills, budgets and exclude from report, and why trips, debts with people and visible report exclusions are worth borrowing for CoinKeeper.

## At a glance

|                     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type                | Personal money manager and expense tracker (Finsify JSC, Vietnam)                                                                                                                                                                                                                                                                                                                                                                                                    |
| Platforms           | iOS, Android, Apple Watch, widgets; web app at web.moneylover.me (desktop only), which returned after being discontinued on 22 Sep 2023                                                                                                                                                                                                                                                                                                                              |
| Pricing (2026)      | Free (one basic wallet, ads); Premium is a **one-time lifetime purchase** ($19.99 on the US App Store, with $9.99 upgrade-discount offers) unlocking unlimited wallets, budgets, savings, events, recurring transactions, bills and debts, web access, CSV/Google Sheets export and no ads. Linked (bank) wallets are a separate subscription ($2.49–2.99/month); a "Budget Plus" monthly add-on ($2.99) is listed with undocumented contents. 14-day Premium trial. |
| Regions / bank sync | Linked Wallet supports banks mainly in South-East and East Asia (the Philippines, Malaysia, Singapore, Hong Kong, Vietnam, Thailand, Indonesia "and more"), read-only; sync is a paid add-on                                                                                                                                                                                                                                                                         |
| Data entry          | Manual (primary), AI natural-language entry (MoneyLover Assistant, beta), receipt scanning, Siri and Apple Watch voice, Apple Pay auto-tracking on iOS, home-screen widget entry, bank linking (paid)                                                                                                                                                                                                                                                                |
| Best for            | Cash-heavy users, travellers and people who lend and borrow money informally, who prefer to pay once                                                                                                                                                                                                                                                                                                                                                                 |

## What makes it special

Money Lover's philosophy is "a wallet for every pot of money, and a category for every movement, including debts". Wallets come in four types: **Basic** (manual), **Linked** (bank-synced), **Goal** (savings) and **Credit** (credit card with a normally negative balance). Wallets can be included in a **Total Wallet**, the default combined view; a wallet can be switched to "exclude from total". Every transaction has a category, and debts and loans are simply a third category type next to Expense and Income. Events group transactions across categories for a trip or a party, and Travel Mode automatically attaches every new transaction to the current event.

The app has a long history (the store listing claims over 10 million users and a "Best Android App" award in 2017; the website more modestly says 1 million+) and a notably friendly monetisation for a finance app: a one-time lifetime Premium price rather than a subscription, with only bank linking billed monthly. In 2025–2026 the team shipped AI features: the MoneyLover Assistant parses a sentence such as "bought groceries 200k and paid for parking 50k" into two categorised transactions, plus multi-receipt scanning, Siri and Apple Watch voice logging, Apple Pay auto-tracking and a redesigned widget with direct entry.

Sentiment is positive on the App Store (4.6 from about 2,300 ratings), with long-time users describing three to five years of steady use and praising a "simple and clean look". Negative themes are the paid linked wallet failing to connect with refunds refused, unanswered support tickets, bugs in recurring transactions and dates, and ads in the free version that make the app feel cheap. One important documented limitation: recurring transactions are not synced across devices and are lost when you log out.

## Strongest feature

**Events with Travel Mode.** You create an event (name, start date, currency, wallet, optional end date), tag transactions to it, and see its total when it finishes. Turn on Travel Mode at the start of a trip and every transaction you add is tagged to the event automatically; switch it off when you come home. It solves the "what did this trip cost?" question with almost zero extra effort per entry, and it is independent of categories, so food, transport and hotels in the trip still show in their usual categories. For our global, travel-heavy target user this is highly valuable, and it maps cleanly onto tags plus a "current default tag" setting.

## Feature deep dive

### Wallets and the Total Wallet

- **What it does**: Separates money by source (cash, bank, credit card, savings) and combines chosen wallets into one view.
- **How it works**: Basic wallets need manual entries; Linked wallets sync from a bank (paid); Goal wallets hold savings; Credit wallets usually show a negative balance equal to what you owe the card issuer (interest and penalties excluded). The Total Wallet is the group of wallets marked "include in total"; a wallet marked "exclude from total" does not appear in the Total Wallet transactions or reports. Wallets can be created, edited, archived and deleted. A 2025 update lets the transactions list show all wallets in the Total Wallet together and manage categories per wallet or across the total.
- **Why it helps**: Same mental model as CoinKeeper accounts with `counts_in_spending`. Usefulness: **High** (largely covered already).

### Events and Travel Mode

- **What it does**: Tracks everything spent (or earned) for a trip or occasion.
- **How it works**: Account tab → Events → (+). Fields: name, start date, **currency**, wallet and optional end date. In any transaction you can pick an event or create one inline. Travel Mode (Account tab, a switch) tags every new transaction to the chosen event until you switch it off. Finished events move to a **Finished** tab with a summary of the total spent or earned. Premium unlocks unlimited events.
- **Why it helps**: Trips, weddings and renovations cut across categories; this answers their cost in one screen and nudges the user to log in the event's currency. Usefulness: **High**.

### Debts and loans as categories

- **What it does**: Records money borrowed from or lent to people, and repayments.
- **How it works**: When choosing a category, switch to the **Debt/Loan** tab. Four system categories: **Debt** (you borrowed, a payable), **Repayment** (you pay it back), **Loan** (you lent, a receivable) and **Debt Collection** (you get paid back). Account tab → Debts lists open items per person; from there you add a payment or receive a payment, including partial amounts (the help centre example: a friend owes 5,000,000 VND and first pays 2,000,000, so you record 2,000,000). Premium unlocks unlimited debts and loans.
- **Why it helps**: Handles informal lending, which is very common in cash economies and among friends, and keeps it out of normal spending. Usefulness: **High**.

### Savings plans (Goal wallets)

- **What it does**: Saves towards a laptop, a trip or a gift.
- **How it works**: A plan has a name, a goal amount, a starting amount and an optional deadline (reminder notifications as it approaches). **Deposit** sets money aside and is recorded as an outflow from the source wallet; **Withdraw** takes money back and is recorded as an inflow. Money in a savings plan is not counted in the spendable balance. The help centre advises starting small instead of setting an unrealistic goal. Free users get one savings plan.
- **Why it helps**: Making saved money "invisible" in the balance is a simple psychological trick that prevents spending it. Usefulness: **High** (but deposits as outflows would break our "transfers are not spending" rule; model them as transfers).

### Budgets

- **What it does**: Sets an expected spend per category for a period.
- **How it works**: A budget targets one category (or all) in a single wallet or the Total Wallet, for this week, month, quarter or year, or a custom range; repeating budgets renew automatically on the first day of the next period. The Running Budgets screen shows progress and a chart of recommended versus actual daily spending; notifications fire when nearing the limit.
- **Why it helps**: The recommended-versus-actual daily line teaches pacing. Usefulness: **High** (CoinKeeper has monthly limits; quarterly/yearly and pacing are gaps).

### Bills and recurring transactions

- **What it does**: Bills remind you to pay; recurring transactions are created automatically.
- **How it works**: **Bills** schedule a payment with reminders on the due date, repeating daily, weekly, monthly or yearly, and track pending or overdue bills; a bill starts from the **next cycle** (a monthly bill created on 12 August with start date 12 August is first scheduled for 12 September). **Recurring transactions** are auto-created charges at regular intervals with the same next-cycle rule (created 1 January monthly → first on 1 February); you can also add the current period's occurrence manually via "Add transaction". Recurring transactions are not synced between devices and are lost on logout.
- **Why it helps**: The split between "remind me and I confirm" (bill) and "just add it" (recurring) is a useful distinction, though the next-cycle rule surprises users. Usefulness: **High**.

### Exclude from report

- **What it does**: Keeps a transaction or a wallet out of reports without deleting it.
- **How it works**: Each transaction has an "exclude from report" switch; excluded amounts are shown in reports as "Other amount". Transfers between wallets are excluded from reports **by default**, but the user can turn that off. Wallets can be excluded from the Total Wallet.
- **Why it helps**: Reimbursable work expenses, money held for someone else and one-off anomalies should not distort monthly spending. Usefulness: **High** (CoinKeeper already has `transactions.excluded`; making it visible and explained is the win).

### Reports

- **What it does**: Visual summaries of income, expenses and balances.
- **How it works**: The report home shows **opening balance** (total income minus total expenses before the selected range) and **ending balance** (the same at the end of the range), net income detail, a categories report and, since a July 2025 update, **reports per member in a shared wallet**. Opening/ending balances are hidden when the Total Wallet contains a linked wallet. Charts are mostly pie and bar views filterable by period.
- **Why it helps**: Opening/ending balance per period helps users reconcile. Usefulness: **Medium**.

### Shared wallets

- **What it does**: Lets two or more accounts use one wallet.
- **How it works**: My Wallets → wallet → **Add Member** → e-mail plus a message → **Share**. The invitee accepts under Account → "Awaiting shared wallet", and the owner gets an in-app notification. Only the owner can add, edit or delete category groups, delete the wallet or remove members; members can leave at any time. A shared wallet is always excluded from the member's total (the member cannot change that). Reports can be split per member.
- **Why it helps**: Couples and flatmates; the per-member report tells you who spent what. Usefulness: **Medium**.

### Fast entry: AI assistant, widgets, voice

- **What it does**: Reduces typing.
- **How it works**: Long-press the add button (or tap the button next to Save) to type a sentence; the assistant extracts amounts, categories and notes and can create several transactions from one sentence, using a **default wallet** when none is named. Free during the beta. Home-screen widgets allow direct transaction entry; Siri, Apple Watch voice and multi-receipt scanning exist on iOS.
- **Why it helps**: Manual entry speed is decisive for manual-first users. Usefulness: **Medium** (natural-language entry needs an AI provider; a deterministic parser like "coffee 2.5" is cheaper).

## Fit for CoinKeeper

| Feature                                          | Usefulness for our user | Model changes?                                                                                    | API / services                         | UI changes                                      | Effort (S/M/L) | Priority (Now/Next/Later/Skip) |
| ------------------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------- | -------------- | ------------------------------ |
| Events + Travel Mode                             | High                    | Yes: `events` (or tags with kind event), `transactions.event_id`, `user_settings.active_event_id` | Event CRUD, event summary per currency | Events screen, event picker, travel-mode banner | M              | Next                           |
| Debts & loans with repayments                    | High                    | Yes: `counterparties`, `debts`, `transactions.debt_id`                                            | Outstanding computed from ledger       | Debts screen, lend/borrow in add form           | M              | Next                           |
| Savings goals (set-aside money)                  | High                    | Yes: `goals`, goal-linked transfers                                                               | Progress from ledger                   | Goals screen, deposit/withdraw as transfer      | M              | Next                           |
| Exclude from report (visible)                    | High                    | Already `excluded`                                                                                | Report "Other amount" line             | Switch in transaction form, report footnote     | S              | Now                            |
| Bills (confirm) vs recurring (auto)              | High                    | Yes: `scheduled_transactions.mode`                                                                | Occurrence service                     | Upcoming list                                   | M              | Next                           |
| Budget periods: week/quarter/year + pacing chart | Medium                  | Yes: `budgets.period`                                                                             | Period-aware budget query              | Pacing line on budget detail                    | M              | Later                          |
| Opening/ending balance in reports                | Medium                  | No                                                                                                | Report query                           | Report header                                   | S              | Next                           |
| Credit wallet semantics                          | Medium                  | Already liability accounts                                                                        | —                                      | —                                               | —              | Skip (covered)                 |
| Shared wallet + per-member report                | Medium                  | Memberships                                                                                       | Authorisation rewrite                  | Invite, per-member report                       | L              | Later                          |
| Natural-language quick entry                     | Medium                  | No                                                                                                | Parser (deterministic first)           | Quick-entry box                                 | M              | Later                          |
| One-time lifetime pricing, ads                   | —                       | —                                                                                                 | —                                      | —                                               | —              | Skip                           |

### Events with Travel Mode

- **What is this feature for, and how useful could it be?** Answering "how much did the Lisbon trip / the wedding / the move cost?" without breaking normal category reports, and making it effortless during the trip. Very useful for a global audience that travels and spends in several currencies.
- **Should we modify the models?** Two options. (a) Reuse a general **tags** feature and add `tags.kind` enum `label`/`event` with `starts_on`, `ends_on`, `currency` (display currency for the summary), giving one tagging mechanism for everything. (b) A dedicated `events` table (`id`, `user_id`, `name`, `starts_on`, `ends_on` null, `default_currency char(3)`, `default_account_id` null, `archived_at`, `deleted_at`) plus nullable `transactions.event_id` (one event per transaction, like Money Lover). Option (b) is simpler to report and enforce; option (a) is more flexible. Either way add `user_settings.active_event_id` null for Travel Mode. The event total is SQL over the ledger grouped by currency (plus the optional converted total with manual FX), never a stored sum; transfers are excluded.
- **Should we improve the UI?** Yes: an Events page (Active / Finished tabs, each card showing totals per currency and a category breakdown), an event picker in the transaction form, and a visible "Travel mode: Lisbon trip" banner with an off switch in the app shell. While Travel Mode is on, the form defaults the event, and optionally the event's account and currency.
- **How it could be implemented**: (1) Migration and contracts. (2) Event CRUD with soft delete/archive. (3) Transaction create applies `active_event_id` when the client sends no explicit event. (4) Event summary endpoint (per currency, per category). (5) UI. Risks: users forgetting to switch Travel Mode off (auto-end on `ends_on`), CSV imports during a trip (offer "assign to event" in the import review), and deciding whether events should also accept income (Money Lover allows it).

### Debts and loans with people

- **What is this feature for?** Informal lending between friends, family and colleagues, including partial repayments, without polluting spending.
- **Should we modify the models?** Money Lover's category trick (Debt, Repayment, Loan, Debt Collection) is elegant for users but hides the person and the outstanding balance in category data. For CoinKeeper: `counterparties` (`id`, `user_id`, `name`, `archived_at`, `deleted_at`), `debts` (`id`, `user_id`, `counterparty_id`, `direction` enum lent/borrowed, `currency`, `due_date` null, `status` enum open/settled/forgiven, `note`, `deleted_at`), and `transactions.debt_id` null plus a `transactions.kind` value such as `debt` so these rows never count as spending or income (same treatment as transfers). Outstanding = SQL sum of linked rows, per debt.
- **Should we improve the UI?** A Debts page with "Owed to me" and "I owe" totals per person and currency, due-date badges, and "Record repayment". In the transaction form a "Lend / Borrow / Repay" mode that asks for the person.
- **How it could be implemented**: Migration; service with outstanding computed in SQL and automatic `settled` when it reaches zero; forgiving writes an explicit expense or income for the remainder; exclude `kind = debt` from spending, budgets and savings-rate queries; tests. Risks: repayments in a different currency, and how debts appear in net worth (a receivable is an asset; consider showing it as a separate line).

### Savings goals with "set aside" money

- **What is this feature for?** Saving for a vacation, a car or an emergency fund, and hiding set-aside money from the spendable balance.
- **Should we modify the models?** Do **not** record deposits as expenses (Money Lover does). Add `goals` (`id`, `user_id`, `name`, `target_minor`, `currency`, `target_date` null, `account_id` null for a dedicated savings account, `status` enum active/paused/reached, `archived_at`, `deleted_at`) and link contributions via `transactions.goal_id` on transfer rows into a savings account. Progress = SQL sum of linked transfers (in minus out). Required per month = `(target − saved) / months_left`, a tested helper.
- **Should we improve the UI?** Goals page with progress bars and "save X per month to reach it by <date>"; a dashboard widget; "Add to goal" as a transfer shortcut.
- **How it could be implemented**: Migration, contracts, progress query, UI. Risk: goals without a dedicated account (virtual earmarks) need a different rule; start with account-backed goals.

## What not to copy

- **Recurring transactions stored only on the device and lost on logout**: everything must live server-side in the ledger schema.
- **Savings deposits recorded as outflows (spending-like)**: breaks our "transfers never count as spending" invariant.
- **"Next cycle" start rule for bills and recurring items**: surprising; start on the chosen date.
- **Bank linking as a separate monthly subscription limited to certain countries**: region-specific and a support burden.
- **Ads in the free tier**: users say it makes the app feel cheap; also a privacy concern.
- **Opening/ending balance disappearing when a linked wallet is included**: reports should behave consistently for every account type.
- **Debts hidden in special categories without a counterparty entity**: harder to report per person; model the person explicitly.

## Sources

- [Money Lover website](https://moneylover.me/) – features, Finsify, user numbers
- [App Store listing](https://apps.apple.com/us/app/money-lover-money-manager/id486312413) – rating, IAP prices, AI and voice features
- [Google Play listing](https://play.google.com/store/apps/details?id=com.bookmark.money&hl=en) – features and premium list (search result)
- [Support: How to use Events and Travel Mode](https://moneylover.zendesk.com/hc/en-us/articles/35969009741337-How-to-use-Events-and-Travel-Mode) – events, travel mode, finished tab (search result)
- [Support: Debt & Loan: definition and usage](https://moneylover.zendesk.com/hc/en-us/articles/36403994024345-Debt-Loan-definition-and-usage) – Debt, Repayment, Loan, Debt Collection (search result)
- [Support: Bills: definition and usage](https://moneylover.zendesk.com/hc/en-us/articles/36058137621145-Bills-Definition-and-usage) – bills, next-cycle rule (search result)
- [Support: Recurring transactions: definition and usage](https://moneylover.zendesk.com/hc/en-us/articles/36097569751833-Recurring-transactions-Definition-and-Usage) – frequencies, not synced across devices (search result)
- [Support: Budget: definition and usage](https://moneylover.zendesk.com/hc/en-us/articles/34300604750617-Budget-Definition-and-Usage) – budget periods and wallets (search result)
- [Support: Create, edit, delete budgets](https://moneylover.zendesk.com/hc/en-us/articles/34181313422361-Create-edit-delete-budgets) – repeat and renewal (search result)
- [Support: Definition of wallets](https://moneylover.zendesk.com/hc/en-us/articles/34972671048985-Definition-of-wallets-in-MoneyLover) – basic, linked, goal, credit wallets (search result)
- [Support: Create, edit, archive and delete wallets](https://moneylover.zendesk.com/hc/en-us/articles/34974522779417-Create-edit-archive-and-delete-wallets) – exclude from total (search result)
- [Support: Report: definition and usage](https://moneylover.zendesk.com/hc/en-us/articles/34533897137177-Report-Definition-and-Usage) – exclude from report, Other amount (search result)
- [Support: Improving your reports: what's new](https://moneylover.zendesk.com/hc/en-us/articles/48961508397721-Improving-Your-Reports-What-s-New) – opening/ending balance, per-member reports (search result)
- [Support: Share a wallet with another user](https://moneylover.zendesk.com/hc/en-us/articles/35187764576793-Share-a-wallet-with-another-user) – invite flow, permissions (search result)
- [Support: Premium: main features and purchase instructions](https://moneylover.zendesk.com/hc/en-us/articles/35836986998809-Premium-Main-features-and-purchase-instructions) – free limits, lifetime (search result)
- [Support: Link bank accounts with MoneyLover](https://moneylover.zendesk.com/hc/en-us/articles/39118321383577-Link-bank-accounts-with-MoneyLover) – supported countries, read-only (search result)
- [Support: Add transactions faster with AI](https://moneylover.zendesk.com/hc/en-us/articles/42320025248409-Add-transactions-faster-and-easier-with-AI-feature) – assistant, default wallet (search result)
- [Support: Explore the new feature update](https://moneylover.zendesk.com/hc/en-us/articles/36614437617177-Explore-the-exciting-new-feature-in-MoneyLover-with-new-update) – widget, total wallet list, category types (search result)
- [Support: Web version is back](https://moneylover.zendesk.com/hc/en-us/articles/53633862661273-Web-version-is-back) – web app return, desktop only (search result)
- [Old help note: savings plans](https://note.moneylover.me/how-to-create-and-track-saving-plans/) – deposit/withdraw mechanics (search result)
- [CompareHero: Money Lover review](https://www.comparehero.my/blog/tech/money-lover-app-review-track-your-expenses.html) – wallets, budgets chart, events
- [ScreensDesign: Money Lover UI breakdown](https://screensdesign.com/showcase/money-lover-expense-manager) – onboarding, paywall placement
- [JustUseApp: Money Lover reviews](https://justuseapp.com/en/app/486312413/money-lover-expense-manager/reviews) – user sentiment themes
