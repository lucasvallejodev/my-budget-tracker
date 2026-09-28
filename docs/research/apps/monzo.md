# Monzo

> Summary: Monzo's budgeting tools studied as UX patterns (Pots, Bills Pot, Salary Sorter, Trends, targets, shared tabs), and why virtual pots that earmark an account balance, a left-to-spend figure after upcoming bills and a payday split plan are worth borrowing for CoinKeeper.

## At a glance

|                     |                                                                                                                                                                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type                | Licensed bank (UK; EU licence via Ireland) with budgeting tools built into the current account app                                                                                                                                                              |
| Platforms           | iOS, Android (no full web app for day-to-day budgeting)                                                                                                                                                                                                         |
| Pricing (2026)      | Free account; paid plans Extra £3/month, Perks £9/month, Max from £19/month. Repriced on 18 Aug 2026 (Perks was £7, Max £17); new prices apply to new sign-ups from 13 Aug 2026 and to existing customers from their first billing date on or after 14 Oct 2026 |
| Regions / bank sync | UK and Ireland. US accounts were closed by 8 Jun 2026 after Monzo announced its US exit on 1 Apr 2026. Paid plans can connect some external UK accounts through open banking                                                                                    |
| Data entry          | Automatic (it is the bank); no manual entry, no CSV import for budgeting                                                                                                                                                                                        |
| Best for            | UK salaried people who want to split each payday into bills, spending and savings without a spreadsheet                                                                                                                                                         |

## What makes it special

Monzo's budgeting is not a separate app bolted onto a bank: the budget is the account. Money is physically moved into Pots, bills are paid directly from a Bills Pot, and the main balance becomes "what I can spend". This "physical envelopes" model is why Monzo is repeatedly recommended to students and to people who struggle with money: separating money into named spaces makes overspending harder than a chart ever could. A student cost-of-living blog calls Pots a way to "automatically save into separate spaces to organise your money" (hellocomputer Substack on managing money with ADHD).

The second pillar is payday. Salary Sorter, Get Paid Early and the Bills Pot all revolve around the moment the salary lands: you are paid (optionally a day early), you split the payment into pots with a saved template, and bills then come out of the pots automatically.

The weak point is analytics. In December 2025 Monzo retired its older "Summary" screen and moved everyone to "Trends". Long-time users complained that Trends dropped weekly and 4-weekly budget periods and the ability to exclude individual transactions, and several threads describe it as more complex and less suited to budgeting than Summary. The "left to pay" figure on Bills Pots has a long trail of community bug reports because it was tied to the Summary period date.

For CoinKeeper the lesson is that the _organisation_ of money (pots, bills, payday split) is what users love, while generic charts are replaceable. Since CoinKeeper cannot move money, the pot idea has to become virtual earmarking over the ledger.

## Strongest feature

**Pots with a Bills Pot, fed by Salary Sorter.** A user can end up with a main balance that is honestly "free to spend" because rent, bills and savings have already been set aside. The Bills Pot then pays Direct Debits and standing orders from the pot. This answers the target user's most basic question, "how much can I actually spend?", without asking them to understand budgeting theory. For our target user it matters a lot (High), but only the _earmarking_ and _planning_ half can be carried over. The automatic movement and payment of money cannot.

## Feature deep dive

### Pots (savings pots, goals, locked pots)

- **What it does**: Named sub-balances inside the account ("Holiday", "Rent", "Emergency") with an optional goal amount and a progress bar.
- **How it works**: Up to 20 Pots per account (pocketwise 2026 guide). There are four kinds: standard Pots (0% interest, used to separate bills and budget categories), instant-access savings Pots (interest depends on plan, money held with partner banks), fixed-term locked Pots (3, 6 or 12 months) and Pots with round-ups switched on. When you create a Pot you can set a goal amount, and the Pot shows a progress bar toward it. The older "lock until date" feature (2018) lets you keep paying in, manually or by schedule, while blocking withdrawals until a chosen date, with a reminder if you try. Pots can receive scheduled deposits.
- **Why it helps**: It turns abstract savings into concrete, named buckets and hides earmarked money from the "spendable" balance. **High**.

