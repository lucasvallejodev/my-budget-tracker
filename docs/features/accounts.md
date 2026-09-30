# Accounts

> Summary: the Accounts page (net worth over time, accounts grouped by type, the assets and liabilities summary, totals per currency), creating, editing, archiving and (through the API) deleting and restoring accounts; asset versus liability; how balances are computed.

An account is a place money lives: a checking account, a savings account, cash, a credit card, a loan, an investment account. Each account has exactly one currency.

## Account types

| Type                | Classification | Accounts page group   | Notes                                                   |
| ------------------- | -------------- | --------------------- | ------------------------------------------------------- |
| Checking, Cash      | asset          | Cash & checking       | everyday money                                          |
| Savings, Investment | asset          | Savings & investments | investment accounts do not count in spending by default |
| Credit card         | liability      | Credit cards          | balance is negative when you owe; shown as "owed"       |
| Loan                | liability      | Loans                 | same as credit cards                                    |
| Other               | asset          | Other                 | anything else                                           |

Each type has its own icon and colour (a bank for checking, a piggy bank for savings, a banknote for cash, a card for credit cards, a hand with coins for loans, a rising line for investments and a wallet for other), shown next to the account on the Accounts page.

## The Accounts page

**Accounts** (`/accounts`) lists every account and shows how your net worth moves. The heading holds the currency switch (the currency is remembered in the browser, like on Home), **Show archived** and **New account**.

| Block               | What it shows                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Net worth over time | net worth in the chosen currency today, a chart of month-end net worth and the change over the range in money and percent; **1M**, **3M**, **6M** and **12M** pick the range (6M by default)                                                          |
| Account groups      | one collapsible group per type group (Cash & checking, Savings & investments, Credit cards, Loans, Other) with the number of accounts, the total per currency and the change this month                                                               |
| Account rows        | the type icon in a rounded square, the name, institution · currency · last four digits, a balance sparkline (hidden on phones) and the balance, with "owed" after credit cards and loans; the whole row opens the account                             |
| Row actions         | **Pay card** on a credit card or loan you owe on: the new-transaction dialog as a transfer from one of your asset accounts for the amount owed; the row menu with **Open account**, **Edit account** and **Archive account** (or **Restore account**) |
| Summary             | assets and liabilities in the chosen currency as stacked bars by account type, with a legend; **Totals** and **Percent** switch the legend between amounts and shares                                                                                 |
| By currency         | net worth per currency with the number of accounts; with converted totals on, the approximate total in your primary currency and the rates used                                                                                                       |

With **Show archived** on, archived accounts appear in their group with an **Archived** badge; they never count in the totals, the change or the summary.

<!-- screenshot: Accounts page in EUR with the net worth chart on 6M, the Cash & checking and Credit cards groups (one card with Pay card), the Summary card and the By currency card (docs/assets/screenshots/accounts-page.png) -->

## Step by step

### Create an account

1. Open **Accounts** in the sidebar and click **New account** (or "Create new" inside any account picker).
2. Choose the type, a name and the currency. The currency defaults to your primary currency and is locked once the account has transactions.
3. Optionally enter an **opening balance**: the balance today. For a credit card enter what you owe as a negative number (for example `-350`).
4. Add the institution, the last digits of the account number and notes if you like, then click **Create**.

<!-- screenshot: "Create new account" dialog with type, name, currency and opening balance filled (docs/assets/screenshots/accounts-create.png) -->

The opening balance becomes a transaction of kind `opening` dated today; it counts for the balance and net worth but never for spending.

### Edit an account

1. Open the account from the Accounts page and click **Edit**, or pick **Edit account** in the row menu.
2. Change any descriptive field. The currency field is disabled once the account has transactions.

### Archive or restore an account

1. On the account page click **Archive**, or pick **Archive account** in the row menu on the Accounts page. Archived accounts leave the account list and pickers, keep their history and can be shown on the Accounts page with **Show archived**.
2. Click **Restore** (or **Restore account** in the row menu, with **Show archived** on) to bring it back.

The app offers archiving only. The API can also delete an account (`DELETE /api/v1/accounts/:id`), but only while it has no live transactions; deleting is soft, and a deleted account can be restored from **Settings › Deleted items** (see [Deleted items](deleted-items.md)). Transactions of a deleted account cannot be restored until the account is.

<!-- screenshot: Accounts page with Show archived on and an archived account with its badge (docs/assets/screenshots/accounts-list.png) -->

### Read an account page

The account page shows the balance (or amount owed), the number of transactions, the details panel and the full ledger for that account with filters and export. **Add transaction** opens the new-transaction dialog with this account selected. Liability accounts also show a **Pay card** button; see [Transfers and credit cards](transfers-and-credit-cards.md).

<!-- screenshot: credit-card account page with "Amount owed" and the Pay card button (docs/assets/screenshots/accounts-card-detail.png) -->

## How it works

- Balances are `SUM(amount_minor)` over the account's live transactions, computed in `accounts.list` as a correlated subquery. Nothing is cached.
- `classification` is derived from the type in `classificationFor()` (`apps/api/src/modules/accounts/service.ts`).
- The currency lock and the delete guard are enforced in `accounts.update` and `accounts.remove`; `remove` sets `deleted_at` and `restore` clears it. Deleted accounts are left out of lists, balances and net worth.
- The grouping on the Accounts page comes from `AccountGroups` in `apps/web/src/constants/account.ts`, and the icon and colour of each type from `accountTypeStyle` in the same file; subtotals are computed per currency and liabilities are sign-flipped for display. The group totals, the month change, the summary sides and the account to pay a card from are pure helpers in `apps/web/src/components/finance/accounts-overview/accounts-figures.ts`.
- Net worth over time, the sparklines and the change this month come from month-end balances per account (`GET /api/v1/reports/balances?months=13`), summed per currency by `netWorthByMonth` in `apps/web/src/components/finance/net-worth.ts`, the same helper Home uses.

Related: [Data model › accounts](../architecture/data-model.md#accounts), [Money and currencies](../architecture/money.md).
