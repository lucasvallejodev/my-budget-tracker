# Revolut

> Summary: Revolut's budgeting layer studied as UX patterns (Analytics, spending limits, bill Pockets, Vaults with round-ups, Trips, Group Bills), and why a daily allowance from the monthly budget, analytics by category, payee, currency and trip, and bill pockets with an on-track status are worth borrowing.

## At a glance

|                     |                                                                                                                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type                | Licensed bank / e-money institution (varies by country) with a spending and budgeting layer in the app                                                                                    |
| Platforms           | iOS, Android, limited web app                                                                                                                                                             |
| Pricing (2026)      | Standard (free), Plus, Premium, Metal, Ultra. Prices differ by country; Portugal example: Plus €3.99, Premium €9.99, Metal €17.99, Ultra €55 per month. Category budgets need a paid plan |
| Regions / bank sync | EEA, UK, US, Brazil, Mexico, Australia and more. Budgeting mostly sees money that flows through Revolut; the UK app can also connect some external accounts                               |
| Data entry          | Automatic from the Revolut account; manual custom categories; no manual transactions or CSV import for budgeting                                                                          |
| Best for            | Travellers, expats and people who spend in several currencies and want instant, per-currency insight                                                                                      |

## What makes it special

Revolut's appeal is breadth and speed. One app holds balances in dozens of currencies, exchanges at interbank rates (with a weekend markup of 1% on Standard and 0.5% on Plus; none on Premium, Metal and Ultra), and categorises every card payment in real time. Budgeting tools such as Analytics, Pockets, Vaults, Trips and Group Bills are consequences of that data: because Revolut sees each transaction's merchant, country and currency the moment it happens, it can show spend by country or build an automatic trip summary.

The philosophy is "light-touch awareness", not "budgeting method". Revolut says it will not cap your spending: budgets exist to give visibility, and notifications warn you as you approach a limit. Money can be moved into Pockets on payday to protect bills, and round-ups nudge savings, but there is no zero-based discipline or planning horizon.

The main limitation is visibility. Reviews of Revolut as a budgeting tool point out that it only tracks money that flows through Revolut. For most people other banks and cards stay invisible, so analytics can cover only part of real spending (a 2026 Freenance guide estimates 40–70%). Analytics are strongest for the current and previous month, and there is no household or net-worth view. App-store reviews also complain that the app has become crowded and "not intuitive" to navigate as features pile up.

## Strongest feature

**Analytics with multi-currency and country breakdowns (including Trips).** You can switch the same spending data between category, merchant, country and currency views over 1 week, 1 month, 6 months or 1 year. Trips then turns spending abroad into a per-trip summary with daily spend and categories. For a global, currency-agnostic target user this is the most transferable idea, and it fits CoinKeeper's "group by currency, never sum across currencies" invariant naturally. Usefulness: **High**. Trips-style grouping is especially valuable for the "plan a vacation" goal: you plan a trip budget, then review what the trip actually cost.

## Feature deep dive

### Analytics (Spent and Income)

- **What it does**: A dashboard of spending and income with drill-downs.
- **How it works**: Open it from the analytics and budgeting icon on Home, then tap the "Spent" or "Income" widget. Data can be sorted by category, merchant, country or currency, and the timeframe switches between 1 week, 1 month, 6 months and 1 year. It shows month-over-month comparisons. Custom categories are created from a transaction (current category → "Add custom"). On paid plans, weekly spending summary notifications are reported (third-party guide; unverified on official pages).
- **Why it helps**: Pivoting one dataset by several dimensions answers "where does my money go?" from different angles. **High**.

### Monthly budget with daily allowance

- **What it does**: You set how much you want to spend this month, and Revolut turns that into a daily spending limit to stick to.
- **How it works**: The budget planner converts the monthly amount into a per-day figure and tracks it in real time. Notifications report daily spending and warn when you get close to the limit. It is advisory only: Revolut does not block payments. The exact formula is not documented. The natural reading is (budget − spent so far) ÷ days left, which is unverified.
- **Why it helps**: "You can spend 23 today" is far easier to act on than "you have 690 left this month". **High**, and cheap to build.