### Bills Pot and "Left to pay"

- **What it does**: A Pot dedicated to recurring bills. It shows how much is still due this period and pays bills from the Pot.
- **How it works**: At launch (Sept 2019) you converted a regular Pot into a Bills Pot and chose which Direct Debits and standing orders to pay from it. Card subscriptions were not supported at first. When a bill is due, Monzo moves the exact amount from the Pot to the main account and pays it. If the Pot is short, it takes the rest from the main balance or overdraft and warns you a day before. The Pot header shows "Left to pay", computed over the user's Summary period. Community reports say it counts Direct Debits but not scheduled payments, and after Summary was retired users could not change the period date, so "left to pay" used the wrong window (threads from 2024–2025).
- **Why it helps**: "Do I have enough set aside for bills?" is a question people ask every month. The feature fails when the budget period does not match the pay cycle. **High** (the concept); the period bug is a warning for us.

### Salary Sorter

- **What it does**: When a payment arrives, you split it across Pots, savings and the main balance in one screen.
- **How it works**: Eligible for any incoming payment over £100. You tap the payment in the feed and choose "sort". Each destination has +/− controls, or you can press and hold to type an exact amount; the remainder stays in the main balance. "Save sort" remembers the split _per sender_, and the next eligible payment from that sender offers the saved sort again. The user confirms each time, so it is not fully automatic. Monzo's example splits £1,600 into £700 rent, £400 bills, £100 savings and £200 spending.
- **Why it helps**: It makes "pay yourself first" a 10-second routine on payday. **High**, and it translates well into a planning feature.

### Get Paid Early

- **What it does**: You can take a Bacs salary at 4pm the day before it is due.
- **How it works**: Bacs payments take three days; Monzo credits on day 2 instead of day 3, for payments up to £20,000, free. The upcoming payment appears at the top of the feed and becomes claimable after 4pm.
- **Why it helps**: It gives an emotional payday boost, but it is a UK payments-rail trick. **Low** for us (cannot be copied).

### Round-ups

- **What it does**: Each card purchase is rounded up to the next pound and the difference goes to a Pot.
- **How it works**: For example £2.75 becomes £3.00, and 25p goes to the Pot where round-ups are on (one Pot at a time; can also feed an investment account weekly). "Advanced roundups" are listed as an Extra-plan feature on the plans page. The help article gives no details on multipliers or whole-pound purchases (unverified).
- **Why it helps**: Painless micro-saving. For a non-bank the money never moves, so the value is mostly symbolic. **Low–Medium**.

### Trends: Balance, Spending and Targets

- **What it does**: The analytics hub. Its three tabs are Balance (running balance, money in and out, estimated "left to spend"), Spending (monthly or yearly totals by category or merchant) and Target (an overall monthly spending target plus per-category targets on a graph).
- **How it works**: The monthly target can start on a custom day. The Dec 2022 launch post calls it "a bespoke date to start the month". You choose which accounts and categories count. Paid plans get "suggested targets" computed from past spending, plus custom categories. Notifications fire when you are close to or over a category target (US launch post). Categories can be excluded from spending totals via "Excluded from spending", but individual transactions cannot be excluded. In Trends, left to spend is the balance minus upcoming scheduled payments in included categories. Weekly and 4-weekly periods are not supported, which was the main complaint when Summary was retired on 21 Dec 2025.
- **Why it helps**: A single "left to spend" number plus a projection graph is exactly what a non-expert needs. The custom month start is essential for people paid mid-month. **High**.

### Monzo Split (bill splitting and running splits)

- **What it does**: You can split one transaction, or keep a running tab with housemates or a trip group and settle up later.
- **How it works**: Launched 24 Mar 2025, merging "Split the bill" and "Shared Tabs". Splits can be equal, by custom amounts, by percentage or by shares. Non-Monzo and international people join as guests via a link. Partial repayments and "settled elsewhere" records are allowed. Each expense can involve a subset of the group, and "Settle up" computes who owes whom.
- **Why it helps**: Shared costs distort personal spending ("I paid £120 for dinner but £90 was for friends"). **Medium** for our user. It needs split transactions and receivables first.

