# Multi-currency money modelling & category taxonomy patterns

Research notes for the budget tracker (Next.js 16 · Drizzle · PostgreSQL · Clerk · lucide-react).
Compiled 2026-09-22.

## Summary

Three findings dominate:

1. **Our current schema stores money in `doublePrecision`.** `src/db/schema.ts` uses `doublePrecision` for `Account.balance`, `Transaction.amount` and both `MonthlyHistory`/`MonthlyCategoryGroupHistory` aggregates. This is the one thing every source agrees is wrong — binary floating point cannot represent 0.1 exactly, so sums drift. Postgres' own docs say floats "should not be used to handle money due to the potential for rounding errors." Migrating to integer minor units (or `numeric`) is the highest-value change in this whole document.
2. **Money is a pair, not a number.** Fowler's Money pattern: amount and currency travel together, always. Practically that means every money-bearing row gets a `currency` column (ISO-4217), and code refuses to add two Money values of different currencies without an explicit conversion.
3. **Lunch Money's flags beat YNAB's mechanics for our use case.** Rather than modelling credit-card payments as budget-category gymnastics, Lunch Money and Monarch/Copilot both just mark them as transfers/excluded and keep them out of spending totals. Two booleans (`excludeFromBudget`, `excludeFromTotals`) plus a transfer link is the whole feature.

---

## Money & multi-currency engineering

### Integer minor units vs `numeric` vs `money`

| Option | Verdict |
| --- | --- |
| `double precision` / `real` | **Never.** Base-2 fractions, silent drift on aggregation. Postgres docs explicitly warn against it. |
| `money` (Postgres type) | **Avoid.** Fractional digits come from the server's `lc_monetary` locale, output is locale-sensitive, and a dump restored into a differently-configured cluster can misread. No fractions of a cent. Crunchy Data: not recommended, use only for display formatting. |
| `numeric(p, s)` | Safe, exact, arbitrary precision. Crunchy Data calls it "widely considered the ideal datatype for storing money in Postgres." Costs ~10+ bytes/value and aggregates roughly 60% slower than integers (Xendit benchmark). Drizzle maps it to `string` by default, which is actually a feature — it prevents accidental JS float coercion. |
| `bigint` minor units | The Stripe approach: 5 USD → `500`. 8 bytes, fastest aggregation, exact by construction. Cost: every read/write needs a scale conversion, and the scale depends on the currency. |

**Recommendation for this app: `bigint` minor units + a `currency char(3)` column + a stored `exponent`-aware formatter.**

