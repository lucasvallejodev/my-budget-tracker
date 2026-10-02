# Demo account

> Summary: the seeded demo user Jhon Doe: how to create or refresh it with `npm run db:seed:demo`, where its credentials come from (`DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD`), what its two years of accounts, transactions, split purchases, recurring payments, templates, budgets, budget period and rules contain, what to look at to check each feature, how the dates follow the day you run it, why it never reaches production, and how the end-to-end suite uses it.

The demo account is a local user with two years of realistic history, so you can see every screen with data in it, compare a month with the same month last year, and try every feature without typing a transaction first. It is generated, not stored: each run rebuilds it up to the day you run it, so the current month is always partly filled.

## Create or refresh it

1. Choose the demo credentials in your `.env` (copied from `.env.example`). The password is required, needs 12 to 128 characters, and stays on your machine because `.env` is git-ignored:

   | Variable             | Value                                      |
   | -------------------- | ------------------------------------------ |
   | `DEMO_USER_EMAIL`    | The demo email; `test@test.com` when unset |
   | `DEMO_USER_PASSWORD` | A password you choose                      |

   The credentials are never committed: a password in the repository would fail the secret scan (gitleaks) and would be valid on any machine that runs the seed.

2. Start and migrate the database if it is not running yet:

   ```bash
   npm run db:up
   npm run db:migrate
   ```

3. Seed the demo account:

   ```bash
   npm run db:seed:demo
   ```

   It prints the email and how many accounts, entries, budgets, recurring payments and templates it wrote. Run `npm run db:migrate` first, so the database has the tables the seed writes to. Without `DEMO_USER_PASSWORD` it stops and says so.

4. Start the app with `npm run dev`, open http://localhost:3000 and sign in with `DEMO_USER_EMAIL` and `DEMO_USER_PASSWORD`.

Run the command again whenever you want fresh data. It deletes the previous demo user with everything it owns and creates it again, so any change you made while testing is lost.

<!-- screenshot: Home of the demo account with income, spending, cash flow and the review notice (docs/assets/screenshots/demo-account-dashboard.png) -->

## Who Jhon Doe is

Jhon earns 3,000 EUR a month (2,850 EUR until a raise a year ago), rents a flat, pays his bills from one current account, uses a credit card for everyday spending and pays it off every month. On payday he saves what is above a 3,000 EUR buffer, up to 600 EUR, and in expensive months he tops the current account up from savings. He keeps a small USD account where he earns royalties from licensing his photos and pays a financial adviser.

| Account          | Type        | Currency | Opening balance | Used for                                                            |
| ---------------- | ----------- | -------- | --------------- | ------------------------------------------------------------------- |
| Everyday account | Checking    | EUR      | 2,450.00        | Salary, rent, bills, groceries, transfers                           |
| Credit card      | Credit card | EUR      | 0.00            | Subscriptions, restaurants, shopping; paid off on the 4th           |
| Savings          | Savings     | EUR      | 8,200.00        | Up to 600 EUR on payday; top-ups back to Everyday in heavy months   |
| USD account      | Checking    | USD      | 640.00          | 120 EUR every quarter from the Everyday account, royalties, adviser |
| Cash             | Cash        | EUR      | 45.00           | 100 EUR withdrawn whenever it runs out, for coffee and the bakery   |

### Every month

| What                                                                                      | Account                | Amount                                              | When                                                                                                    |
| ----------------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Salary (Northwind Labs)                                                                   | Everyday account       | +3,000.00 EUR (+2,850.00 before the raise)          | A working day in the last week of the month                                                             |
| Savings transfer                                                                          | Everyday → Savings     | what is above 3,000 EUR, up to 600, in steps of 50  | Payday                                                                                                  |
| Rent (Oakwood Lettings)                                                                   | Everyday account       | −1,200.00 EUR                                       | 1st                                                                                                     |
| Electricity and gas                                                                       | Everyday account       | −40 to −80 EUR each                                 | 8th and 12th                                                                                            |
| Internet and mobile                                                                       | Everyday account       | −25.00 and −15.00 EUR                               | 15th and 18th                                                                                           |
| Travel pass                                                                               | Everyday account       | −40.00 EUR                                          | 2nd                                                                                                     |
| Gym, Netflix, Spotify                                                                     | Credit card            | −35.00, −12.99, −10.99 EUR                          | 3rd, 5th, 9th; Spotify rises to 11.99 three months ago; the latest Netflix charge is the first at 13.99 |
| USD top-up                                                                                | Everyday → USD         | 120 EUR at 1 EUR = 1.13 USD                         | 10th of March, June, September and December                                                             |
| Photo licensing royalties (Lumen Stock)                                                   | USD account            | +200 to +340 USD                                    | 20th                                                                                                    |
| Adviser fee (Harbor Financial Advice)                                                     | USD account            | −25 to −45 USD                                      | 22nd                                                                                                    |
| Groceries, restaurants, takeout, taxis, clothes, haircut, pharmacy, cinema, books, coffee | Everyday, card, cash   | varied                                              | spread across the month                                                                                 |
| Credit card payment                                                                       | Everyday → Credit card | last month's card spending                          | 4th                                                                                                     |
| Big monthly shop (Greenleaf Market), split                                                | Everyday account       | Groceries 60 to 95 EUR + Home & garden 15 to 35 EUR | 26th                                                                                                    |
| MegaMart, split (about one month in three)                                                | Credit card            | Clothing + General merchandise + Personal care      | 22nd                                                                                                    |
| Cleaner (Sparkle Cleaning)                                                                | Everyday account       | −45.00 EUR                                          | Every other Friday                                                                                      |