### 1p Saving Challenge

- **What it does**: This is a gamified daily saving schedule.
- **How it works**: Day _n_ saves _n_ pence (1x), 2*n* (2x) or 4*n* (4x). Over 365 days that totals £667.95, £1,335.90 or £2,671.80. The level can change and applies from the next day; the 2x and 4x multipliers are for paid plans.
- **Why it helps**: A ready-made plan beats a blank goal for beginners. **Medium**. It maps to a "contribution schedule" template on a goal.

### Bills and upcoming payments calendar (in testing)

- **What it does**: A calendar of Direct Debits, card subscriptions and standing orders across personal and joint accounts.
- **How it works**: Announced as a beta with 20 volunteers on 6 Feb 2026. Testers asked for income on the same calendar, a daily spending allowance based on the pay cycle and alerts for annual bills. Separately, the Payments tab already auto-detects common recurring card payments (US blog).
- **Why it helps**: It shows when money leaves, not just how much. **High** for us, because it is pure planning and needs no bank.

## Fit for CoinKeeper

| Feature                                           | Usefulness for our user | Model changes?                                     | API / services                                           | UI changes                                            | Effort (S/M/L) | Priority (Now/Next/Later/Skip) |
| ------------------------------------------------- | ----------------------- | -------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------- | -------------- | ------------------------------ |
| Virtual pots / goals (earmark part of an account) | High                    | New `goals`, `goal_allocations`                    | Goals service; balance check vs account balance          | Goals screen, account detail shows "earmarked / free" | M              | Now                            |
| Bills pot → upcoming bills + "left to pay"        | High                    | New `recurring_items` (shared with other research) | Occurrence generator, matcher                            | Upcoming bills list, calendar                         | M              | Now                            |
| "Left to spend" this period                       | High                    | None (derived)                                     | Summary endpoint                                         | Dashboard hero number                                 | S              | Now                            |
| Custom month start day / pay cycle                | High                    | `user_settings.period_start_day`                   | Period helper in `packages/shared`                       | Settings, all period pickers                          | M              | Next                           |
| Salary Sorter → payday plan                       | High                    | `payday_plans`, `payday_plan_lines`                | Plan apply → creates allocations or transfers on confirm | Prompt on income transaction                          | M              | Next                           |
| Overall monthly target + suggested targets        | Medium                  | `budgets` gains overall row or `monthly_targets`   | Suggest from 3-month average                             | Budgets screen                                        | S              | Next                           |
| Saving challenge templates (1p, 52-week)          | Medium                  | `goal_plans` (type enum)                           | Schedule generator                                       | Goal wizard                                           | S              | Later                          |
| Split / running tabs                              | Medium                  | Split lines + receivables                          | Settlement calc                                          | Split dialog, "owed to me"                            | L              | Later                          |
| Round-ups                                         | Low                     | None (report only)                                 | Round-up calc on spending                                | Insight card                                          | S              | Later                          |
| Get Paid Early, locked pots, interest             | Low                     | —                                                  | —                                                        | —                                                     | —              | Skip                           |

### Virtual pots (goals that earmark money)

- **What is it for?** It lets a user say "of the 3,000 in my savings account, 1,200 is the emergency fund, 800 is the holiday and 1,000 is free". This is the core Monzo experience without moving money. High usefulness: it covers vacation, house, car and emergency-fund goals in one concept.
- **Model changes.**
  - `goals`: `id`, `user_id`, `name`, `icon`, `colour`, `account_id` (asset account that holds the money), `currency` (must equal the account currency), `target_minor` (bigint, nullable), `target_date` (date, nullable), `kind` enum `savings | bills | sinking_fund`, `sort_order`, `archived_at`, `deleted_at`, timestamps.
  - `goal_allocations`: `id`, `user_id`, `goal_id`, `amount_minor` (signed bigint: + earmark, − release), `date`, `transaction_id` (nullable FK, for allocations created from a transfer into the account), `memo`, `deleted_at`.
  - A goal's balance is `SUM(amount_minor)` over non-deleted allocations. Nothing is cached, which keeps the ledger as the source of truth for account balances and makes allocations a second, auditable ledger of intentions.
  - A goal belongs to one currency, so we never mix currencies.
