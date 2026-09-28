# Research

> Summary: index of the competitor research: why and how 20 budgeting and spending-tracker apps were studied, one line per app study describing what it covers and what CoinKeeper could borrow, the synthesis page, and how to keep the research current.

This section studies the budgeting and spending-tracker apps people use most, to decide which features make CoinKeeper more useful. Each app has its own study with its strongest feature, how its main features work, how they could be built in CoinKeeper, and the sources to read more. Start with [Feature opportunities](feature-opportunities.md) for the combined conclusions and the proposed roadmap.

## The user we evaluated against

Every feature was judged for one person: someone anywhere in the world who wants control of their money, wants to see where it goes, stop wasting it, spend better and save for things such as a holiday, a house, a car or an emergency fund. Features that depend on a country, a bank aggregator, a credit score or a tax system were marked as not to copy, and features that need bank sync were re-evaluated for manual entry and CSV import.

## How to read an app study

Every study in `apps/` follows the same structure, so studies can be compared section by section:

| Section               | What you find                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| At a glance           | Type of app, platforms, pricing, regions and bank sync, data entry, who it suits                                                                        |
| What makes it special | Its philosophy and what users praise or complain about                                                                                                  |
| Strongest feature     | The standout feature and how much it matters to our user                                                                                                |
| Feature deep dive     | Six to ten features: what each does, how it works (rules, formulas, states, screens; code paths for open-source apps) and a usefulness rating           |
| Fit for CoinKeeper    | A table rating each feature (usefulness, model changes, API, UI, effort, priority), then a deeper look at the most promising ones with a proposed model |
| What not to copy      | Region-specific, sync-dependent or dark-pattern features, with the reason                                                                               |
| Sources               | Every page used, mostly official help-centre articles, for further reading                                                                              |

The model proposals in each study are that study's view. [Feature opportunities](feature-opportunities.md) › Proposed data model reconciles them into one design with consistent table names.

## App studies

### Zero-based and envelope budgeting

| App                                    | What the study covers                                                                                                                                                         |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [YNAB](apps/ynab.md)                   | Ready to Assign, rolling Available balances, targets (set aside versus refill), overspending on cash and credit, Age of Money, loan planner; borrow targets and Cost to Be Me |
| [EveryDollar](apps/everydollar.md)     | Zero-based monthly plan, Left to Budget, Funds (sinking funds), Paycheck Planning, Margin Finder; borrow rollover funds with targets and a paycheck timeline                  |
| [Goodbudget](apps/goodbudget.md)       | Digital envelopes, Available, annual and goal envelopes, add-versus-set fills, household sync; borrow the spending-pace line on budget bars and the due-date fill formula     |
| [Actual Budget](apps/actual-budget.md) | Open-source envelope and tracking modes, budget automations (goal templates), schedules with fuzzy matching, rules, custom reports; borrow schedules and typed automations    |

### Modern all-in-one planners

| App                                          | What the study covers                                                                                                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Monarch Money](apps/monarch-money.md)       | Flex budgeting (fixed, non-monthly, flexible), rollover, goals that earmark account balances, recurring calendar, Sankey reports, sharing; borrow Flex and earmark goals  |
| [Copilot Money](apps/copilot-money.md)       | Learned To review inbox, pace-aware budgets, one-tap rebalancing, recurrings as committed spend, goals; borrow pace status and budget suggestions from history            |
| [Quicken Simplifi](apps/quicken-simplifi.md) | Spending Plan (available to spend), projected balances, recurring reminders, watchlists, refund tracker; borrow the per-day allowance, projections and watchlists         |
| [Lunch Money](apps/lunch-money.md)           | Multi-currency by design, multi-condition rules, tags, recurring items with matching windows, splits and groups, rollover, query tool; borrow rules, tags and suggestions |

### Spending control, subscriptions and coaching

| App                                  | What the study covers                                                                                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Rocket Money](apps/rocket-money.md) | Subscription and bill detection (Upcoming, All, Inactive), cancellation and negotiation, budgets, alerts, the Rowan agent; borrow ledger-based recurring detection with a SQL sketch |
| [PocketGuard](apps/pocketguard.md)   | Leftover (safe to spend) and its formula, bills, rollover, goals, debt payoff planner, the Pace forecast; borrow Leftover, rollover and Pace                                         |
| [Emma](apps/emma.md)                 | Subscriptions, payday-to-payday budgets, committed spending with a daily allowance, rolling budgets, recaps; borrow pay-cycle periods and recurring templates for manual accounts    |
| [Cleo](apps/cleo.md)                 | Chat coach with roast and hype tones, spending challenges, savings hacks, Autopilot; borrow ledger-based challenges, a tone layer over insights and an essentials split              |

### Global, manual-first, multi-currency trackers

| App                                                   | What the study covers                                                                                                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Spendee](apps/spendee.md)                            | Wallets, shared wallets, per-transaction foreign currency, budgets, labels; borrow the original currency with an editable remembered rate and per-day budgets             |
| [Wallet by BudgetBakers](apps/wallet-budgetbakers.md) | Planned payments (manual or automatic) with expected balance, templates, goals, debts, labels, group sharing; borrow templates, planned payments and debts                |
| [Money Lover](apps/money-lover.md)                    | Events with Travel Mode, debts and loans, goals, bills versus recurring, exclude from report; borrow trips with travel mode and debts with people                         |
| [Toshl Finance](apps/toshl-finance.md)                | About 200 currencies with historical rates, one category plus many tags, budgets with filters and time-passed markers, repeats, planning; borrow tags and sticky defaults |

### Saving automation, banking-app budgeting and open source

| App                                | What the study covers                                                                                                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Monzo](apps/monzo.md)             | Pots, Bills Pot, Salary Sorter, Trends and targets, round-ups, shared tabs, studied as UX patterns; borrow virtual pots, left to spend after bills and a payday split plan         |
| [Revolut](apps/revolut.md)         | Analytics by category, merchant and currency, spending limits, bill Pockets, Vaults, Trips, Group Bills; borrow the daily allowance, analytics pivots and trips                    |
| [Qapital](apps/qapital.md)         | Goal-based saving rules (Round-Up, Guilty Pleasure, 52 Week, Spend Less, Payday, Set & Forget); borrow goals with funding plans as suggested contributions                         |
| [Firefly III](apps/firefly-iii.md) | Open-source piggy banks, subscriptions, recurring transactions, rules engine, auto-budgets, tags, splits, Data Importer, with code paths; borrow goals, rollover and subscriptions |

## Apps considered and left out

| App                        | Why it has no study                                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Mint                       | Shut down in 2024; Monarch and Simplifi inherited most of its users and ideas                                   |
| Tiller                     | A bank feed into spreadsheets rather than an app model we could adopt                                           |
| Honeydue                   | Couples features are covered by the Monarch, Goodbudget and Spendee studies                                     |
| Region-locked banking apps | Their budgeting patterns are covered through Monzo and Revolut; the rest depends on being a bank in one country |

## Keeping the research current

The studies were written in September 2026 and quote prices, plans and availability from that time, which change often. When you use a study:

- check the linked sources before relying on a price or a regional limit;
- when CoinKeeper ships a feature from [Feature opportunities](feature-opportunities.md), update that page's ranked table and roadmap rather than the app studies;
- add a new app as `apps/<app-name>.md` with the same sections, a row in the matching table above and an entry in the sidebar.

Earlier research that shaped the current architecture (YNAB and Actual Budget data models, multi-currency modelling in Firefly III and Maybe) is kept in [Legacy documents](../legacy/README.md).
