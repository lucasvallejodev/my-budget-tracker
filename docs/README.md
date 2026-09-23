# CoinKeeper

> Summary: entry page of the documentation site; what the app is, how the docs are organised, and where to start.

CoinKeeper is a personal budget and spending tracker built with Next.js, Clerk, Drizzle ORM and PostgreSQL. It keeps a ledger of every movement of money across your accounts, in the currency of each account, and turns that ledger into balances, net worth, spending breakdowns, budgets and a review inbox.

## What makes it different

- **Exact money.** Amounts are stored as signed integers in minor units (cents) with an ISO currency code. Nothing is ever stored as a float.
- **One ledger, many views.** Balances, net worth, monthly reports and budgets are all queries over the same `transactions` table. There are no cached counters to drift.
- **Per currency, always.** Every figure is shown per currency. A converted total is optional and clearly labelled with the rate it used.
- **Transfers are not spending.** Moving money between your own accounts, including paying a credit card, writes two linked legs with no category. Spending reports never see them.
- **Your categories.** Coloured groups and iconed categories are your data, seeded with sensible defaults and editable at any time. Archiving keeps history intact.
- **Review before you trust.** Anything without a category, and everything imported from a bank file, waits in a review inbox.

## How the documentation is organised

| Section | Read it when you want to… |
| --- | --- |
| [Getting started](getting-started/setup.md) | install, configure and run the project, and learn the commands |
| [Architecture](architecture/overview.md) | understand how the pieces fit: layers, data model, money handling, server and frontend conventions, testing |
| [Features](features/accounts.md) | learn how each feature works, step by step, and what happens underneath |
| [Reference](reference/api.md) | look up an endpoint, a server action, a migration or the default categories |
| [Legacy](legacy/README.md) | read the original redesign proposal, research reports and migration notes |

Documentation for AI agents lives outside this site in the repository's `agents/` folder; see the root `README.md` and `CLAUDE.md`.

## Quick start

```bash
npm ci
cp .env.example .env      # fill in Clerk keys and a database password
npm run db:up
npm run db:migrate
npm run dev
```

Then open http://localhost:3000 and sign in. Your first request seeds the default categories and settings.

<!-- screenshot: dashboard after first sign-in with the empty state and "New transaction" button (docs/assets/screenshots/home-dashboard.png) -->