- **UI.** A new Goals screen shows cards with name, icon, progress ring, "x of y" and the target date. The account detail page gets a split bar: earmarked by each goal versus free. The transfer form gets an optional "for goal" field. The dashboard net-worth card can show "free to spend".
- **Implementation steps.**
  1. Add the schema, a migration and Zod contracts in `packages/shared`.
  2. Build a goals service with a validation step: the sum of allocations on an account may not exceed the account's computed balance at write time. Return a soft warning (not an error) when a later withdrawal makes the account "over-allocated".
  3. When a transfer into the goal's account is created with a `goalId`, insert an allocation linked to the transfer row.
  4. Add a suggested monthly amount: `ceil_div(target − saved, months_until(target_date))`, the same formula Firefly III uses.
  5. Build the UI and write tests.
- **Risks and open questions.** Should one goal be allowed to span several accounts? Firefly III allows it since v6.x, but it complicates currency handling, so start with one account. We also need a rule for what happens when an account is archived with allocations still on it.

### Upcoming bills and "left to spend"

- **What is it for?** It combines the Bills Pot and the Trends Balance tab. Left to spend = balance of spending accounts − bills still due before period end − unspent amounts earmarked in bills goals. It is the single most actionable number for the target user.
- **Model changes.** Add `recurring_items`: `id`, `user_id`, `name`, `payee_id`, `category_id`, `account_id`, `currency`, `amount_minor` (expected, signed), `amount_tolerance_minor`, `frequency` enum `weekly | monthly | yearly | every_n_days`, `interval`, `anchor_date`, `end_date`, `active`, `deleted_at`. Occurrences are computed, not stored. Add `transactions.recurring_item_id` (nullable) to mark a match.
- **UI.** Add a Bills section, as a list and a month calendar, with each occurrence marked paid, due or overdue. The dashboard gets a "Left to spend" hero with a tooltip that shows the formula.
- **Implementation.** Build an occurrence generator in `packages/shared` as a pure, tested function. A matcher links an imported or entered transaction when payee and amount are within tolerance and the date is within ±N days. The summary endpoint then computes left to spend per currency.
- **Risks.** Monzo's own bugs show that the period must follow the user's pay cycle. Implement `period_start_day` at the same time or soon after.

### Payday plan (Salary Sorter)

- **What is it for?** When income arrives, CoinKeeper proposes the saved split ("700 rent goal, 400 bills, 100 emergency fund"). The user confirms, and CoinKeeper records allocations, plus planned transfers the user must make at their bank.
- **Model.** `payday_plans` (`id`, `user_id`, `name`, `payee_id` or `category_id` trigger, `min_amount_minor`, `currency`) and `payday_plan_lines` (`plan_id`, `goal_id` or `account_id`, `mode` enum `fixed | percent`, `amount_minor` or `basis_points`, `sort_order`). Percentages are stored as integer basis points, not floats.
- **UI.** A "Sort this income" action on an income transaction, plus a banner in the review inbox when a matching income is imported.
- **Risks.** Users may think CoinKeeper moved the money. The copy must say "Plan" or "Earmark" and show a checklist of real transfers to make.

## What not to copy

- **Get Paid Early**: depends on UK Bacs clearing and being a bank.
- **Bills paid from a Pot automatically / auto-moving money**: we are not a bank and cannot move money.
- **Interest-bearing and fixed-term locked Pots**: banking products, and interest rates are regional.
- **Monthly-only periods (dropping weekly and 4-weekly)**: this lost Monzo long-time users. Keep period flexibility.
- **Paywalling custom categories and target suggestions**: custom categories are core budgeting for us, not a premium perk.
- **Credit score widgets and Billsback perks**: region-specific and unrelated to budgeting.

## Sources

