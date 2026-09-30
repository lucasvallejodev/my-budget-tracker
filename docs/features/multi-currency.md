# Multi-currency

> Summary: accounts in several currencies, per-currency reporting, the currency switch on Home, Budgets, Accounts and Analytics, manual exchange rates and the optional converted view.

## What you see

- Every account has one currency, shown next to its balance everywhere.
- Home, Budgets, Accounts and Analytics show **one currency at a time**, picked with the currency switch in the page header. With a single currency the switch is hidden and the app looks like a single-currency app.
- The Home net worth card lists every currency, the chosen one first.
- Transfers between accounts of different currencies ask for both amounts.
- Optionally, Home offers an approximate view in your primary currency: **≈ All in EUR** in the switch, and an approximate total under net worth.

<!-- screenshot: Home header with the currency switch showing EUR, USD and ≈ All in EUR, and the net worth card listing both currencies (docs/assets/screenshots/multicurrency-dashboard.png) -->

## Step by step

### Choose a currency

1. On Home, Budgets, Accounts or Analytics, click a currency in the switch in the page header, or focus it and use the arrow keys.
2. Every block of the page switches to that currency. Budgets are per currency, so the Budgets page lists only the budgets in the chosen one.
3. The choice is remembered in this browser (not in your account) and shared by these pages. Analytics also puts it in the address (`?currency=USD`), so a shared link opens in that currency. When the remembered currency is no longer offered, the page falls back to your primary currency, or to the first currency listed.

Home lists the currencies that have activity or accounts; Budgets and Analytics list your primary currency and the currency of every account; Accounts lists the currencies of your active accounts.

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
2. The currency switch on Home gains **≈ All in EUR** (your primary currency). Picking it shows income, spending and kept converted using the rate in force today, with a caption that starts "Approximate, using your manual rates" and lists the rates and their dates. The net worth card shows the converted net worth (≈) in every view, with the rates in its tooltip. Rates are shown to at most six significant digits, so a rate derived from the inverse of EUR→USD 1.13 reads `1 USD = 0.884956 EUR`; conversions still use the full value.
3. Currencies without a rate are named in a warning and left out of the total. They are never converted at 1:1.

## Automating rates later

Rates are read through the `RateProvider` interface (`apps/api/src/modules/fx/provider.ts`). The only implementation today is `ManualRateProvider`. A future provider (an ECB feed, a paid API, a scheduled CSV) implements `getRate(userId, base, quote, date)` and is added to the provider list in `apps/api/src/modules/services.ts`; nothing else changes. See [Money and currencies](../architecture/money.md).

## How it works

- Reports group by `transactions.currency`; net worth groups by `accounts.currency`.
- `reports.convertedTotals` converts each currency bucket with `fx.getRate(currency, primary, today)` and reports `missing` currencies.
- The summary endpoint includes `converted` only when `user_settings.show_converted_totals` is true; the switch offers **≈ All in** only then.
- The switch is `CurrencySwitch` with the `useCurrencyView` hook (`apps/web/src/components/finance/currency-switch/`); it stores the choice with `rememberValue(RememberedFields.currencyView, …)` in `apps/web/src/lib/form-memory.ts`. The caption comes from `describeConversion` in `apps/web/src/components/finance/conversion.ts`.
- Deleting a rate (`DELETE /api/v1/exchange-rates/:base/:quote/:date`) sets `deleted_at`; lookups ignore deleted rates, and `POST …/restore` or a new `PUT` for the same key brings the row back.
