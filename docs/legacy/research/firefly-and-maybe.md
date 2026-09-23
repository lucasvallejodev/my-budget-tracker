# Multi-currency modelling in Firefly III and Maybe/Sure

Research notes for the budget tracker (Next.js 16 + Drizzle + Postgres + Clerk). Focus: money, accounts, transfers, credit-card settlement, net worth, categories.

## Summary

The two apps sit at opposite ends of a spectrum.

**Firefly III** is strict double-entry: every transaction journal writes *two or more* rows into `transactions` (negative on the source, positive on the destination). A "transfer" is not a special construct — it is just a journal whose source and destination are both asset/liability accounts. Multi-currency is stored *on the row*: `transaction_currency_id` + optional `foreign_currency_id`/`foreign_amount`, plus a cached `native_amount` converted to the administration's primary currency. Reports deliberately **split per currency** rather than blending them.

**Maybe (and its community fork Sure)** is single-entry with a matched pair: an `Entry` carries `amount` + `currency` + `date` and points at a polymorphic `entryable` (`Transaction`, `Trade`, `Valuation`). A `Transfer` row *links* two existing transactions, and the resulting "kind" (`funds_movement` / `cc_payment` / `loan_payment`) is **denormalised onto each transaction** so reporting can filter it out with one `WHERE`. Currency conversion happens **at query time** via a `exchange_rates(from, to, date, rate)` join, and net worth is collapsed into one family currency.

For this project, Maybe's shape is the better fit (it is close to the existing single-row schema), with Firefly's per-currency reporting discipline and its "store both legs of a cross-currency transfer" rule borrowed on top.

---

## A. Firefly III (PHP/Laravel, AGPL)

### Data model

| Table | Key columns | Notes |
|---|---|---|
| `accounts` | `account_type_id`, `name`, `virtual_balance`, `iban`, meta: `currency_id`, `account_role` | Currency and role live in `account_meta`, not the column list |
| `account_types` | Asset, Expense, Revenue, Loan, Debt, Mortgage, Cash, Initial balance, Reconciliation, Liability credit | |
| `transaction_groups` | user's "one entry" wrapper | 1 group → N journals (splits) |
| `transaction_journals` | `transaction_type_id`, `date`, `description`, `bill_id` | Holds the *one* budget + *one* category; tags are M:N |
| `transactions` | `account_id`, `transaction_journal_id`, `amount`, `foreign_amount`, `transaction_currency_id`, `foreign_currency_id`, `native_amount`, `native_foreign_amount`, `identifier`, `reconciled` | Two rows per journal, amounts mirrored ± |
| `transaction_currencies` | `code`, `symbol`, `decimal_places` (up to 8) | ISO 4217 |
| `currency_exchange_rates` | from/to currency, `date`, `rate` | User-entered or downloaded |

Account roles include a credit-card role; a credit card is an **asset account with the credit-card role** or a liability, and `virtual_balance` models the limit ("If your credit card limit is 1000, set a virtual balance of 1000").

Transaction types fix the legal source/destination pairs:

| Type | Source | Destination |
|---|---|---|
| Withdrawal | Asset or Liability | Expense |
| Deposit | Revenue or Liability | Asset or Liability |
| Transfer | Asset or Liability | Asset or Liability |
| Opening balance | Opening-balance account | Asset |
| Reconciliation | Asset | same Asset |
| Liability credit | Liability-credit account | Liability |

### Transfers and credit-card payments

There is no exclusion flag. Paying a credit card is a **Transfer** (asset → liability), and because *"a budget is just another identifier to link withdrawals (only withdrawals) together"*, transfers can never land in a budget or in expense totals. Expense reporting keys off the transaction *type*, so exclusion is structural rather than a boolean. Repaying a loan is modelled as a withdrawal into the liability, which reduces its negative balance.

### Multi-currency