- [Monzo Help – Understanding Salary Sorter](https://monzo.com/help/budgeting-overdrafts-savings/web-salary-sorter)
- [Monzo Help (IE) – Split your salary with Salary Sorter](https://monzo.com/ie/help/managing-money/help-salary-sorter)
- [Monzo blog – Introducing Salary Sorter and Bills Pots (2019)](https://monzo.com/blog/2019/09/26/introducing-salary-sorter-and-bills-pots)
- [Monzo blog – Locked Pots (2018)](https://monzo.com/blog/2018/12/13/locked-pots)
- [Monzo – Pots product page](https://monzo.com/pots)
- [Monzo Help – Understanding roundups](https://monzo.com/help/budgeting-overdrafts-savings/understanding-roundups)
- [Monzo Help – Spending, Balance and Targets in Trends](https://monzo.com/help/monzo-perks/trends-spending-and-balance-web)
- [Monzo Help – The differences between Summary and Trends](https://monzo.com/help/budgeting-overdrafts-savings/web-the-differences-between-Summary-and-Trends)
- [Monzo Help – Categories excluded from Trends](https://monzo.com/help/budgeting-overdrafts-savings/trends-excluded-categories-web)
- [Monzo Help (IE) – All about Trends](https://monzo.com/ie/help/managing-money/help-trends)
- [Monzo blog – A better way to budget is here (Targets, Dec 2022)](https://monzo.com/blog/targets-in-trends)
- [Monzo US blog – Category targets (search result)](https://monzo.com/us/blog/monzo-us-blog/trends-category-targets)
- [Monzo Help – What is paid early?](https://monzo.com/help/payments-getting-started/paid-early-how-to)
- [Monzo Help – Split costs with pals](https://monzo.com/help/monzo-with-friends/split-costs-with-pals-web)
- [Monzo Community – Bill splitting and Shared Tabs are now Monzo Split (Mar 2025)](https://community.monzo.com/t/bill-splitting-and-shared-tabs-are-now-monzo-split-and-even-better/176914)
- [Monzo Community – Bills Pot feedback (Mar 2025)](https://community.monzo.com/t/bills-pot-feedback/176452)
- [Monzo Community – Left to pay doesn't include scheduled payments](https://community.monzo.com/t/left-to-pay-in-my-bills-pot-doesnt-include-scheduled-payments/85207)
- [Monzo Community – Retiring the Summary feature](https://community.monzo.com/t/retiring-the-summary-feature/186087)
- [Monzo Community – Trends replaced Summary, 4-weekly salary no longer supported](https://community.monzo.com/t/trends-replaced-summary-4-weekly-salary-no-longer-supported/183956)
- [Monzo Community – Testing a Bills & Upcoming Payments Calendar (Feb 2026)](https://community.monzo.com/t/we-re-testing-something-new-for-bills-subscriptions-now-available-for-connected-accounts/189261)
- [Monzo – 1p Saving Challenge](https://monzo.com/features/1p-saving-challenge)
- [Monzo Learn – 1p Saving Challenge 2x and 4x amounts](https://monzo.com/learn/money-tomorrow/1p-saving-challenge-monthly-amounts)
- [Monzo – Plans comparison](https://monzo.com/current-account/plans)
- [Monzo Help – Perks, Max plan price changes](https://monzo.com/help/monzo-max/monzo-plan-price-change)
- [ReferralPlug – Monzo Extra vs Perks vs Max (2026 prices)](https://www.referralplug.co.uk/blog/monzo-extra-vs-perks-vs-max)
- [Pocketwise – Monzo Pots explained 2026](https://pocketwise.co.uk/banking/monzo/monzo-pots-explained/)
- [Banking Dive – Monzo to close US operations](https://www.bankingdive.com/news/monzo-close-us-accounts-june-operations-50-layoffs-europe-license-anil-layfield-uk-ipo/816357/)
- [Monzo Help – We've said goodbye to our US customers](https://monzo.com/help/us-account-closure-support/us-account-closure-support)
- [hellocomputer – Managing money with ADHD](https://hellocomputer.substack.com/p/managing-money-with-adhd)
