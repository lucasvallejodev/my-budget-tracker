# REST API

> Summary: every endpoint of the Fastify API under `/api/v1`: method, path, parameters, body, response and status codes, grouped by resource, plus the conventions they share.

The live, machine-readable version is the OpenAPI document served by the API at `/api/docs` (Swagger UI) and `/api/docs/json` outside production. Schemas are the Zod contracts in `packages/shared/src/schema/`. How authentication, errors and soft deletes work is explained in [API service](../architecture/api.md).

## Conventions

| Topic               | Rule                                                                                                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base path           | `/api/v1`. Resource names are plural and kebab-case.                                                                                                                               |
| Authentication      | Session cookie from `POST /auth/sign-in` or `/auth/sign-up`. Everything except `/health/live`, `/health/ready` and `/auth/*` answers `401` without it.                             |
| Writes              | `POST`, `PUT`, `PATCH`, `DELETE` with a JSON body (`Content-Type: application/json`) from an allowed origin. Any other body type answers `415`; commands without a body send none. |
| Request ids         | Every response has `X-Request-Id`. Send your own UUID in `X-Request-Id` to have it reused; any other value is replaced.                                                            |
| Ids                 | UUIDs in the path; an id that is malformed answers `400`, one that does not exist or belongs to someone else answers `404`.                                                        |
| Money in            | Decimal strings (`"amount": "12.50"`, `"1.234,56"` also accepted) plus a `direction` where needed; parsed in the currency of the account, budget or rate.                          |
| Money out           | `amountMinor` integers with a `currency` (`"amountMinor": -1250, "currency": "EUR"`).                                                                                              |
| Dates               | `YYYY-MM-DD`; months `YYYY-MM`; timestamps ISO 8601.                                                                                                                               |
| Booleans in queries | `true` / `false` (`1` / `0` also accepted).                                                                                                                                        |
| Collections         | `{ "items": [...] }`; `GET /transactions` adds `"nextCursor"` (pass it back as `cursor`; `null` on the last page).                                                                 |
| Status codes        | `200` read or update, `201` created (with `Location` for accounts), `204` deleted or empty command, errors as in [API service › Errors](../architecture/api.md#errors).            |
| Deletes             | Soft: rows get `deletedAt`, disappear from lists and totals, and come back with `POST …/restore`.                                                                                  |

## Health and authentication

| Method and path           | Body / query                                | Response                                                                                                                                                                                                                                                                            |
| ------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /health/live`        | —                                           | `{ status: "ok" }` without touching the database (no session needed)                                                                                                                                                                                                                |
| `GET /health/ready`       | —                                           | `{ status: "ok", database: "ok" }`; `503 UNAVAILABLE` when the database is unreachable (no session needed)                                                                                                                                                                          |
| `POST /auth/sign-up`      | `{ email, password (12–128 chars), name? }` | `201` `User` + session cookie; `409 EMAIL_TAKEN`                                                                                                                                                                                                                                    |
| `POST /auth/sign-in`      | `{ email, password }`                       | `200` `User` + new session cookie (a session cookie sent with the request is ended); `401 INVALID_CREDENTIALS`; `429` when rate limited per IP, or when too many attempts for one email are already queued (attempts for an email are slowed after repeated failures, never locked) |
| `POST /auth/sign-out`     | —                                           | `204`, session deleted, cookie cleared                                                                                                                                                                                                                                              |
| `GET /me`                 | —                                           | `User` `{ id, email, name, createdAt }`                                                                                                                                                                                                                                             |
| `PATCH /me`               | `{ email?, name? }`                         | `User`; `409 EMAIL_TAKEN`                                                                                                                                                                                                                                                           |
| `PUT /me/password`        | `{ currentPassword, newPassword }`          | `204` + new session cookie; every session, including the old one of this browser, is signed out; `403` wrong current password                                                                                                                                                       |
| `GET /me/sessions`        | —                                           | `{ items: Session[] }` (`current: true` marks this one)                                                                                                                                                                                                                             |
| `DELETE /me/sessions/:id` | —                                           | `204`                                                                                                                                                                                                                                                                               |

## Settings and currencies

| Method and path   | Body / query     | Response                                                     |
| ----------------- | ---------------- | ------------------------------------------------------------ |
| `GET /settings`   | —                | `{ primaryCurrency, locale, showConvertedTotals }`           |
| `PATCH /settings` | any of the above | settings; `422` unknown currency                             |
| `GET /currencies` | —                | `{ items: Currency[] }` (active ones, cacheable for an hour) |

## Accounts

| Method and path                             | Body / query                                                                                                                                                                                                                               | Response                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `GET /accounts`                             | `includeArchived`, `deleted`                                                                                                                                                                                                               | `{ items: AccountSummary[] }` with `balanceMinor` and `transactionCount`           |
| `GET /accounts/:id`                         | —                                                                                                                                                                                                                                          | `AccountSummary` (archived included)                                               |
| `POST /accounts`                            | `{ name, type, currency, openingBalance?, openingDate?, institution?, accountNumber?, notes?, countsInSpending? }`; `openingDate` (`YYYY-MM-DD`) dates the opening balance, default today in UTC (the web app sends the user's local date) | `201` `AccountSummary`                                                             |
| `PATCH /accounts/:id`                       | any field except `openingBalance`                                                                                                                                                                                                          | `AccountSummary`; `409` when changing the currency of an account with transactions |
| `POST /accounts/:id/archive` · `/unarchive` | —                                                                                                                                                                                                                                          | `AccountSummary`                                                                   |
| `DELETE /accounts/:id`                      | —                                                                                                                                                                                                                                          | `204`; `409` while it has transactions (archive it instead)                        |
| `POST /accounts/:id/restore`                | —                                                                                                                                                                                                                                          | `AccountSummary`                                                                   |

## Categories

| Method and path                             | Body / query                                                                                       | Response                                                                          |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `GET /category-groups`                      | `includeArchived`                                                                                  | `{ items: CategoryTree[] }` (groups with their categories and transaction counts) |
| `POST /category-groups`                     | `{ name, kind: income \| expense, color }`                                                         | `201` `CategoryGroup`                                                             |
| `PATCH /category-groups/:id`                | any of the above                                                                                   | `CategoryGroup`; `422` turning Income into expense                                |
| `POST /category-groups/:id/archive`         | —                                                                                                  | `204`; `422` for Income or while it has live categories                           |
| `POST /category-groups/:id/unarchive`       | —                                                                                                  | `CategoryGroup`                                                                   |
| `PUT /category-groups/order`                | `{ ids }`                                                                                          | `204`; `400` repeated id; `404` unknown or foreign id (nothing changes)           |
| `PUT /category-groups/:id/categories/order` | `{ ids }` (listed categories move into this group, in this order)                                  | `204`; `400` repeated id; `404` unknown or foreign id (nothing changes)           |
| `POST /categories`                          | `{ groupId, name, icon }` (`icon` from the curated list)                                           | `201` `Category`                                                                  |
| `PATCH /categories/:id`                     | any of the above (a new `groupId` moves it)                                                        | `Category`                                                                        |
| `POST /categories/:id/archive`              | `{ moveToId? }` — move its transactions and payee defaults, or leave them uncategorised for review | `204`                                                                             |
| `POST /categories/:id/unarchive`            | —                                                                                                  | `Category`; `409` while its group is archived                                     |

## Payees

| Method and path                           | Body / query                                        | Response                            |
| ----------------------------------------- | --------------------------------------------------- | ----------------------------------- |
| `GET /payees`                             | `includeArchived`                                   | `{ items: Payee[] }`                |
| `POST /payees`                            | `{ name, defaultCategoryId? }`                      | `201` `Payee`; `409` duplicate name |
| `PATCH /payees/:id`                       | any of the above (`""` clears the default category) | `Payee`                             |
| `POST /payees/:id/archive` · `/unarchive` | —                                                   | `Payee`                             |

## Transactions

| Method and path                  | Body / query                                                                                                                                                     | Response                                                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `GET /transactions`              | `accountId`, `categoryId`, `month` or `from`/`to`, `needsReview`, `kind`, `q` (memo, payee or category text), `deleted`, `limit` (1–2000, default 100), `cursor` | `{ items: TransactionRow[], nextCursor }`, newest first                                                    |
| `GET /transactions/:id`          | —                                                                                                                                                                | `TransactionRow` (deleted rows included, with `deletedAt`)                                                 |
| `POST /transactions`             | `{ accountId, amount, direction: expense \| income, date, categoryId?, payeeId?, memo?, status?, excluded? }`                                                    | `201` `TransactionRow`                                                                                     |
| `PATCH /transactions/:id`        | any subset of the above, plus `needsReview`; setting `categoryId` clears the review flag, `amount` without `direction` keeps the sign                            | `TransactionRow`; `409` on a transfer leg; `422` when changing amount, date or account of a reconciled row |
| `DELETE /transactions/:id`       | —                                                                                                                                                                | `204`; `409` on a transfer leg                                                                             |
| `POST /transactions/:id/restore` | —                                                                                                                                                                | `TransactionRow`; `409` if its account is deleted or the same bank row was imported again                  |

## Transfers

A transfer is two linked rows (`kind: "transfer"`, same `transferId`). They appear in `GET /transactions` and are changed only here.

| Method and path                       | Body / query                                                                                               | Response                                                    |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `POST /transfers`                     | `{ fromAccountId, toAccountId, amountFrom, amountTo? (required across currencies), date, memo?, status? }` | `201` `Transfer` `{ transferId, legs: [out, in] }`          |
| `GET /transfers/:transferId`          | —                                                                                                          | `Transfer`                                                  |
| `PUT /transfers/:transferId`          | same as create                                                                                             | `Transfer`                                                  |
| `PATCH /transfers/:transferId`        | `{ status?, memo? }` (both legs)                                                                           | `Transfer`                                                  |
| `DELETE /transfers/:transferId`       | —                                                                                                          | `204` (both legs)                                           |
| `POST /transfers/:transferId/restore` | —                                                                                                          | `Transfer`; `409` if an account is deleted                  |
| `POST /transfers/link`                | `{ outTransactionId, inTransactionId }` — turn two opposite rows into a transfer                           | `201` `Transfer`; `422` if the same-currency amounts differ |
| `GET /transfers/suggestions`          | `transactionIds?` (comma-separated)                                                                        | `{ items: TransferSuggestion[] }`                           |

## Import

| Method and path         | Body / query                                                                                                                           | Response                                                                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /imports/preview` | `{ accountId, csv (≤ 2 MB of text), mapping: { date, amount \| debit+credit, payee?, memo?, externalId?, dateFormat?, invertSign? } }` | `ImportPreview` `{ accountId, currency, counts, rows }` (each row `new`, `matched`, `duplicate` or `invalid`, with a suggested category) |
| `POST /imports`         | the preview (rows may be edited)                                                                                                       | `201` `{ inserted, insertedIds, matched, suggestions }`                                                                                  |

## Rules

| Method and path           | Body / query                     | Response                                                       |
| ------------------------- | -------------------------------- | -------------------------------------------------------------- |
| `GET /rules`              | `deleted`                        | `{ items: RuleRow[] }` in priority order                       |
| `POST /rules`             | `{ pattern, categoryId, name? }` | `201` `RuleRow`                                                |
| `PATCH /rules/:id`        | any of the above                 | `RuleRow`                                                      |
| `PUT /rules/order`        | `{ ids }` (first wins)           | `204`; `400` repeated id; `404` unknown, deleted or foreign id |
| `DELETE /rules/:id`       | —                                | `204`                                                          |
| `POST /rules/:id/restore` | —                                | `RuleRow`                                                      |
| `POST /rules/apply`       | —                                | `{ updated }` — categorises uncategorised rows that match      |

## Budgets

| Method and path                             | Body / query                  | Response                                                                                                                                                                                                                                      |
| ------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /budgets`                              | `month` (required), `deleted` | `{ items: BudgetRow[] }` with `spentMinor`                                                                                                                                                                                                    |
| `PUT /budgets/:month/:categoryId/:currency` | `{ amount }`                  | `201` created or `200` updated `BudgetRow` (revives a deleted one)                                                                                                                                                                            |
| `DELETE /budgets/:id`                       | —                             | `204`                                                                                                                                                                                                                                         |
| `POST /budgets/:id/restore`                 | —                             | `BudgetRow`                                                                                                                                                                                                                                   |
| `POST /budgets/copy-previous-month`         | `{ month }`                   | `{ copied }` (skips archived categories and budgets that already exist)                                                                                                                                                                       |
| `GET /budgets/suggestions`                  | `month` (required)            | `{ items: BudgetSuggestion[] }`: `{ categoryId, currency, amountMinor, months }`, the average monthly spending per expense category over the three months before `month` (divided by the months that had spending, rounded up to whole units) |

## Exchange rates

| Method and path                                   | Body / query                             | Response                                              |
| ------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------- |
| `GET /exchange-rates`                             | `base`, `quote`, `from`, `to`, `deleted` | `{ items: ExchangeRate[] }` newest first              |
| `PUT /exchange-rates/:base/:quote/:date`          | `{ rate }` (decimal string, > 0)         | `201` or `200` `ExchangeRate`; `422` unknown currency |
| `DELETE /exchange-rates/:base/:quote/:date`       | —                                        | `204`; `404` if there is no live rate                 |
| `POST /exchange-rates/:base/:quote/:date/restore` | —                                        | `ExchangeRate`                                        |

## Reports

| Method and path               | Body / query                                                                                                                    | Response                                                                                                                                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /reports/summary`        | `month?` (default: the current UTC month; the web app always sends the user's local month), `cashFlowMonths?` (1–24, default 8) | `{ month, totals, breakdown, netWorth, cashFlow, needsReviewCount, accounts, converted }` — everything the dashboard needs                                                                                                    |
| `GET /reports/monthly-totals` | `month`                                                                                                                         | `{ items: CurrencyTotals[] }`                                                                                                                                                                                                 |
| `GET /reports/breakdown`      | `month`, `by: group \| category \| payee \| account`, `currency?` (category view; default primary currency)                     | `{ items: GroupSlice[] \| CategorySlice[] \| RankingSlice[] }`; `RankingSlice` is `{ currency, id, name, spentMinor, transactions }`, per currency, largest first (payee falls back to the bank description, then "No payee") |
| `GET /reports/net-worth`      | —                                                                                                                               | `{ items: NetWorthBucket[] }`                                                                                                                                                                                                 |
| `GET /reports/cash-flow`      | `month`, `months?`                                                                                                              | `{ items: CashPoint[] }`                                                                                                                                                                                                      |

Every report counts only live `standard` rows of live accounts that count in spending and are not excluded; transfers, opening balances and deleted rows never appear.
