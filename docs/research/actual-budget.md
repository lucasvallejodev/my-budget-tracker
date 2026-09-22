# Actual Budget — architecture research

Research notes for our Next.js 16 / Drizzle / PostgreSQL budget tracker. Source: [actualbudget/actual](https://github.com/actualbudget/actual) (MIT) at `master`, plus [actualbudget.org/docs](https://actualbudget.org/docs/). Code excerpts are short and MIT-licensed.

## Summary

Actual is an envelope ("zero-sum") budgeting app backed by SQLite with a CRDT sync layer. The parts worth stealing for us:

- **Money is an integer** in minor units (cents). No floats anywhere in storage.
- **Nothing is hard-deleted.** Every user-facing table carries `tombstone INTEGER DEFAULT 0`.
- **Accounts are `offbudget` / `closed` flags**, not types. A credit card is just an on-budget account that goes negative.
- **A transfer is two real transactions** linked by `transferred_id`, whose payee is a synthetic "transfer payee" that points at the other account (`payees.transfer_acct`). Between two same-budget-status accounts the **category is forcibly nulled** — that is exactly the "credit-card payment must not count as spending" behaviour we want, and it falls out of the model for free.
- **Categories have no colour and no icon.** Confirmed in the schema and in the docs. Groups are just `name` + `is_income` + `sort_order` + `hidden`.
- **Renames/merges go through mapping tables** (`category_mapping`, `payee_mapping`) so historical rows stay pointing at a live id.
- **Multi-currency is not supported.** There is only a single budget-wide display currency preference.

## Schema

All ids are `TEXT` UUIDs. `sort_order` is a `REAL` seeded at multiples of 16384 so an insert between two rows is a midpoint average, never a renumber. Source of truth: [`init.sql`](https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/server/sql/init.sql) + [`migrations/`](https://github.com/actualbudget/actual/tree/master/packages/loot-core/migrations), consolidated as TypeScript in [`server/db/types/index.ts`](https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/server/db/types/index.ts).

### accounts

| Field | Meaning |
| --- | --- |
| `id` | UUID PK |
| `name` | display name |
| `offbudget` `1/0` | off-budget accounts don't affect the budget; their transactions aren't categorised |
| `closed` `1/0` | soft-closed; hidden from sidebar, balance must first be transferred out |
| `sort_order` | REAL, manual ordering |
| `tombstone` `1/0` | soft delete |
| `type`, `subtype`, `mask`, `official_name`, `bank`, `account_id` | bank-sync metadata |
| `balance_current/available/limit` | cached values from bank sync only |
| `account_sync_source` | `'simpleFin' \| 'goCardless' \| null` |
| `last_reconciled`, `last_sync`, `bank_sync_status` | sync bookkeeping |
| `account_group_id` | recent addition, optional grouping of accounts |

Note there is **no `currency` column** and no per-account balance column used for real balances — balance is always `SUM(amount)` over transactions.

### transactions

| Field | Meaning |
| --- | --- |
| `id` | UUID PK |
| `acct` | FK accounts |
| `amount` | **signed integer, minor units.** Negative = outflow |
| `date` | stored as `INTEGER` `YYYYMMDD`, not a date type |
| `category` | FK categories, **nullable** — null = uncategorised (or a transfer) |
| `description` | actually the **payee id** (legacy name; the view aliases it to `payee`) |
| `notes` | free text |
| `isParent` / `isChild` / `parent_id` | split model |
| `transferred_id` | the id of the mirrored transaction on the other account |
| `financial_id` | the bank's id → exposed as `imported_id` |
| `imported_description` | raw imported payee string → `imported_payee` |
| `cleared` `1/0` (default **1**) | appears on the statement |
| `reconciled` `1/0` | locked by a reconciliation |
| `starting_balance_flag` | the synthetic opening-balance row |
| `schedule` | FK schedules |
| `sort_order`, `tombstone`, `error` | ordering, soft delete, split-imbalance blob |

Reads go through a view, not the table — this is how renames stay cheap:

```sql
CREATE VIEW v_transactions_layer2 AS
SELECT t.id, t.isParent AS is_parent, t.isChild AS is_child, t.acct AS account,
  CASE WHEN t.isChild = 0 THEN NULL ELSE t.parent_id END AS parent_id,
  CASE WHEN t.isParent = 1 THEN NULL ELSE cm.transferId END AS category,
  pm.targetId AS payee, t.imported_description AS imported_payee,
  IFNULL(t.amount, 0) AS amount, t.financial_id AS imported_id,
  t.transferred_id AS transfer_id, ...
FROM transactions t
LEFT JOIN category_mapping cm ON cm.id = t.category
LEFT JOIN payee_mapping  pm ON pm.id = t.description
WHERE t.date IS NOT NULL AND t.acct IS NOT NULL
  AND (t.isChild = 0 OR t.parent_id IS NOT NULL);
```

Note a **parent transaction's category is always NULL** in the view — only the children carry categories.

### categories / category_groups

| `categories` | Meaning |
| --- | --- |
| `id`, `name` | |
| `cat_group` | FK category_groups |
| `is_income` `1/0` | must match the group |
| `sort_order` REAL | within the group |
| `hidden` `1/0` | hidden but still budgeted |
| `tombstone` | soft delete |
| `goal_def`, `cleanup_def`, `template_settings` | goal/template JSON |

| `category_groups` | Meaning |
| --- | --- |
| `id`, `name` (originally UNIQUE, later relaxed) | |
| `is_income` `1/0` | exactly one income group is allowed and it can't be deleted |
| `sort_order` REAL, `hidden` `1/0`, `tombstone` | |

**No `color`, no `icon`, no `emoji` field exists** on either table. The [categories doc](https://actualbudget.org/docs/budgeting/categories) has no styling section either.

### payees

| Field | Meaning |
| --- | --- |
| `id`, `name` | transfer payees have `name = ''` and render as the account name |
| `transfer_acct` | FK accounts — **non-null means this payee *is* an account** |
| `favorite` `1/0` | pinned to the top of the autocomplete |
| `learn_categories` `1/0` (default 1) | opt out of auto-categorisation learning |
| `tombstone` | soft delete |
| `category` | legacy, unused |

### mapping tables

`category_mapping(id, transferId)` and `payee_mapping(id, targetId)` — every row is created pointing at **itself**; on a merge/delete the mapping is repointed and existing mappings that pointed at the deleted row are forwarded too. Transactions never get rewritten.

### others

`rules(id, stage, conditions JSON, actions JSON, conditions_op, tombstone)`, `transaction_filters(id, name, conditions JSON, conditions_op, tombstone)`, `schedules(id, name, rule, active, completed, posts_transaction, sort_order, tombstone)` + `schedules_next_date`, and the budget tables `zero_budgets` / `reflect_budgets` `(id, month, category, amount, carryover, goal, long_goal)` plus `zero_budget_months(id, buffered)` — envelope vs. tracking budget, one row per (month, category). `carryover` is the "roll over the overspend" flag.

## Transfers & credit cards

Creating an account also creates its transfer payee ([`accounts/app.ts`](https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/server/accounts/app.ts)):

```ts
const id = await db.insertAccount({ name, offbudget: offBudget ? 1 : 0, closed: 0 });
await db.insertPayee({ name: '', transfer_acct: id });
```

Then, from [`transactions/transfer.ts`](https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/server/transactions/transfer.ts), the whole mechanism is: *if the transaction's payee has a `transfer_acct`, mirror it.*

```ts
const transferTransaction = {
  account: transferredAccount,
  amount: -transaction.amount,
  payee: fromPayee,          // the *source* account's transfer payee
  date: transaction.date,
  transfer_id: transaction.id,
  notes: transaction.notes || null,
  cleared: false,
};
```

Both sides then store each other's id in `transferred_id`. `onUpdate` re-runs the decision: payee gained a `transfer_acct` → add transfer; lost it → remove; both present → sync account/payee/notes/amount. Deleting one side nulls the other's `transfer_id`; if the other side is a split child it is demoted to a normal transaction instead of deleted.

The category rule is explicit:

```ts
// If the transfer is between two on budget or two off budget accounts,
// we should clear the category, because the category is not relevant
if (fromOffBudget === toOffBudget) {
  await db.updateTransaction({ id: transaction.id, category: null });
  if (transaction.transfer_id) {
    await db.updateTransaction({ id: transaction.transfer_id, category: null });
  }
}
```

So an on-budget ↔ on-budget or off-budget ↔ off-budget transfer is **always uncategorised**, which is precisely why it never appears in a spending breakdown. An on-budget ↔ off-budget transfer keeps a category, and per the [transfers doc](https://actualbudget.org/docs/transactions/transfers) "the category lives only on the On Budget side" — money genuinely entering or leaving the budget.

Cleared/reconciled status and dates are deliberately **not** synced between the two sides (each account reconciles against its own statement, and transfers can take days to land).

**Credit cards**: no special type. The [credit cards doc](https://actualbudget.org/docs/budgeting/credit-cards) says Actual "treats credit card accounts like any bank account, but with a negative value", and "the purchases are deducted from the budget when you assign them a category". Paying the card is a checking → card transfer; "when you transfer money from On Budget to On Budget accounts, the On Budget balance stays the same". Budget impact happens at purchase time; the payment is pure balance movement.

## Splits

A split is one parent row plus N child rows in the same table ([`shared/transactions.ts`](https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/shared/transactions.ts)):

- parent: `isParent = 1`, carries the **total** `amount`, category forced to NULL in the view.
- child: `isChild = 1`, `parent_id = <parent id>`, inherits account/date/cleared/reconciled from the parent, carries its own `category` (and may carry its own payee).
- Validation is a plain sum, stored on the parent as an `error` blob rather than rejected:

```ts
export function recalculateSplit(trans) {
  const total = (trans.subtransactions || []).reduce((acc, t) => acc + num(t.amount), 0);
  return { ...rest, error: total === num(trans.amount) ? null
                                                       : SplitTransactionError(total, trans) };
}
// SplitTransactionError => { type: 'SplitTransactionError', version: 1, difference }
```

An unbalanced split is allowed to exist and is surfaced in the UI with the `difference`. A parent can't itself be a transfer — `addTransfer` bails on `is_parent`, and transfers are created from the *children* so the other account receives the right amounts.

## Categories / groups & defaults

A new budget is created by copying a bundled SQLite file (`packages/loot-core/default-db.sqlite`) — there is no seed script. Reading that file, the exact seeded content is:

| Group | `is_income` | Categories |
| --- | --- | --- |
| Usual Expenses | 0 | Food, General, Bills, Bills (Flexible) |
| Investments and Savings | 0 | Savings |
| Income | 1 | Income, Starting Balances |

That is **7 categories in 3 groups** — deliberately minimal. `Starting Balances` is the income category the synthetic opening-balance transaction is booked to. No colours, no icons, no emoji.

Deleting a category asks for a destination and rewrites `category_mapping`, so old transactions silently follow the merge target. The income group is singular and undeletable.

## Import, matching & rules

[`accounts/sync.ts → matchTransactions`](https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/server/accounts/sync.ts) runs three passes of decreasing fidelity, with a shared `hasMatched` set so a row is never claimed twice:

1. **`imported_id` exact match** within the same account. Highest fidelity, always tried first.
2. **Fuzzy candidate set**: `date BETWEEN d-7 AND d+7 AND amount = ? AND account = ?`, sorted by absolute date distance. Under `strictIdChecking` the SQL adds `(imported_id IS NULL OR ? IS NULL)` — i.e. if *both* the incoming row and the candidate already have import ids and they didn't match in step 1, they are genuinely different transactions.
3. Within that candidate set: first pass requires the **payee id to match**, final pass takes the first unclaimed candidate.

On a match, fields are merged conservatively — `existing.payee || trans.payee`, `existing.category || trans.category` — so manual edits win over imported values. Rules run **before** matching, so a rule can set the payee that the fuzzy matcher then keys on.

**Rules** ([docs](https://actualbudget.org/docs/budgeting/rules/), [`types/models/rule.ts`](https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/types/models/rule.ts)):

- `stage: 'pre' | null | 'post'`, `conditionsOp: 'and' | 'or'`.
- Condition fields: `account, amount, category, category_group, date, notes, payee, payee_name, imported_payee, saved, transfer, parent, cleared, reconciled`.
- Operators per field: `is, isNot, oneOf, notOneOf, contains, doesNotContain, matches` (regex), `gt/gte/lt/lte, isbetween, isapprox`, plus `onBudget`/`offBudget` for accounts. String matching is case-insensitive.
- Actions: `set` (field/value), `set-split-amount`, `link-schedule`, `prepend-notes`, `append-notes`, `delete-transaction`.
- Rules are sorted by specificity within a stage; later matches win on conflict.

**Learned categories** ([`transaction-rules.ts`](https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/server/transactions/transaction-rules.ts)): after you categorise something, `updateCategoryRules` looks back 180 days (and 180 forward), takes the **latest 5 transactions for that payee**, scores categories, and only writes a rule if the winner's `score >= 3`. It excludes closed accounts, split parents, and payees with `learn_categories = 0`, and it **updates the existing payee→category rule** rather than piling up new ones.

**Uncategorised** is not a category — it's `category IS NULL`. The UI surfaces a count in the titlebar linking to a virtual account view:

```tsx
const count = useSheetValue(bindings.uncategorizedCount());
<Link to="/categories/uncategorized">{count} uncategorized transactions</Link>
```

Reports carry a `show_uncategorized` flag and split the bucket into `off_budget | transfer | other | all`.

## Payees

- **Transfer payees** are payees with `transfer_acct` set. They can't be deleted, can't be merged, and can't be a merge target. `getPayees` sorts them first and `COALESCE(a.name, p.name)` renders the account name.
- **Merging** repoints `payee_mapping` rows and tombstones the losers; transactions are untouched.
- **`favorite`** pins a payee to the top of the picker.
- **`learn_categories`** is a per-payee opt-out of the auto-rule learning above.
- Imported payee strings are kept separately in `imported_description`, so a rename rule never loses the bank's original text.

## Multi-currency status

**Not supported.** The [multi-currency doc](https://actualbudget.org/docs/budgeting/multi-currency/) states plainly: "The Actual Budget software is currency agnostic and does not support multi-currency." What exists is a single budget-wide display preference (`defaultCurrencyCode`, `currencySymbolPosition`, `currencySpaceBetweenAmountAndSymbol`) plus a currency table in [`shared/currencies.ts`](https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/shared/currencies.ts) used only for formatting. There is no `currency` column on `accounts` or `transactions` and no migration adds one.

The official workaround is a pair of **rule templates** per foreign account that multiply the amount by a hard-coded FX rate and stash the original amount in the notes — explicitly flagged as relying on experimental features.

Long-running threads:

- [#2147 Multi-currency support](https://github.com/actualbudget/actual/issues/2147) (Dec 2023) — the shape everyone agrees on: a budget-wide default currency, a per-account currency, and prompting for either an exchange rate or the destination amount on a cross-currency transfer. Emphasis on it being invisible to single-currency users.
- [#3351 \[Feature\] Multi-currency support](https://github.com/actualbudget/actual/issues/3351) (Sep 2024) — frames the two hard problems: cross-currency transfers don't balance (−11 USD vs +10 EUR), and budgeting in a foreign currency is ambiguous about *which* rate applies. Two proposed rate models: **daily rates** (manual or fetched) vs **FIFO** (derive the rate from the actual transfer that funded the account, then apply it to later spending).
- [#3658 \[WIP\]\[POC\] Multi-currency](https://github.com/actualbudget/actual/pull/3658) — a `MonetaryUnit` value object with `convertTo(currency, exchangeRate)`. The precision discussion landed on **4 decimal places** (two real currencies need it), implemented over `BigInt`; the tradeoff noted is that 4 decimals caps the representable value around ~$225 billion vs the current ~$22 trillion at 2 decimals. Closed for a rewrite, not rejected.
- [#1132 Budget Currency and Category Currencies](https://github.com/actualbudget/actual/issues/1132), [roadmap discussion](https://github.com/actualbudget/releases/discussions/112).

Takeaway for us: nobody has shipped it in 3 years because converting *for the budget* is the hard part. Our plan — **show net worth and totals per currency, never convert** — sidesteps the entire blocker.

## Lessons for our app

**Copy:**

1. **`amount integer` in minor units, signed.** Use `bigint`/`numeric(…,0)` in Postgres, never `float`. Store the currency's `decimal_places` alongside the currency so JPY (0) and TND (3) work.
2. **`transfer_id` self-FK + a transfer payee per account.** Build the credit-card settlement on this. The rule "if both accounts have the same on/off-budget status, force `category_id = NULL`" gives us "payment doesn't count as spending" without a special transaction type. Enforce it in the write path, and make the spending-breakdown query `WHERE category_id IS NOT NULL AND transfer_id IS NULL`.
3. **`offbudget` / `closed` as booleans on `accounts`, not account types.** A credit card is a normal on-budget account with a negative balance. Keep our checking/savings/credit_card enum for the *icon and UI copy only*, never for budget logic.
4. **`sort_order` as a float seeded at multiples of 16384.** Drag-and-drop reordering becomes one UPDATE.
5. **Mapping tables for category/payee merges.** Even with Postgres FKs, add `merged_into_id` so deleting a category re-points history instead of nulling it. Actual's "where should the transactions go?" dialog is the right UX.
6. **Uncategorised = `category_id IS NULL`, not a magic "Uncategorized" row.** Then a global badge (`count(*) where category_id is null and transfer_id is null`) linking to a filtered list. This is exactly the "uncategorized alert" you want, and it composes with optional categories.
7. **Import matching in three passes** — exact `imported_id` → same-account/±7 days/exact-amount + same payee → same window, any unclaimed. Add a unique index on `(account_id, imported_id)` and keep the raw bank string in `imported_payee` forever.
8. **Rules as `{conditions: jsonb, actions: jsonb, conditions_op, stage}`.** Start with the `set` action and `is/contains/matches/oneOf` operators only; the schema then doesn't change when you add the rest.
9. **Learned payee→category with a confidence floor** (last 5 transactions, need 3 agreeing) and a per-payee `learn_categories` opt-out. Update the existing rule, don't append.
10. **Split model**: parent holds the total and no category; children hold categories; validate by summing and store the `difference` rather than blocking the save.

**Avoid / diverge:**

- **Don't copy `date INTEGER` as `YYYYMMDD`**, or the `description`-means-payee legacy naming. Use `date` and `payee_id`. Actual is stuck with these for CRDT-compat reasons we don't have.
- **Don't copy the no-colour/no-icon category model** — that's a deliberate Actual minimalism, and your requirement is the opposite. Put `color` on `category_groups` (and optionally `icon` on `categories`) with a constrained token set rather than free hex, so the palette stays coherent.
- **Don't seed only 7 categories.** Actual's default set is almost empty because it expects YNAB migrants. Since you're seeding on signup with Clerk, ship a richer default tree (Income / Housing / Transportation / Food / Health / Entertainment / Savings) and mark them as user-editable from row one — same shape, more rows.
- **Don't cache balances on `accounts`.** Actual's `balance_current` is bank-sync metadata only; real balance is always `SUM(amount)`. With a `(account_id, date)` index this is fine, and it removes a whole class of drift bugs.
- **Don't build a single global `to_budget` number across currencies.** Follow the multi-currency threads' conclusion: scope every aggregate (net worth, budget, spending) by `currency_code` and render one card per currency. Add `currency_code` to `accounts` (not to transactions — a transaction inherits its account's currency), and reject transfers between accounts of different currencies until you have a stored rate; when you do, record `exchange_rate` and the destination `amount` on the mirrored row rather than converting on read.
- **Don't add a `pending` column you don't use** (Actual has one, marked unused). Do add `cleared` — defaulting to `1` for manual entry, `0` for imported — because reconciliation needs it later.

## Sources

- Schema: <https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/server/sql/init.sql>
- Migrations: <https://github.com/actualbudget/actual/tree/master/packages/loot-core/migrations>
- DB types: <https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/server/db/types/index.ts>
- Transfers: <https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/server/transactions/transfer.ts>
- Account creation / close: <https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/server/accounts/app.ts>
- Merge / mapping tables: <https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/server/db/index.ts>
- Splits: <https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/shared/transactions.ts>
- Import matching: <https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/server/accounts/sync.ts>
- Rules engine + learned categories: <https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/server/transactions/transaction-rules.ts>, <https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/types/models/rule.ts>
- Default budget file (seed data): <https://github.com/actualbudget/actual/blob/master/packages/loot-core/default-db.sqlite>
- Currencies (display only): <https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/shared/currencies.ts>
- Docs — accounts: <https://actualbudget.org/docs/accounts/>
- Docs — transfers: <https://actualbudget.org/docs/transactions/transfers>
- Docs — categories: <https://actualbudget.org/docs/budgeting/categories>
- Docs — credit cards: <https://actualbudget.org/docs/budgeting/credit-cards>
- Docs — rules: <https://actualbudget.org/docs/budgeting/rules/>
- Docs — multi-currency: <https://actualbudget.org/docs/budgeting/multi-currency/>
- Multi-currency issues: <https://github.com/actualbudget/actual/issues/2147>, <https://github.com/actualbudget/actual/issues/3351>, <https://github.com/actualbudget/actual/issues/1132>, <https://github.com/actualbudget/actual/pull/3658>, <https://github.com/actualbudget/releases/discussions/112>
