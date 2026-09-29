# Demo account

> Summary: the seeded demo user Jhon Doe: how to create or refresh it with `npm run db:seed:demo`, where its credentials come from (`DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD`), what its seven months of accounts, transactions, budgets and rules contain, how the dates follow the day you run it, why it never reaches production, and how the end-to-end suite uses it.

The demo account is a local user with about half a year of realistic history, so you can see every screen with data in it instead of an empty dashboard. It is generated, not stored: each run rebuilds it up to the day you run it, so the current month is always partly filled.

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

   It prints the email and how many accounts, entries and budgets it wrote. Without `DEMO_USER_PASSWORD` it stops and says so.

4. Start the app with `npm run dev`, open http://localhost:3000 and sign in with `DEMO_USER_EMAIL` and `DEMO_USER_PASSWORD`.

Run the command again whenever you want fresh data. It deletes the previous demo user with everything it owns and creates it again, so any change you made while testing is lost.

<!-- screenshot: dashboard of the demo account with income, spending, cash flow and the review notice (docs/assets/screenshots/demo-account-dashboard.png) -->

## Who Jhon Doe is

Jhon earns 3,000 EUR a month, rents a flat, pays his bills from one current account, uses a credit card for everyday spending and pays it off every month. He saves 400 to 600 EUR a month and keeps a small USD account where he earns royalties from licensing his photos and pays a financial adviser.

| Account          | Type        | Currency | Opening balance | Used for                                                             |
| ---------------- | ----------- | -------- | --------------- | -------------------------------------------------------------------- |
| Everyday account | Checking    | EUR      | 2,450.00        | Salary, rent, bills, groceries, transfers                            |
| Credit card      | Credit card | EUR      | 0.00            | Subscriptions, restaurants, shopping; paid off on the 4th            |
| Savings          | Savings     | EUR      | 8,200.00        | 400 to 600 EUR after every payday                                    |
| USD account      | Checking    | USD      | 640.00          | 100 to 140 EUR a month from the Everyday account, royalties, adviser |
| Cash             | Cash        | EUR      | 45.00           | 100 EUR withdrawn on the 14th for coffee and the bakery              |

### Every month

| What                                                                                      | Account                | Amount                             | When                                                   |
| ----------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------- | ------------------------------------------------------ |
| Salary (Northwind Labs)                                                                   | Everyday account       | +3,000.00 EUR                      | A working day in the last week of the month            |
| Savings transfer                                                                          | Everyday → Savings     | 400 to 600 EUR, in steps of 50     | The day after payday                                   |
| Rent (Oakwood Lettings)                                                                   | Everyday account       | −1,200.00 EUR                      | 1st                                                    |
| Electricity and gas                                                                       | Everyday account       | −40 to −80 EUR each                | 8th and 12th                                           |
| Internet and mobile                                                                       | Everyday account       | −25.00 and −15.00 EUR              | 15th and 18th                                          |
| Travel pass                                                                               | Everyday account       | −40.00 EUR                         | 2nd                                                    |
| Gym, Netflix, Spotify                                                                     | Credit card            | −35.00, −12.99, −10.99 EUR         | 3rd, 5th, 9th; Spotify rises to 11.99 three months ago |
| USD top-up                                                                                | Everyday → USD         | 100 to 140 EUR at 1 EUR = 1.13 USD | 10th                                                   |
| Photo licensing royalties (Lumen Stock)                                                   | USD account            | +200 to +340 USD                   | 20th                                                   |
| Adviser fee (Harbor Financial Advice)                                                     | USD account            | −25 to −45 USD                     | 22nd                                                   |
| Groceries, restaurants, takeout, taxis, clothes, haircut, pharmacy, cinema, books, coffee | Everyday, card, cash   | varied                             | spread across the month                                |
| Credit card payment                                                                       | Everyday → Credit card | last month's card spending         | 4th                                                    |

### Events along the way