Rationale: a personal tracker does a lot of `SUM()` per month/category/currency, values are small, and there are no fractional-cent interest calculations. Integers make "does the account balance equal the sum of its transactions?" an exact test. Use a shared `Money` value object in TypeScript (`{ minor: bigint; currency: string }`) with `format()`, `add()`, `negate()` and `allocate()` (Fowler's allocation algorithm — distribute the remainder cent-by-cent so splits sum back to the original).

If you would rather not write conversion helpers, `numeric(19, 4)` is the defensible alternative; Lunch Money itself returns amounts as **strings with 4 decimal places** for exactly this reason (string transport avoids JS `number` precision loss).

Drizzle sketch:

```ts
amountMinor: bigint('amountMinor', { mode: 'bigint' }).notNull(),
currency:    char('currency', { length: 3 }).notNull(),   // ISO-4217, store uppercase
```

### Exponents are not always 2

ISO-4217 assigns each currency a minor-unit exponent: most are 2, **JPY/KRW/CLP are 0, KWD/BHD/JOD/TND are 3**. Hardcoding `/100` is a bug. Keep a small `currency` reference table (`code`, `exponent`, `symbol`, `name`) seeded once, and derive scaling from it — never from the value. `Intl.NumberFormat(locale, { style: 'currency', currency })` already knows the right fraction digits for display; use it for rendering and the table for arithmetic.

### Conversion: snapshot vs read-time

Two viable designs:

* **Snapshot on the row** — store `fxRate` and `amountInBaseMinor` on the transaction at write time (Lunch Money's `to_base` field is effectively this). Fast reads, no join, historically stable. Downside: changing your primary currency means a backfill, and a corrected rate never propagates.
* **Read-time conversion from a historical rates table** — `fx_rate(date, base, quote, rate)` with a unique key, joined at query time with a "nearest earlier date" fallback (weekends/holidays have no ECB fix). Flexible, one source of truth, but every aggregate query gains a join, and you must backfill rates for any date a user enters.

**Recommended: do both, in that order of priority.** Maintain the `fx_rate` table as the source of truth (a daily cron pulls the fix), and *denormalise* `rateToBase` + `amountBaseMinor` onto each transaction when it is written or when the rate first becomes available. That gives cheap reads, and a one-off recompute job when the user changes primary currency. This mirrors Lunch Money, which "uses historic currency exchange rates" fetched daily for 160+ currencies and falls back to the nearest available date when a rate is missing.

Important: **conversion is for display only.** The stored `amountMinor` + `currency` is the record of truth and should never be mutated by an FX update.

### Free rate sources

| Source | Notes / caveats |
| --- | --- |
| **frankfurter.dev** (ECB) | No key, no quota (soft rate limiting), latest + historical + time-series back to 1999. Only ~30 major currencies, **no crypto, weekdays only** (ECB publishes ~16:00 CET on business days). Best default for an EUR/USD/GBP-ish app. |
| **exchangerate.host** | ~170 currencies + crypto, historical since 1999, EUR-based by default with a `base` param. Now key-gated with tiered rate limits; the free tier has changed terms more than once. |
| **Open Exchange Rates** | Free tier = 1,000 requests/month, hourly updates, **USD base only** (you must cross-rate yourself). Fine if you cache one daily call. |
| **Synth (synthfinance.com)** | Developer-friendly, rates + tickers, free tier exists but is small and it is a young commercial product. |

Whichever you pick, **cache into your own `fx_rate` table** — one row per (date, quote) against a single base currency — and cross-rate in SQL. That isolates you from provider churn, which is the main risk here.

---

## The Lunch Money model

Lunch Money is the most directly relevant prior art: multi-currency first-class, API-documented, and deliberately not envelope-budgeting.

**Transaction** (v1 API): `id`, `date` (ISO-8601), `amount` (string, 4 dp), `currency` (lowercase ISO-4217), **`to_base`** (amount in the user's primary currency), `payee`, `original_name` (raw imported payee before renaming), `notes`, `category_id`/`category_name`, `category_group_id`/`category_group_name`, `is_income`, `exclude_from_budget`, `exclude_from_totals`, `status` (`cleared` | `uncleared` | `pending`), `is_pending`, `parent_id` + `has_children` (splits), `group_id` + `is_group` (grouping 2+ transactions under a synthetic parent), `recurring_id`, `tags[]`, `external_id` (user-supplied, max 75 chars, **unique per asset**), `plaid_account_id` (synced) vs `asset_id` (manual), `created_at`/`updated_at`.

Two details worth stealing outright:

* `external_id` is the import dedupe key and is scoped to the account — inserts with a duplicate `external_id` are rejected regardless of the `skip_duplicates` flag. A `unique(accountId, externalId)` partial index gives us idempotent imports for free.
* `status: uncleared` is the "needs review" signal. Imported rows land uncleared; the user clears them.

**Assets** (manual accounts): `type_name` ∈ `cash, credit, investment, real estate, loan, vehicle, cryptocurrency, employee compensation, other liability, other asset`; plus `subtype_name` (checking, savings, retirement…), `name`, `display_name`, `balance` (string, 4 dp), `balance_as_of`, `to_base`, `currency`, `institution_name`, `closed_on`, `exclude_transactions`. Note the **type/subtype split** — a two-level enum is more future-proof than our flat `AccountType`, and `closed_on` beats deleting an account.

**Categories**: `name` (1–40), `description` (≤140), `is_income`, `exclude_from_budget`, `exclude_from_totals`, `is_group`, `group_id`, `archived` + `archived_on`, `order`, `children[]`. Crucially, **a category inside a group inherits `is_income`, `exclude_from_budget` and `exclude_from_totals` from its group.** That single rule makes "Transfers" a group whose children are automatically excluded — no special-casing in query code.

**Multi-currency display**: the user picks a primary currency; every total, chart and net-worth figure is converted to it using the historical rate for that date, while amount input fields show a currency dropdown limited to the user's enabled currencies. Removing a currency from the enabled list only affects the dropdown; existing transactions keep theirs.

---

## Monarch & Copilot patterns

**Monarch** models categories in three layers: **Type → Group → Category**. The type is fixed (`Income`, `Expense`, `Transfer`); groups and categories are user-editable, carry an emoji/icon and a colour, and ship as ~15 default groups: Income, Food & Dining, Shopping, Auto & Transport, Housing, Bills & Utilities, Travel & Lifestyle, Health & Wellness, Children, Education, Gifts & Donations, Financial, Business, Uncategorized, Transfers. Default categories can be **disabled but not deleted** — deactivating hides them everywhere except settings, so historical transactions never orphan. Food & Dining ships with Groceries, Restaurants & Bars, Coffee Shops.

Monarch's **Needs Review** system: every transaction can be flagged manually or by an if-then rule ("amount > X", "merchant contains Y", "account = Z"), assignable to a specific household member, surfaced as a dashboard card plus email/push alerts, and clearable one-by-one or by swipe.

**Copilot** has only three transaction types: `Regular`, `Income`, `Internal Transfer`. Credit-card payments are auto-classified as **Internal Transfer** and excluded from spending budgets, "because that money is already accounted for in your budget with your individual transactions as they occur" — i.e. the card *purchases* are the spending; the payment is just moving money. Transfers render with a `[T]` marker. Separately, any transaction can be *excluded*, and excluded items get their own filter in the transaction list and a drill-down in the Cash Flow month view — excluded is hidden from totals but never hidden from the user.

**Plaid's PFC taxonomy** (16 primary / ~104 detailed, e.g. `FOOD_AND_DRINK` → `FOOD_AND_DRINK_GROCERIES`) is the reference hierarchy for auto-categorisation. Its primaries: INCOME, TRANSFER_IN, TRANSFER_OUT, LOAN_PAYMENTS, BANK_FEES, ENTERTAINMENT, FOOD_AND_DRINK, GENERAL_MERCHANDISE, HOME_IMPROVEMENT, MEDICAL, PERSONAL_CARE, GENERAL_SERVICES, GOVERNMENT_AND_NON_PROFIT, TRANSPORTATION, TRAVEL, RENT_AND_UTILITIES. Note it has an explicit `LOAN_PAYMENTS_CREDIT_CARD_PAYMENT` detail code — worth storing a nullable `plaidPfcDetailed` column on our categories now so a future import can map straight in.

---

## Proposed default taxonomy

Seed on signup. Groups carry the colour and the `is_income`/`exclude_*` flags; categories inherit them (Lunch Money rule) unless overridden.

| Group | Color | Category | Lucide icon |
| --- | --- | --- | --- |
| **Income** (`isIncome`) | `#16A34A` | Paycheck | `banknote` |
| | | Freelance & Side Income | `briefcase` |
| | | Investment Income | `trending-up` |
| | | Refunds & Reimbursements | `receipt` |
| | | Other Income | `hand-coins` |
| **Housing** | `#7C3AED` | Rent / Mortgage | `house` |
| | | Home Maintenance | `hammer` |
| | | Furniture & Decor | `sofa` |
| | | Home Insurance | `shield` |
| | | Property Tax / HOA | `landmark` |
| **Bills & Utilities** | `#0891B2` | Electricity & Gas | `zap` |
| | | Water & Waste | `droplets` |
| | | Internet & Cable | `wifi` |
| | | Mobile Phone | `smartphone` |
| | | Subscriptions | `repeat` |
| **Transportation** | `#EA580C` | Fuel | `fuel` |
| | | Public Transit | `bus-front` |
| | | Taxi & Rideshare | `car-front` |
| | | Parking & Tolls | `traffic-cone` |
| | | Car Payment & Insurance | `car` |
| | | Repairs & Maintenance | `wrench` |
| **Food & Dining** | `#DC2626` | Groceries | `shopping-cart` |
| | | Restaurants & Bars | `utensils` |
| | | Coffee Shops | `coffee` |
| | | Takeout & Delivery | `pizza` |
| **Shopping** | `#DB2777` | Clothing | `shirt` |
| | | Electronics | `laptop` |
| | | Home & Garden | `sprout` |
| | | General Merchandise | `shopping-bag` |
| | | Books & Hobbies | `book-open` |
| **Health & Wellness** | `#059669` | Doctor & Dental | `stethoscope` |
| | | Pharmacy | `pill` |
| | | Fitness | `dumbbell` |
| | | Health Insurance | `heart-pulse` |
| | | Personal Care | `scissors` |
| **Entertainment** | `#9333EA` | Streaming | `tv` |
| | | Movies & Events | `ticket` |
| | | Games | `gamepad-2` |
| | | Music | `music` |
| | | Sports & Recreation | `trophy` |
| **Travel** | `#2563EB` | Flights | `plane` |
| | | Lodging | `hotel` |
| | | Vacation & Activities | `tree-palm` |
| | | Travel Misc | `luggage` |
| **Personal & Family** | `#D97706` | Childcare | `baby` |
| | | Education | `graduation-cap` |
| | | Pets | `paw-print` |
| | | Family Support | `users` |
| **Financial** | `#475569` | Bank Fees | `landmark` |
| | | Interest & Charges | `percent` |
| | | Taxes | `calculator` |
| | | Savings & Investments | `piggy-bank` |
| | | Professional Services | `file-text` |
| **Gifts & Donations** | `#E11D48` | Gifts | `gift` |
| | | Charity | `hand-heart` |
| | | Celebrations | `party-popper` |
| **Transfers** *(system, `excludeFromBudget` + `excludeFromTotals`)* | `#64748B` | Credit Card Payment | `credit-card` |
| | | Account Transfer | `arrow-left-right` |
| **Uncategorized** *(system, undeletable)* | `#94A3B8` | Uncategorized | `circle-question-mark` |

Icon-name caveats: lucide renamed `palmtree` → `tree-palm` and `help-circle` → `circle-question-mark`; pin the `lucide-react` version and validate seeded names against the exported icon map in a test so a package bump can't silently break a category icon.

---

## UX patterns worth borrowing

* **Needs-review inbox.** A dashboard card + filtered list of transactions where `categoryId IS NULL` or `needsReview = true`, with inline category assignment and keyboard/swipe "next". Monarch flags via rules; Lunch Money uses `status = uncleared`. Combine: `needsReview boolean` set on import or when a category could not be inferred.
* **Rules engine.** `when payee contains "X" [and account = Y] [and amount between A and B] → set category Z / mark reviewed / mark transfer`. Store as ordered rows with a `priority` so they are deterministic; run on import and offer "apply to existing".
* **Payee → last-used category.** Cheapest possible auto-categorisation and it beats most heuristics. We already have `Payee.categoryId` — populate it from the most recent (or modal) category on each save and pre-fill the form.
* **Per-currency net worth cards.** One card per currency showing assets/liabilities/net in that currency, with the converted primary-currency total as a secondary line and a visible "rates as of <date>" caption. Never show a single blended number without showing the components.
* **Sidebar account groups.** Cash · Credit · Investments · Loans · Other, each with a group subtotal, collapsible, closed accounts hidden behind a toggle rather than deleted.
* **Credit-card "settle / pay" flow.** From a card account, a "Pay card" action that creates a linked transfer pair (debit checking / credit card) in the Transfers group, pre-filled with the statement balance, and excluded from spending. Copilot's `[T]` badge is a good visual precedent.
* **Month picker + donut by group.** Month stepper with a spending donut coloured by category-group colour, clicking a segment drills into that group's categories, then its transactions. The group colour from the seed table is what makes this cohesive.
* **Excluded is visible, not hidden.** Copilot's "Excluded Transactions" drill-down prevents the "where did my money go" confusion that hiding creates.

---

## Lessons for our app

1. **Migrate money off `doublePrecision` first** (`src/db/schema.ts`: `Account.balance`, `Transaction.amount`, `MonthlyHistory.income/expense`, `MonthlyCategoryGroupHistory.income/expense`). Go to `bigint` minor units. Do it before multi-currency, not after — the migration only gets harder with more data.
2. **Add `currency char(3)` to `Account` and `Transaction`**, plus `user.primaryCurrency` and an enabled-currencies list. A transaction's currency defaults to its account's. Add `fxRate numeric(18,8)` and `amountBaseMinor bigint` as denormalised snapshot columns.
3. **Add `currency_rate(date, quote, rate)`** with base = primary currency (or store everything against EUR and cross-rate). Daily cron from Frankfurter; nearest-earlier-date fallback.
4. **Net worth is per-currency by default.** Group accounts by currency, subtotal each, and show a converted grand total as an explicitly-labelled derived figure.
5. **Replace hardcoded categories with `category_group` + `category` tables**, both `userId`-scoped, with `color`, `icon` (lucide name), `order`, `isIncome`, `excludeFromBudget`, `excludeFromTotals`, `isSystem`, `archivedAt`. Seed the table above in a transaction on first sign-in (Clerk webhook or first authenticated request, idempotent on `userId`). Archive, never delete — historical transactions must keep resolving.
6. **Make `Transaction.categoryId` nullable and surface an "uncategorized" count** as a dashboard alert linking into the needs-review inbox. Add `needsReview boolean` so the inbox survives after categories are assigned by rules.
7. **Model card settlement as a transfer pair** in the system Transfers group. We already have `transferId` + `linkedAccountId` — the missing piece is the exclusion flags so these rows drop out of spending/budget aggregates, and a `TRANSFER` value alongside `EXPENSE`/`INCOME` in `transactionType` (or derive it from the group's flags, which is less duplication).
8. **Prepare for import now, cheaply:** add `externalId text` with `unique(accountId, externalId)`, `originalPayee text` (pre-rename raw string), and `importedAt`. Also consider `status` (`cleared`/`uncleared`/`pending`) instead of a bare boolean.
9. **Split the account type enum into type + subtype** (Lunch Money's list is a good vocabulary) and add `closedAt` so closed accounts stop polluting pickers without being soft-deleted.
10. **Aggregate tables need a currency dimension.** `MonthlyHistory` and `MonthlyCategoryGroupHistory` must key on currency too, or store base-currency minor units only — otherwise multi-currency silently corrupts the rollups.

---

## Sources

- Martin Fowler — Money pattern (P of EAA): https://martinfowler.com/eaaCatalog/money.html
- PostgreSQL docs — Monetary Types: https://www.postgresql.org/docs/current/datatype-money.html
- PostgreSQL docs — Numeric Types: https://www.postgresql.org/docs/current/datatype-numeric.html
- Crunchy Data — Working with Money in Postgres: https://www.crunchydata.com/blog/working-with-money-in-postgres
- cardinalby — Storing currency values: data types, caveats, best practices: https://cardinalby.github.io/blog/post/best-practices/storing-currency-values-data-types/
- Xendit Engineering — Benchmarking Postgres Numeric and Integer: https://medium.com/xendit-engineering/benchmarking-pg-numeric-integer-9c593d7af67e
- Lunch Money developer portal: https://lunchmoney.dev/
- Lunch Money v1 Transactions: https://lunchmoney.dev/v1/transactions
- Lunch Money v1 Assets: https://lunchmoney.dev/v1/assets
- Lunch Money v1 Categories: https://lunchmoney.dev/v1/categories
- Lunch Money — Multicurrency: https://support.lunchmoney.app/settings/multicurrency
- Lunch Money — Net Worth Tracker: https://support.lunchmoney.app/home/net-worth
- Monarch — Default Categories: https://help.monarch.com/hc/en-us/articles/360048883851-Default-Categories
- Monarch — Creating Custom Categories and Groups: https://help.monarch.com/hc/en-us/articles/360048883771-Creating-Custom-Categories-and-Groups
- Monarch — Reviewing Transactions: https://help.monarch.com/hc/en-us/articles/5528707082516-Reviewing-Transactions
- Copilot — Transaction Types: https://help.copilot.money/en/articles/3971267-transaction-types
- Copilot — Credit Card Payment Transactions: https://help.copilot.money/en/articles/10671434-credit-card-payment-transactions
- Copilot — Excluding Transactions: https://help.copilot.money/en/articles/9718801-excluding-transactions
- Plaid — Personal Finance Category taxonomy CSV: https://plaid.com/documents/transactions-personal-finance-category-taxonomy.csv
- Plaid — Transactions API reference: https://plaid.com/docs/api/products/transactions/
- Frankfurter (ECB rates): https://frankfurter.dev/
- exchangerate.host: https://exchangerate.host/
- Open Exchange Rates FAQ: https://openexchangerates.org/faq
- Lucide icons: https://lucide.dev/icons/