- Each administration has one **primary currency**; each asset account has its own currency.
- A transaction in a currency other than the account's requires **both** amounts: *"you must set the amount of the transfer in both currencies"* — stored as `amount`/`transaction_currency_id` and `foreign_amount`/`foreign_currency_id`.
- `native_amount` / `native_foreign_amount` are **cached conversions to the primary currency**, written by an observer, recomputable with `php artisan correction:recalculate-pc-amounts`. When no rate exists the conversion falls back to a rate of 1.
- Important cautionary tale: issue [#12455] showed `ConvertsAmountToPrimaryAmount` used `now()` instead of `$params->date`, so every historical row was converted at today's rate (fixed in v6.7.0).
- Amounts are high-precision decimals handled with bcmath strings, not integer cents — needed because currencies may declare up to 8 decimals.

### Net worth

Deliberately **per currency**. The maintainer's stated strategy is to *"split multiple currencies as much as possible, with double bars, double charts, and double report entries"*. A user preference ("convert to primary currency") optionally blends them using the cached native amounts. Budget limits are also per currency — a EUR 100 budget is untouched by USD spending unless a USD limit is added.

### Categories, rules, import

Categories are plain user-created labels with **no colour, no icon, no hierarchy, no income/expense classification**, and they *"cannot be monetized"* — budgets do the money part, tags do the many-to-many grouping. Firefly ships a full rules engine (triggers + actions, applied on store/update or manually) and a **separate** Data Importer app (CSV, GoCardless/Nordigen, SimpleFIN, Spectre).

---

## B. Maybe Finance / Sure (Rails, AGPL)

### Data model (from `db/schema.rb`)

| Table | Key columns | Notes |
|---|---|---|
| `families` | `currency` (default "USD"), `locale`, `country`, `date_format` | The "primary currency" holder |
| `accounts` | `family_id`, `name`, `accountable_type`/`accountable_id`, `classification` (**virtual, stored**), `balance` `decimal(19,4)`, `cash_balance`, `currency`, `status`, `locked_attributes` jsonb | `accountable`: Depository, CreditCard, Investment, Loan, Property, Vehicle, Crypto, OtherAsset, OtherLiability |
| `entries` | `account_id`, `entryable_type`/`entryable_id`, `amount decimal(19,4)`, `currency`, `date`, `name`, `excluded bool`, `notes`, `import_id` | The money row; `entryable` = Transaction / Trade / Valuation |
| `transactions` | `category_id`, `merchant_id`, `kind` (default `standard`) | Deliberately thin — no amount here |
| `transfers` | `inflow_transaction_id`, `outflow_transaction_id`, `status` (pending/confirmed), unique index on the pair | Links two existing transactions |
| `balances` | unique `(account_id, date, currency)`, `balance`, plus cash/non-cash inflow/outflow/adjustment columns and generated `start_balance`/`end_balance` | Daily snapshot per account |
| `exchange_rates` | `from_currency`, `to_currency`, `date`, `rate`, unique on the triple | |
| `categories` | `name`, `color` (default `#6172F3`), `lucide_icon` (default `shapes`), `parent_id`, `classification` (default `expense`), `family_id` | |
| `rules` | `resource_type`, `effective_date`, `active` + `rule_conditions`, `rule_actions` | |
| `imports` | `column_mappings` jsonb, `*_col_label`, `date_format`, `number_format`, `signage_convention`, `amount_type_strategy`, `raw_file_str`, `normalized_csv_str` | CSV mapping wizard state |

Sign convention: **positive = expense/outflow, negative = income/inflow** (see the classification CASE below).

### Transfers and credit-card payments

`Transfer` validates: different accounts, same family, opposite amounts (opposite *sign* when currencies differ), and the two dates within **4 days**. Its `kind_for_account` decides the label from the destination accountable: Loan → `loan_payment`, other liability (credit card) → `cc_payment`, otherwise `funds_movement`. That value is denormalised onto both `transactions.kind`.

```ruby
# transaction.rb — enum kind
"standard"        # regular transaction, included in budget analytics
"funds_movement"  # movement between accounts, excluded from budget analytics
"cc_payment"      # excluded from budget analytics
"loan_payment"    # payment to a Loan account, treated as an expense in budgets
"one_time"        # excluded from budget analytics
```

Reporting then filters in SQL, in `IncomeStatement::Totals`:

```sql
WHERE at.kind NOT IN ('funds_movement', 'one_time', 'cc_payment')
...
CASE WHEN ae.amount < 0 THEN 'income' ELSE 'expense' END
```

Note `loan_payment` is intentionally *kept* as an expense. `entries.excluded` is a separate per-row escape hatch.

**Auto-matching** (`Family::AutoTransferMatchable`) proposes transfers after import: opposite-signed transactions, different accounts of the same family, within a 4-day window, same amount when currencies match, or `ABS(inflow.amount / NULLIF(outflow.amount * rate, 0)) BETWEEN 0.95 AND 1.05` across currencies. Already-transferred and previously **rejected** pairs are excluded (a `RejectedTransfer` record is written on reject), and a Set prevents one transaction matching twice in a batch. Matches start as `pending` until confirmed.

### Currency and exchange rates

No amount is ever stored pre-converted. Conversion is a **left join at query time**:

```sql
LEFT JOIN exchange_rates er
  ON er.date = ae.date
 AND er.from_currency = ae.currency
 AND er.to_currency = :target_currency
-- amount * COALESCE(er.rate, 1)
```

Rates are fetched lazily: `ExchangeRate.find_or_fetch_rate` looks in the table first, then asks the provider registry (`:synth`), and with `cache: true` persists via `find_or_create_by!`; `import_provider_rates` backfills a date range. Missing provider or failed call returns `nil` and the join degrades to rate 1.

### Net worth

`BalanceSheet#net_worth = assets.total - liabilities.total`, both expressed in `family.currency`. `BalanceSheet::AccountTotals` does `SUM(accounts.balance * COALESCE(exchange_rates.rate, 1))` with the rate joined for *today*, grouped by `classification`, `accountable_type`, `id`. So unlike Firefly, Maybe gives **one blended number**, not a per-currency breakdown.

### Categories and defaults

Two levels maximum (`parent_id`); a subcategory inherits its parent's colour and must share the parent's classification. Defaults are seeded from a `default_categories` array in `Category`, not a migration.

Maybe (14 defaults): Income `#e99537 circle-dollar-sign` (income); then expenses — Loan Payments `#6471eb credit-card`, Fees `#6471eb credit-card`, Entertainment `#df4e92 drama`, Food & Drink `#eb5429 utensils`, Shopping `#e99537 shopping-cart`, Home Improvement `#6471eb house`, Healthcare `#4da568 pill`, Personal Care `#4da568 pill`, Services `#4da568 briefcase`, Gifts & Donations `#61c9ea hand-helping`, Transportation `#df4e92 bus`, Travel `#df4e92 plane`, Rent & Utilities `#db5a54 lightbulb`.

Sure expands to 22 with a Tailwind-ish palette and **drops `classification`**: Income `#22c55e circle-dollar-sign`, Food and Drink `#f97316 utensils`, Groceries `#407706 shopping-bag`, Shopping `#3b82f6 shopping-cart`, Transportation `#0ea5e9 bus`, Travel `#2563eb plane`, Entertainment `#a855f7 drama`, Healthcare `#4da568 pill`, Personal Care `#14b8a6 scissors`, Home Improvement `#d97706 hammer`, Mortgage/Rent `#b45309 home`, Utilities `#eab308 lightbulb`, Subscriptions `#6366f1 wifi`, Insurance `#0284c7 shield`, Sports and Fitness `#10b981 dumbbell`, Gifts and Donations `#61c9ea hand-helping`, Taxes `#dc2626 landmark`, Loan Payments `#e11d48 credit-card`, Services `#7c3aed briefcase`, Fees `#6b7280 receipt`, Savings and Investments `#059669 piggy-bank`, Investment Contributions `#0d9488 trending-up`.

Uncategorized is a synthetic bucket computed in `IncomeStatement` (no row, no children), not a real category.

### Rules and import

`Rule` has `resource_type` (only `transaction` today), `rule_conditions` (compound, one nesting level max) and `rule_actions` (at least one, no duplicate types), dispatched through `Rule::Registry::TransactionResource` and applied async via `RuleJob`. CSV import is a mapping wizard persisted in `imports`. Sure adds `import_rows`, `import_mappings`, `import_sessions`, `import_source_mappings`, `account_statements`, and on `entries`: `idempotency_key`, `import_locked`, `user_modified`, `reconciled_by_statement_id`.

---

## Comparison

| Dimension | Firefly III | Maybe / Sure |
|---|---|---|
| Entry style | True double-entry, 2+ rows per journal | Single `entries` row per account movement |
| Transfer | A *transaction type* (asset→asset) | A `transfers` row linking two transactions |
| CC payment | Transfer; excluded because budgets only see withdrawals | `kind = 'cc_payment'`, excluded by `NOT IN (...)` |
| Money type | bcmath decimal string, currency `decimal_places` up to 8 | `decimal(19,4)` |
| Currency per row | `transaction_currency_id` + `foreign_currency_id`/`foreign_amount` | `entries.currency` |
| Conversion | Cached `native_amount` written on save (+ recompute command) | Computed at query time via join |
| Rate table | `currency_exchange_rates` (manual or weekly download) | `exchange_rates(from,to,date,rate)` + lazy provider fetch |
| Net worth | **Split per currency**, optional blend to primary | **Blended** into `family.currency` at today's rate |
| Categories | Plain labels, no colour/icon/parent | colour + `lucide_icon` + `parent_id` (2 levels) + classification |
| Defaults seeded | No | Yes, `default_categories` in the model |
| Budgets | First-class, per period **and per currency** | Separate `budgets`/`budget_categories` (Sure adds rollover) |
| Import | Separate Data Importer app | In-app CSV wizard + auto transfer matching |

---

## Lessons for our app

1. **Don't go full double-entry.** Keep one row per movement (`transactions.account_id` + signed `amount`) and model a transfer as a *link* between two rows, like Maybe's `transfers` table. Firefly's two-row journal buys correctness you can get more cheaply with a `NOT NULL` pair + unique index.
2. **Add a `kind` enum on `transactions`** — `standard | funds_movement | cc_payment | loan_payment | adjustment` — denormalised at transfer-creation time from the destination account type, exactly like `Transfer.kind_for_account`. The monthly spending breakdown becomes `WHERE kind = 'standard'`, one indexed predicate, no joins. This is the single highest-value idea in this document for the CC-settlement requirement.
3. **Decide loan payments explicitly.** Maybe excludes `funds_movement`/`cc_payment`/`one_time` but *keeps* `loan_payment` as spending. Pick one and write it in the schema comment.
4. **Money type: `numeric(19,4)` + `currency char(3)` on every money row.** Drizzle's `numeric` maps to a string in JS — good, it forces you through a decimal helper instead of floats. Integer minor units break for 8-decimal currencies (crypto) and for FX rates. Store the currency on both the account *and* the transaction row so an FX transaction is self-describing.
5. **Cross-currency transfers: store both legs in their own currency.** No conversion, no stored rate — the implied rate is the ratio of the two legs. This is what both apps effectively do (Firefly via `foreign_amount`, Maybe via two entries) and it is the only representation that survives later rate revisions.
6. **Net worth per currency, as requested — and that matches Firefly, not Maybe.** Compute `SUM(balance) GROUP BY currency` and render one card per currency. Maybe's blended number is simpler but hides FX noise; if you later want a blended total, add it as an *optional* line with a visible "converted at <date> rate" label.
7. **If you ever cache a converted amount, key it on the transaction date, never `now()`.** Firefly shipped that exact bug (#12455). Prefer Maybe's query-time join with `COALESCE(rate, 1)` until performance forces a cache.
8. **Exchange rates table:** `exchange_rates(from_currency, to_currency, date, rate)` with a unique index on the triple, and a lazy `findOrFetchRate` that persists what it fetches. Degrade to rate 1 (and surface that in the UI) rather than failing the page.
9. **Categories: copy Maybe's column set verbatim** — `name`, `color` (hex), `icon` (lucide name, default `shapes`), `parent_id` (max 2 levels, child inherits parent colour), `classification` income|expense, `user_id`. "Colored groups" = parents. Seed from a `DEFAULT_CATEGORIES` constant in TypeScript on Clerk signup, not from a migration, so you can re-seed and evolve the list. Sure's 22-item palette above is a ready-made starting set. Consider Sure's `last_used_at` for ordering the picker.
10. **Uncategorized: keep `category_id` nullable** and compute the uncategorized bucket in the report query rather than creating a real "Uncategorized" row — Maybe does this, and it keeps the "you have N uncategorized transactions" alert a trivial `COUNT(*) WHERE category_id IS NULL AND kind = 'standard'`.
11. **Design the import table now, even if the UI comes later.** Copy `imports.column_mappings` (jsonb), `date_format`, `number_format`, `signage_convention`, and put `import_id` + an `external_id`/`idempotency_key` unique per account on transactions (Sure's `idempotency_key`, `import_locked`, `user_modified`). Re-importing the same CSV must be a no-op.
12. **Ship transfer auto-matching with the importer**, with Maybe's rules: opposite signs, different accounts, ±4 days, exact amount same-currency or 0.95–1.05 ratio cross-currency, `pending` until the user confirms, and a `rejected_transfers` table so a dismissed suggestion never comes back.
13. **Add `excluded boolean default false`** to transactions now. It costs one column and covers every "this one shouldn't count" case before you have rules.
14. **Later: daily balance snapshots.** Maybe's `balances(account_id, date, currency)` unique table is what makes its net-worth chart cheap. Don't build it yet, but don't design a schema that makes it impossible — keep transactions immutable-ish and dated.

---

## Sources

- Firefly III accounts: https://docs.firefly-iii.org/explanation/financial-concepts/accounts/
- Firefly III transactions: https://docs.firefly-iii.org/explanation/financial-concepts/transactions/
- Firefly III transaction types table: https://docs.firefly-iii.org/references/firefly-iii/transaction-types/
- Firefly III liabilities: https://docs.firefly-iii.org/explanation/financial-concepts/liabilities/
- Firefly III currencies (concept): https://docs.firefly-iii.org/explanation/financial-concepts/currencies/
- Firefly III how-to currencies: https://docs.firefly-iii.org/how-to/firefly-iii/features/currencies/
- Firefly III multi-currency tutorial: https://docs.firefly-iii.org/tutorials/finances/currencies/
- Firefly III exchange rates: https://docs.firefly-iii.org/explanation/financial-concepts/exchange-rates/
- Firefly III budgets: https://docs.firefly-iii.org/explanation/financial-concepts/budgets/
- Firefly III API overview: https://docs.firefly-iii.org/references/firefly-iii/api/ · Swagger: https://api-docs.firefly-iii.org/
- Firefly III `Transaction` model: https://github.com/firefly-iii/firefly-iii/blob/main/app/Models/Transaction.php
- Firefly III issue #12455 (native_amount used `now()`): https://github.com/firefly-iii/firefly-iii/issues/12455
- Firefly III discussion #5639 (per-currency reports): https://github.com/orgs/firefly-iii/discussions/5639
- Firefly III exchange-rate data repo: https://github.com/firefly-iii/exchange-rates
- Maybe schema: https://github.com/maybe-finance/maybe/blob/main/db/schema.rb
- Maybe `Account`: https://github.com/maybe-finance/maybe/blob/main/app/models/account.rb
- Maybe `Transaction` (kind enum): https://github.com/maybe-finance/maybe/blob/main/app/models/transaction.rb
- Maybe `Transfer`: https://github.com/maybe-finance/maybe/blob/main/app/models/transfer.rb
- Maybe `Family::AutoTransferMatchable`: https://github.com/maybe-finance/maybe/blob/main/app/models/family/auto_transfer_matchable.rb
- Maybe `IncomeStatement::Totals`: https://github.com/maybe-finance/maybe/blob/main/app/models/income_statement/totals.rb
- Maybe `BalanceSheet` / `AccountTotals`: https://github.com/maybe-finance/maybe/blob/main/app/models/balance_sheet.rb · https://github.com/maybe-finance/maybe/blob/main/app/models/balance_sheet/account_totals.rb
- Maybe `ExchangeRate::Provided`: https://github.com/maybe-finance/maybe/blob/main/app/models/exchange_rate/provided.rb
- Maybe `Category` (defaults): https://github.com/maybe-finance/maybe/blob/main/app/models/category.rb
- Maybe `Rule`: https://github.com/maybe-finance/maybe/blob/main/app/models/rule.rb
- Sure (community continuation) schema: https://github.com/we-promise/sure/blob/main/db/schema.rb
- Sure `Category` (22 defaults): https://github.com/we-promise/sure/blob/main/app/models/category.rb