| When             | What                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| Five months ago  | Noise-cancelling headphones, 219.00 EUR                                                                           |
| Four months ago  | A returned jacket, +35.00 EUR refund in Clothing                                                                  |
| Three months ago | A weekend in Lisbon: flights, hotel and a tour (Travel)                                                           |
| Two months ago   | A birthday present, 60.00 EUR                                                                                     |
| Last month       | A dental check-up, 85.00 EUR                                                                                      |
| This month       | Two card purchases without a category wait in the review inbox; card purchases from the last two days are pending |

### Budgets, rules and settings

- Eight monthly budgets in EUR for every month: Groceries 350, Restaurants & bars 150, Takeout & delivery 60, Coffee 15, Electricity & gas 150, Clothing 80, Streaming 25, Taxi & rideshare 20. Some months end over the limit, some under.
- Five rules: Greenleaf, Netflix, Spotify, City Transit and QuickBite map to their categories.
- A manual exchange rate of 1 EUR = 1.13 USD on the first day of each month, and converted totals switched on.

## How the dates work

- "Today" is the local date of the machine that runs the command. The data covers the six previous full months and the current month up to today; nothing is dated in the future.
- Regular amounts come from a hash of the month and the item, so a given month always gets the same groceries, bills and savings no matter when you run the seed. Events are placed relative to the current month ("three months ago"), so they move forward with time.
- Payday moves around the last week of the month and never falls on a weekend, which makes the demo account useful for testing budget periods that follow payday.

## Safety

- The command refuses to run when `NODE_ENV` is `production`, and the production build of the API does not include it (`apps/api/tsup.config.ts` lists only the server, `migrate` and `reset-password`).
- Refreshing the account is the one place where CoinKeeper hard-deletes a user and its financial rows. It only deletes the user with `DEMO_USER_EMAIL`, and refuses when that email belongs to an account whose name is not the demo name, so pointing the variable at a real account cannot wipe it.

## How it works

| File                                         | Role                                                                                                                                                                             |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/demo/persona.ts`               | The user's name, accounts, salary, savings and transfer settings                                                                                                                 |
| `apps/api/src/demo/credentials.ts`           | `demoCredentials(environment)`: reads `DEMO_USER_EMAIL` and `DEMO_USER_PASSWORD` and checks the password length                                                                  |
| `apps/api/src/demo/spending.ts`              | Bills, income, everyday spending patterns, one-off events, review items, budgets and rules                                                                                       |
| `apps/api/src/demo/plan.ts`                  | `buildDemoPlan(today)`: a pure function that turns the persona into dated entries, transfers and budgets                                                                         |
| `apps/api/src/demo/random.ts`, `calendar.ts` | Deterministic pseudo-random numbers from a text key, and UTC date helpers (working days, month ends)                                                                             |
| `apps/api/src/demo/seed.ts`                  | `seedDemoAccount(services, today, credentials)`: deletes the old demo user, signs the new one up and writes everything through the normal services, so every ledger rule applies |
| `apps/api/src/cli/seed-demo.ts`              | The `db:seed:demo` command                                                                                                                                                       |

The two data files are exempt from the magic-number lint rule, like test files, because their numbers are sample data rather than logic ([Code style](../architecture/code-style.md)). Tests: `plan.test.ts` checks the rules above (ranges, dates, balances never below zero, card payments matching card spending), `seed.test.ts` seeds an in-memory database and signs in.

## In end-to-end tests

`npm run test:e2e` seeds the demo account before the suite starts (`e2e/global-setup.ts`). The setup reads `.env` when it exists; when `DEMO_USER_PASSWORD` is still empty, as in CI, it generates a random password for the run and the spec reads the same value. Locally, running the suite therefore reseeds your demo account, keeping your own password. `e2e/demo-account.spec.ts` signs in as Jhon and checks the dashboard. Other specs keep signing up their own throwaway users. See [Testing](../architecture/testing.md) › End to end.
