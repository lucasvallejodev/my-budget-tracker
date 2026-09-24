# Data model (agent version)

> Summary: compact reference of every table, column and constraint in `apps/api/src/db/schema.ts` (users, sessions, soft-delete columns included), plus the semantics of `kind`, `status` and `needs_review`.

Common columns unless noted: `id text PK` (app-generated UUID), `user_id text → users(id) ON DELETE CASCADE`, `created_at`/`updated_at timestamptz`. Soft delete via `deleted_at` (transactions, accounts, rules, budgets, exchange rates), archiving via `archived_at` (accounts, category groups, categories, payees). This describes the API schema (`apps/api/src/db/schema.ts`, migration `apps/api/drizzle/0000_init.sql`); the web app's transitional copy lacks `users`, `sessions`, the foreign keys and the three new `deleted_at` columns.

| Table | Columns (type · notes) |
| --- | --- |
| `users` | `email` (unique, stored lower-case) · `password_hash` (argon2id) · `name?` · `last_sign_in_at?` |
| `sessions` | `user_id → users` · `token_hash` (unique SHA-256 of the cookie token) · `user_agent?` · `ip_address?` · `expires_at` · `last_used_at` · no `updated_at`; rows are hard-deleted on sign-out, revocation and expiry |

| Table | Columns (type · notes) |
| --- | --- |
| `currencies` (global, no user_id) | `code char(3) PK` · `name` · `symbol` · `minor_units int` (EUR 2, JPY 0, KWD 3) · `is_active bool` |
| `user_settings` | `user_id PK` · `primary_currency → currencies` · `locale text` · `seeded_version int?` · `show_converted_totals bool` |
| `accounts` | `name` · `type enum(checking,savings,cash,credit_card,loan,investment,other)` · `classification enum(asset,liability)` (derived: card/loan = liability) · `currency → currencies` (locked once used) · `institution?` `account_number?` `color?` `icon?` `notes?` · `counts_in_spending bool` (false for investment) · `archived_at?` · `deleted_at?` |
| `category_groups` | `name` · `kind enum(income,expense)` · `color text` (hex) · `sort_order int` · `is_system bool` (Income) · `archived_at?` |
| `categories` | `group_id → category_groups` · `name` · `icon text` (registry key) · `sort_order int` · `archived_at?` |
| `payees` | `name` (unique per user) · `default_category_id → categories?` · `archived_at?` |
| `transactions` | `account_id → accounts` · `category_id → categories?` · `payee_id → payees?` · `amount_minor bigint` (signed, ≠0) · `currency char(3)` (= account) · `date date` · `kind enum(standard,transfer,opening)` · `transfer_id text?` · `status enum(pending,cleared,reconciled)` · `needs_review bool` · `excluded bool` · `memo text` · `import_id text?` · `original_payee text?` · `deleted_at?` |
| `exchange_rates` | PK `(user_id, base, quote, date)` · `rate numeric(18,8)` · `source text` (`manual`) · `deleted_at?` |
| `budgets` | `category_id → categories` · `month date` (1st) · `currency` · `amount_minor bigint` · `deleted_at?` · unique `(category_id, month, currency)` over live and deleted rows (an upsert revives a deleted budget) |
| `rules` | `name` · `pattern text` (case-insensitive substring) · `category_id → categories` · `priority int` · `deleted_at?` |

## Constraints and indexes on `transactions`

```sql
CHECK (kind = 'standard' OR category_id IS NULL)
CHECK ((kind = 'transfer') = (transfer_id IS NOT NULL))
UNIQUE (account_id, import_id) WHERE import_id IS NOT NULL AND deleted_at IS NULL   -- API schema; the web copy omits the deleted_at condition
INDEX (user_id, date), (account_id, date), (user_id, category_id), (transfer_id)
```

## Semantics

| Field | Values and meaning |
| --- | --- |
| `kind` | `standard`: income/expense, counts in reports; `transfer`: one of two legs, balances only; `opening`: starting balance, balances only |
| `status` | `pending` (imported, unconfirmed) · `cleared` (default for manual) · `reconciled` (amount/date/account locked) |
| `needs_review` | set when saved without category, on import, or when its category is archived without a move; cleared by categorising or "Done" |
| `excluded` | in balances, out of reports |
| sign of `amount_minor` | negative = money out of the account; liabilities therefore have negative balances when owed |

## Report predicate (all reports)

```sql
t.deleted_at IS NULL AND t.kind = 'standard' AND NOT t.excluded AND a.counts_in_spending
-- income:   g.kind = 'income'  OR (g.kind IS NULL AND amount > 0)
-- spending: g.kind = 'expense' OR (g.kind IS NULL AND amount < 0), reported as a positive number
```

Net worth: all live rows of non-archived accounts, grouped by `accounts.currency`, split by `classification`.

## Migrations

`apps/web/drizzle/0000_initial.sql` (legacy Prisma schema, kept for upgrade order) → `apps/web/drizzle/0001_ledger.sql` (current schema, currency seed, legacy data migration, drops). Generate new ones with `npm run db:generate`, review, then `npm run db:migrate`. PGlite tests apply all migrations from scratch.