### Every year

| When            | What                                                                     |
| --------------- | ------------------------------------------------------------------------ |
| 15 March        | Home contents insurance, 180.00 EUR from the Everyday account            |
| Every quarter   | Water bill, 65.00 EUR; the latest one, due ten days ago, is still unpaid |
| July and August | Summer holiday: flights, a villa and tours (Travel)                      |
| 9 October       | BoxDrop Prime yearly membership, 89.00 EUR                               |
| December        | Christmas presents and a New Year's Eve dinner                           |

### Events along the way

| When             | What                                                                                                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 21 months ago    | A new laptop, 1,099.00 EUR, which needs a top-up from savings the month after                                                                                                          |
| 16 months ago    | A sofa, 649.00 EUR                                                                                                                                                                     |
| 15 months ago    | The deposit of the old flat comes back, +120.00 EUR in Refunds & reimbursements                                                                                                        |
| 10 months ago    | A photography workshop, 95.00 EUR                                                                                                                                                      |
| Five months ago  | Noise-cancelling headphones, 219.00 EUR                                                                                                                                                |
| Four months ago  | A returned jacket, +35.00 EUR refund in Clothing                                                                                                                                       |
| Three months ago | A weekend in Lisbon: flights, hotel and a tour (Travel)                                                                                                                                |
| Two months ago   | A birthday present, 60.00 EUR                                                                                                                                                          |
| Last month       | A dental check-up, 85.00 EUR                                                                                                                                                           |
| This month       | Two card purchases without a category wait on the Review page; card purchases from the last two days are pending; a cinema ticket charged twice was deleted and waits in Deleted items |

### Recurring payments and templates

| Recurring payment       | Repeats             | Amount        | What it shows                                                                       |
| ----------------------- | ------------------- | ------------- | ----------------------------------------------------------------------------------- |
| Rent                    | Monthly             | −1,200.00 EUR | every month paid and linked                                                         |
| Salary                  | Monthly             | +3,000.00 EUR | income matched within a 7-day window, both before and after the raise               |
| Netflix                 | Monthly             | −13.99 EUR    | **Up 8 %** in the subscription review (12.99 before the latest charge)              |
| Spotify                 | Monthly             | −11.99 EUR    | only the payments since the price rise are linked; older ones are outside the range |
| Fibre internet          | Monthly             | −25.00 EUR    | a fixed bill                                                                        |
| Home contents insurance | Yearly              | −180.00 EUR   | a yearly bill, spread to 15.00 EUR a month in the review                            |
| BoxDrop Prime           | Yearly              | −89.00 EUR    | a yearly subscription                                                               |
| Cleaner                 | Every 2 weeks       | −45.00 EUR    | a weekly-cadence bill                                                               |
| Water                   | Every 3 months      | −65.00 EUR    | **Overdue** on Upcoming: the latest payment is missing                              |
| SkyVault storage        | Monthly, from today | −2.99 EUR     | adds its due payment to Review the first time you open Upcoming                     |

A deleted series, "Old phone insurance", waits in **Settings › Deleted items › Recurring**. The gym, the mobile plan and the travel pass have no series on purpose: they appear under **Found in your history**.

Six templates are ready in the transaction form: **Coffee** (3.20 EUR cash), **Bakery** (asks for the amount), **Groceries** (asks for the amount), **Haircut** (18.00 EUR card), **Monthly savings** (a 500 EUR transfer) and **Cash withdrawal** (100 EUR). Coffee, Bakery, Groceries and Haircut were used by the seeded transactions, so they come first. A deleted template, "Old yoga pass", waits in Deleted items.

### Budgets, rules and settings

