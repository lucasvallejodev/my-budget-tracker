# Multi-currency

> Summary: accounts in several currencies, per-currency reporting, manual exchange rates and the optional converted total.

## What you see

- Every account has one currency, shown next to its balance everywhere.
- The dashboard renders **one set of cards per currency**: income, spending and savings rate for the month, a cash-flow chart, a net-worth card and a spending donut. With a single currency it looks like a single-currency app.
- Transfers between accounts of different currencies ask for both amounts.
- Optionally, a **converted totals** panel shows an approximate net worth, income and spending in your primary currency.

<!-- screenshot: dashboard with EUR and USD sections stacked, each with its own net-worth card (docs/assets/screenshots/multicurrency-dashboard.png) -->

## Step by step

### Set your primary currency

1. Go to **Settings → Currencies** and open the currency settings.
2. Pick the **primary currency**. It becomes the default for new accounts and the target for converted totals. Existing accounts are untouched.

### Add an account in another currency

Create an account as usual and choose its currency. See [Accounts](accounts.md).

### Enter exchange rates by hand

1. On the same settings page, under **Exchange rates**, choose the base currency (1 unit of…), the quote currency (equals … in), the rate and the date from which it applies.
2. Click **Save rate**. Saving the same pair and date again overwrites the rate.
3. The table lists rates newest first; delete one with the bin icon. A deleted rate stops being used for conversions and can be restored from **Settings › Deleted items** (see [Deleted items](deleted-items.md)); saving the same pair and date again also brings it back with the new value.

A rate stays in force until a newer one exists for the same pair. Inverse pairs are derived automatically (if you saved EUR→USD, USD→EUR works too).

<!-- screenshot: currency settings page with the primary currency select, the converted-totals toggle and two saved rates (docs/assets/screenshots/multicurrency-settings.png) -->

### Turn on converted totals

1. Toggle **Show converted totals**.
2. The dashboard gains a panel "≈ Converted totals · EUR" with net worth, income and spending converted using the rate in force today, and a caption listing the rates and their dates.
3. Currencies without a rate are named in a warning and left out of the total. They are never converted at 1:1.

## Automating rates later

Rates are read through the `RateProvider` interface (`apps/api/src/modules/fx/provider.ts`). The only implementation today is `ManualRateProvider`. A future provider (an ECB feed, a paid API, a scheduled CSV) implements `getRate(userId, base, quote, date)` and is added to the provider list in `apps/api/src/modules/services.ts`; nothing else changes. See [Money and currencies](../architecture/money.md).

## How it works

- Reports group by `transactions.currency`; net worth groups by `accounts.currency`.
- `reports.convertedTotals` converts each currency bucket with `fx.getRate(currency, primary, today)` and reports `missing` currencies.
- The summary endpoint includes `converted` only when `user_settings.show_converted_totals` is true.
- Deleting a rate (`DELETE /api/v1/exchange-rates/:base/:quote/:date`) sets `deleted_at`; lookups ignore deleted rates, and `POST …/restore` or a new `PUT` for the same key brings the row back.
