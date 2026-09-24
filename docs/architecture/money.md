# Money and currencies

> Summary: how amounts are stored, parsed, formatted and converted, and the rules that keep multi-currency data honest.

## Representation

Every amount in the database and in the API is a pair:

```ts
{
  amountMinor: number;
  currency: string;
} // e.g. { amountMinor: -1250, currency: 'EUR' } = −12.50 €
```

- `amountMinor` is an integer in the currency's minor unit (cents for EUR, whole yen for JPY, thousandths for KWD). The column type is `bigint`, read as a JavaScript number, which is exact up to 2^53 minor units.
- The sign is the direction: negative leaves the account, positive enters it. A liability account (credit card, loan) therefore has a negative balance when you owe money; the UI flips the sign and labels it "owed".
- Zero amounts are rejected.

Floats never appear: forms submit the amount as a **string**, the server parses it with the account's currency, and the client formats minor units for display.

## The helpers (`packages/shared/src/lib/money.ts`)

| Function                                                | Purpose                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minorUnits(currency)`                                  | Decimal digits for a currency, from `Intl.NumberFormat` (EUR 2, JPY 0, KWD 3).                                                                                                                                                                                                                                 |
| `parseAmountInput(text, currency)`                      | Turns user input into minor units. Accepts `12.50`, `12,50`, `1.234,56`, `1,234.56`, `-7`, `(7)`. When both separators appear, the last one is the decimal separator; a separator that repeats is a thousands separator; a single separator is always decimal. Rejects more decimals than the currency allows. |
| `minorToDecimalString(minor, currency)`                 | The inverse, for pre-filling forms (`1250` → `"12.50"`).                                                                                                                                                                                                                                                       |
| `formatMoney(minor, currency, { locale, signDisplay })` | Localised display string via `Intl.NumberFormat`.                                                                                                                                                                                                                                                              |
| `convertMinor(minor, from, to, rate)`                   | Converts between currencies with different exponents, rounding half away from zero.                                                                                                                                                                                                                            |

The `Amount` component (`apps/web/src/components/ui/amount/`) wraps `formatMoney`, colours inflows and outflows when `signed`, and can flip the sign for liabilities.

## Currency rules

1. **Accounts own currencies.** An account is created in one currency (defaulting to the user's primary currency) and cannot change it once it has transactions.
2. **Transactions copy the currency** from their account at write time, so reports can group by currency without a join.
3. **Nothing is summed across currencies.** Dashboard cards, net worth, monthly totals, breakdowns and budgets are computed and rendered per currency.
4. **Cross-currency transfers carry two amounts**, one per leg in each account's currency. No rate is stored; the ratio of the legs is the realised rate including fees.
5. **Conversion is display-only** and optional. When "Show converted totals" is on, the dashboard adds an approximate total in the primary currency using the user's manual exchange rates, labelled with the rate dates. Currencies without a rate are listed as missing and left out, never assumed to be 1:1.

## Exchange rates

Rates live in `exchange_rates` as "1 `base` = `rate` `quote` from `date`". The lookup takes the most recent row on or before the requested date, and falls back to the inverse pair (`quote`→`base`, rate inverted, source marked "(inverse)").

The lookup is behind the `RateProvider` type in `apps/api/src/modules/fx/provider.ts`:

```ts
interface RateProvider {
  readonly name: string;
  getRate(userId, base, quote, date): Promise<RateQuote | null>;
}
```

`ManualRateProvider` (`apps/api/src/modules/fx/service.ts`) reads the table and ignores soft-deleted rates. To add an automatic source later, implement the type and register it in the provider list in `apps/api/src/modules/services.ts`; reports and the UI do not change.

## Worked example: a credit card in EUR

| Step                  | Rows written                                                                   | Checking | Visa             | Spending report |
| --------------------- | ------------------------------------------------------------------------------ | -------- | ---------------- | --------------- |
| Open accounts         | `opening` +150 000 on Checking                                                 | 1 500,00 | 0,00             | —               |
| Groceries on the card | `standard` −6 000 on Visa, category Groceries                                  | 1 500,00 | −60,00 (owed 60) | Groceries 60,00 |
| Pay the card          | `transfer` −6 000 on Checking and `transfer` +6 000 on Visa, one `transfer_id` | 1 440,00 | 0,00             | unchanged       |

The purchase was counted when it happened; the payment only moved money.