- Nine monthly budgets in EUR for every month: Groceries 350, Restaurants & bars 150, Takeout & delivery 60, Coffee 15, Electricity & gas 150, Clothing 80, Streaming 25, Taxi & rideshare 20, Home & garden 60. Some months end over the limit, some under; the split lines of the big shop count in Groceries and Home & garden.
- The budget period starts two working days before the last working day of the month, and the current period is moved to the day the latest salary arrived (unless that is already the rule's day).
- Five rules: Greenleaf, Netflix, Spotify, City Transit and QuickBite map to their categories.
- A manual exchange rate of 1 EUR = 1.13 USD on the first day of each month, and converted totals switched on.

## How the dates work

- "Today" is the local date of the machine that runs the command. The data covers the twenty-four previous full months and the current month up to today; nothing is dated in the future.
- Regular amounts come from a hash of the month and the item, so a given month always gets the same groceries, bills and savings no matter when you run the seed. Events are placed relative to the current month ("three months ago"), so they move forward with time.
- Payday moves around the last week of the month and never falls on a weekend, which makes the demo account useful for testing budget periods that follow payday.

## What to check with it

| Feature                  | Where                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| Year-over-year analytics | Analytics with **Compare** set to the same period last year; the salary raise shows in income |
| Split transactions       | Transactions, search "Big monthly shop": **Split into 2**; Budgets › Home & garden            |
| Templates                | New transaction: the chips; Settings › Templates                                              |
| Upcoming                 | Upcoming: overdue water, SkyVault due today, rent and salary paid, the subscription review    |
| Detected payments        | Upcoming › Found in your history: City Transit, Mobi Mobile, PulseFit Gym                     |
| Left to spend            | Home, current month                                                                           |
| Projected balances       | Accounts › Next 30 days                                                                       |
| Budget period            | Settings › Budget period; Budgets show the period dates in their pace                         |
| Deleted items            | Settings › Deleted items: a transaction, a template and a recurring payment to restore        |

## Safety

- The command refuses to run when `NODE_ENV` is `production`, and the production build of the API does not include it (`apps/api/tsup.config.ts` lists only the server, `migrate` and `reset-password`).
- Refreshing the account is the one place where CoinKeeper hard-deletes a user and its financial rows. It only deletes the user with `DEMO_USER_EMAIL`, and refuses when that email belongs to an account whose name is not the demo name, so pointing the variable at a real account cannot wipe it.

## How it works

| File                                         | Role                                                                                                                                                                                                                                                                    |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/demo/persona.ts`               | The user's name, accounts, salary, savings and transfer settings                                                                                                                                                                                                        |
| `apps/api/src/demo/credentials.ts`           | `demoCredentials(environment)`: reads `DEMO_USER_EMAIL` and `DEMO_USER_PASSWORD` and checks the password length                                                                                                                                                         |
| `apps/api/src/demo/spending.ts`              | Bills, income, everyday spending patterns, one-off events, review items, budgets and rules                                                                                                                                                                              |
| `apps/api/src/demo/events.ts`                | Yearly events, split purchases and templates                                                                                                                                                                                                                            |
| `apps/api/src/demo/recurring.ts`             | `demoSeries(plan)`: the recurring payments, anchored on the plan's dates                                                                                                                                                                                                |
| `apps/api/src/demo/entries.ts`               | The generators that turn each item into dated entries (monthly, yearly, split, fortnightly, quarterly, card payments, review items)                                                                                                                                     |
| `apps/api/src/demo/balance.ts`               | `balanceAccounts(entries)`: walks the history in date order and adds the payday savings transfer, savings top-ups below 200 EUR and ATM withdrawals when cash runs out                                                                                                  |
| `apps/api/src/demo/plan.ts`                  | `buildDemoPlan(today)`: a pure function that assembles the entries, transfers and budgets                                                                                                                                                                               |
| `apps/api/src/demo/random.ts`, `calendar.ts` | Deterministic pseudo-random numbers from a text key, and UTC date helpers (working days, month ends)                                                                                                                                                                    |
| `apps/api/src/demo/seed.ts`                  | `seedDemoAccount(services, today, credentials)`: deletes the old demo user, signs the new one up and writes everything through the normal services (templates and recurring payments first, so each payment is matched as it is recorded), so every ledger rule applies |
| `apps/api/src/cli/seed-demo.ts`              | The `db:seed:demo` command                                                                                                                                                                                                                                              |

The three data files (`persona.ts`, `spending.ts`, `events.ts`) are exempt from the magic-number lint rule, like test files, because their numbers are sample data rather than logic ([Code style](../architecture/code-style.md)). Tests: `plan.test.ts` checks the rules above (ranges, dates, the raise, splits that add up, the everyday account never below 200 EUR, card payments matching card spending), `seed.test.ts` seeds an in-memory database, signs in and checks templates, splits, linked payments, the overdue water bill, suggestions, the budget period and the deleted items.

## In end-to-end tests

`npm run test:e2e` seeds the demo account before the suite starts (`e2e/global-setup.ts`). The setup reads `.env` when it exists; when `DEMO_USER_PASSWORD` is still empty, as in CI, it generates a random password for the run and the spec reads the same value. Locally, running the suite therefore reseeds your demo account, keeping your own password. `e2e/demo-account.spec.ts` signs in as Jhon and checks Home. Other specs keep signing up their own throwaway users. See [Testing](../architecture/testing.md) › End to end.