### Category budgets (spending limits per category)

- **What it does**: A monthly cap per category (Groceries, Restaurants, Shopping and so on), with alerts.
- **How it works**: Available on Plus, Premium, Metal and Ultra. You set a monthly amount per category, and a notification fires when you approach or exceed it. Custom categories can be budgeted too. These are advisory; card-level hard limits are a separate card-control feature.
- **Why it helps**: This is the classic envelope-lite budget. CoinKeeper already has it (`budgets` table with On track / Near limit 80% / Exceeded). **Medium** as inspiration: the notification and the daily view are the new parts.

### Pockets (bills and budgets)

- **What it does**: Separate sub-balances to set money aside for rent, bills, subscriptions or a spending category, with recurring funding on payday.
- **How it works**: Launched in December 2020 in 13 European markets; Vaults were later folded into the Pockets area. You create a Pocket per purpose and set up recurring funding on payday. You can then sort existing scheduled payments, subscriptions or Direct Debits into it, and Revolut pays them from the Pocket when due. If the Pocket is short, the rest is taken from the main account so the payment is not missed. The Pocket detail page shows whether you are _on track to cover all upcoming payments_. Pockets can also have a monthly budget (Revolut's example: at most £200 on dining out), with notifications as you approach the limit. There are Personal Pockets and Group Pockets.
- **Why it helps**: It protects bill money and answers "am I covered?" with one status. **High** as a concept; the money movement cannot be copied.

### Savings Vaults and spare-change round-ups

- **What it does**: Goal-based savings sub-accounts fed by round-ups, recurring transfers or one-off top-ups.
- **How it works**: When you create a Vault you choose a name, a currency and a savings goal. Contributions come from spare change, a recurring payment or a one-off transfer. Round-ups round every card transaction up (including virtual cards) and move the difference, for example £2.70 → £3.00 = £0.30. A multiplier of x1, x2, x3, x4, x5 or x10 increases the amount. The destination can be a Pocket, a savings account, crypto or RevPoints. Money can be withdrawn at any time. Interest-bearing Savings Vaults depend on the market.
- **Why it helps**: Goal plus automation makes saving feel effortless. For us only the goal and the _suggested_ contribution transfer. **Medium**.

### Group Vaults / Group Pockets

- **What it does**: A shared savings goal for friends or family ("Barbados 2020: £3,000").
- **How it works**: Launched in May 2019. The creator is the Administrator: they set the goal, name and cover photo, can contribute or withdraw, and can close the Vault. Members contribute via round-ups, recurring or one-off payments and can withdraw instantly.
- **Why it helps**: Couples and families plan holidays and deposits together. **Medium**. It needs multi-user sharing, which CoinKeeper does not have.

### Trips (travel analytics)

- **What it does**: An automatic summary of each trip abroad, with total spend, daily spend, categories, transactions per trip and a 3D map of visited countries.
- **How it works**: A trip covers one non-home country at a time (several cities allowed). It starts when Revolut detects you in a new country, from device location or the first card payment there. It ends when you return home, or when you go directly to another foreign country. A past trip is logged only if it lasts at least two days and has at least two transactions. An end-of-trip push notification summarises daily spend and categories.
- **Why it helps**: Travel spending is a classic budget-breaker, and seeing a trip's total cost is the feedback loop for planning the next one. **High** as "tag a date range as a trip". Automatic location detection is not needed.

### Split Bill and Group Bills

- **What it does**: Split one payment with friends, or keep a running shared-expense group and settle up.
- **How it works**: Split Bill: tap a transaction, choose "Split bill", pick contacts and split evenly or by typed amounts. Recipients accept or decline the request, and settlement is instant between Revolut users. Revolut says non-Revolut people can be included; a third-party guide says requests go to Revolut contacts, so treat it as unverified. Group Bills (Aug 2020): Payments → New → Group supports 2–20 people. Members add transactions, and the app settles the group by _minimising the number of transfers_. There is no item-level split, so unequal splits are arithmetic you do yourself.
- **Why it helps**: It keeps shared costs from inflating personal spending. **Medium**. It needs split transactions and receivables.

### Subscriptions / recurring payments view

- **What it does**: Lists recurring payments with merchant cost and next charge date, and lets you block them.
- **How it works**: Direct Debits and card transactions are automatically marked as recurring, and users can flag missed ones by hand. They appear under Payments → Scheduled. A notification warns before a charge, especially when the balance is low. You can block a merchant so future payments are declined.
- **Why it helps**: Forgotten subscriptions are the easiest money to save. **High** (detection and reminders). Blocking a merchant is bank-only.

### AIR (AI assistant), 2026

- **What it does**: A chat assistant in the UK app, rolled out from 9 Apr 2026. It answers "where's my money going?", pauses recurring payments, manages card controls and helps budget trips.
- **How it works**: It only accesses data the user can already see. Sensitive actions need biometric approval, and partners do not store or train on the data (per Revolut's announcement).
- **Why it helps**: Natural-language questions lower the barrier for non-experts. **Low–Medium** for now; it is a large investment for us.

## Fit for CoinKeeper

| Feature                                                | Usefulness for our user | Model changes?                                          | API / services                                         | UI changes                                       | Effort (S/M/L)  | Priority (Now/Next/Later/Skip) |
| ------------------------------------------------------ | ----------------------- | ------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------ | --------------- | ------------------------------ |
| Daily allowance from monthly budget                    | High                    | None                                                    | Budget summary adds `perDayLeft` per currency          | Budgets header, dashboard card                   | S               | Now                            |
| Analytics pivot: category / payee / account / currency | High                    | None                                                    | Analytics endpoint `groupBy` param                     | Analytics page toggle                            | S               | Now                            |
| Trips (date-ranged spend groups)                       | High                    | `tags` + `transaction_tags`, or `trips` with date range | Trip report per currency with optional converted total | Trip list, trip detail, tag chip on transactions | M               | Next                           |
| Recurring payment detection + reminders                | High                    | `recurring_items` (see Monzo/Firefly)                   | Detector over ledger (payee, cadence, amount)          | "We found 5 subscriptions" review card           | M               | Next                           |
| Bill pocket "on track" status                          | High                    | Reuses `goals` (kind `bills`) + `recurring_items`       | Coverage calc                                          | Status chip on bills goal                        | S (after goals) | Next                           |
| Category budget notifications                          | Medium                  | `notifications` table or computed inbox                 | Threshold check on write/import                        | In-app inbox (no push yet)                       | M               | Later                          |
| Group bills / split                                    | Medium                  | Split lines + counterparties                            | Settlement minimiser                                   | Split dialog                                     | L               | Later                          |
| Round-ups with multiplier                              | Low                     | None                                                    | Round-up calculator                                    | Insight card                                     | S               | Later                          |
| Group vaults                                           | Medium                  | Sharing model                                           | Multi-user access                                      | —                                                | L               | Later                          |
| AI assistant                                           | Low                     | —                                                       | LLM integration                                        | Chat                                             | L               | Skip (for now)                 |

### Daily allowance ("safe to spend per day")

- **What is it for?** It turns the existing monthly budgets into one daily number. For non-experts the day is the natural unit of decision ("can I buy lunch out today?"). Usefulness: High.
- **Model changes.** None. It is derived from `budgets` and the ledger:
  - `left_minor = Σ budget.amount_minor − Σ spent_minor` over budgeted expense categories for the month, per currency. Spent excludes transfers and `excluded` rows, as today.
  - `per_day_minor = floor(left_minor / days_remaining_including_today)`. If `left_minor ≤ 0`, show 0 and an "over budget by X" state. Use integer division on minor units, never floats.
  - Optionally a second variant over _all_ spending, based on a user-set overall monthly target.
- **UI.** A hero card on the dashboard ("You can spend 23.40 EUR per day for the next 9 days"), one per currency when budgets exist in several currencies. The Budgets page header shows the same line.
- **Implementation.** Add a `dailyAllowance(leftMinor, today, periodEnd)` helper in `packages/shared/src/lib/` with TSDoc and tests (month end, last day, negative values). Expose it in the budgets summary response and render it.
- **Risks.** Large one-off bills early in the month skew the number. Excluding categories flagged as fixed or bills, once recurring items exist, fixes this. It also depends on a period start day if we add pay-cycle months.

### Trips (spend grouped by date range and currency)

- **What is it for?** A user plans a holiday (goal), then tags the trip's transactions automatically by date range and sees the real cost per currency, with an optional converted total through our manual FX rates. Usefulness: High for the "vacation" goal and for travellers.
- **Model changes.** Prefer generic tags, which Firefly III also has, over a trips-only table:
  - `tags`: `id`, `user_id`, `name`, `colour`, `kind` enum `tag | trip | project`, `start_date`, `end_date` (nullable, used by trips), `goal_id` (nullable, links a trip to its savings goal), `archived_at`, `deleted_at`.
  - `transaction_tags`: `transaction_id`, `tag_id`, `created_at`, `deleted_at`.
  - Auto-tagging for trips: on create or import, transactions whose date falls in `[start_date, end_date]` get a suggested tag. The user confirms in the review inbox, which reuses `needs_review`.
- **UI.** A Trips list shows cards with dates, total per currency, converted total and per-day average. The trip detail has a category donut, a daily bar chart and the transaction list. Transactions show a tag chip, and the transaction filter gets a tag option.
- **Implementation.** Build the schema and contracts, then tag CRUD. Add a tag filter to transaction queries and a report endpoint `GET /reports/tags/:id` that groups by currency, with converted total when rates exist. Then add the auto-suggest in the import pipeline.
- **Risks.** Transfers must stay out of trip spending (the invariant holds if the report reuses spending filters). Overlapping trips mean a transaction can carry two trip tags, which is acceptable.

### Recurring payment detection

- **What is it for?** It finds subscriptions and bills in the ledger without bank sync and proposes them as recurring items. This powers upcoming bills, "left to spend" and bill pocket "on track". Usefulness: High.
- **Model.** `recurring_items` as proposed in the Monzo and Firefly III documents, plus `source` enum `manual | detected` and `dismissed_at` for rejected suggestions.
- **Detection heuristic.** Take the same `payee_id`, at least 3 occurrences in the last 6 months, and intervals that cluster around 7, 14, 28–31 or 365 days (median ± tolerance). Amounts must fall within ±10% of the median, computed per currency.
- **UI.** A "Recurring payments we found" review card, where the user accepts, edits or dismisses each item. Accepted items appear in the Bills calendar.
- **Risks.** False positives (groceries at the same shop). Require a regular interval, not just repetition.

## What not to copy

- **Round-ups that move real money and multipliers**: we cannot move money. Round-up totals can at most be a suggestion.
- **Blocking a merchant / pausing subscriptions**: this needs card issuing.
- **Weekend FX markups, plan-tiered FX and cashback**: pricing tricks of a bank, not budgeting.
- **Paywalling category budgets**: basic budgeting should never be premium for our user.
- **Automatic trip detection from device location**: invasive and unnecessary. Date ranges and currency are enough.
- **Feature sprawl (crypto, stocks, eSIMs, lounges in the same app)**: reviewers cite it as making navigation hard. CoinKeeper should stay focused.
- **Budget analytics limited to one institution's data**: our CSV import and manual entry across all banks is a strength to keep.

## Sources

- [Revolut Help – Getting started with Pockets (search result)](https://help.revolut.com/help/app-features/vaults/what-are-revolut-vaults/)
- [Revolut Help – Adding money to Pockets (search result)](https://help.revolut.com/help/app-features/vaults/how-do-i-put-money-into-vaults/)
- [Revolut blog – Meet Pockets, the next evolution of Vaults (search result)](https://www.revolut.com/blog/post/meet-pockets-the-next-evolution-of-vaults/)
- [Revolut – Pockets product page (search result)](https://www.revolut.com/en-EE/pockets)
- [Revolut – Budget planner page (search result)](https://www.revolut.com/best-budget-planner/)
- [Revolut Help – How can I see my spending and income analytics? (search result)](https://help.revolut.com/help/accounts/budget-and-analytics/how-can-i-see-my-spending-and-income-analytics/)
- [Revolut Help – What is the analytics dashboard? (search result)](https://help.revolut.com/help/accounts/budget-and-analytics/what-is-the-analytics-dashboard/)
- [Revolut Help (US) – Spare change round ups (search result)](https://help.revolut.com/en-US/help/app-features/vaults/how-do-spare-change-round-ups-work/)
- [Revolut Help (US) – How are trips defined for travel analytics? (search result)](https://help.revolut.com/en-US/help/accounts/budget-and-analytics/revolut-trips-how-is-a-trip-defined/)
- [Revolut Help (SI) – How can I see my travel analytics? (search result)](https://help.revolut.com/en-SI/help/accounts/budget-and-analytics/revolut-trips-using-revolut-trips/)
- [Revolut Help – How to split a bill (search result)](https://help.revolut.com/help/adding-money/with-money-from-friends-or-relatives/splitting-bill/)
- [Revolut – Compare plans (search result)](https://www.revolut.com/our-pricing-plans/)
- [Revolut news – Group Vaults launch (search result)](https://www.revolut.com/news/revolut_launches_group_vaults_transforming_the_way_friends_and_family_save/)
- [Siliconcanals – Revolut launches Pockets (Dec 2020)](https://siliconcanals.com/revolut-launches-pockets/)
- [Finextra – Revolut unveils Pockets (search result)](https://www.finextra.com/pressarticle/85391/revolut-unveils-pockets-money-management-feature)
- [TechCrunch – Revolut lets you track your subscriptions (Oct 2020)](https://techcrunch.com/2020/10/08/revolut-lets-you-track-your-subscriptions-adds-savings-bonus-in-the-us)
- [Fintech Global – Revolut launches Group Bills (search result)](https://fintech.global/2020/08/19/revolut-launches-new-bill-splitting-feature-group-bills/)
- [Splitty – Revolut bill splitting guide](https://splittyapp.com/learn/revolut-bill-splitting/)
- [Freenance – Revolut budget tracking guide 2026](https://freenance.io/integrations/revolut-budget-tracking-complete-guide-2026/)
- [Money to the Masses – Revolut review 2026 (weekend FX markup)](https://moneytothemasses.com/quick-savings/travel-quick-savings/revolut-review-is-it-the-best-way-to-take-money-abroad)
- [PYMNTS – Revolut rolls out AI assistant (2026)](https://www.pymnts.com/artificial-intelligence-2/2026/revolut-rolls-out-ai-assistant-for-daily-financial-tasks/)
- [Revolut – AIR, AI by Revolut (search result)](https://www.revolut.com/blog/post/air-ai-by-revolut/)
- [Apple App Store – Revolut listing (user reviews, search result)](https://apps.apple.com/us/app/revolut-send-spend-and-save/id932493382?l=en-US)

Note: Revolut's help center and marketing pages returned a bot check (HTTP 403) to automated fetches during this research. Facts marked "(search result)" come from the official pages' search-result excerpts, not from reading the full page.
