# Accounts

> Summary: creating, editing, archiving accounts; asset versus liability; how balances are computed.

An account is a place money lives: a checking account, a savings account, cash, a credit card, a loan, an investment account. Each account has exactly one currency.

## Account types

| Type | Classification | Sidebar group | Notes |
| --- | --- | --- | --- |
| Checking, Cash | asset | Cash | everyday money |
| Savings, Investment | asset | Savings & investments | investment accounts do not count in spending by default |
| Credit card | liability | Credit cards | balance is negative when you owe; shown as "owed" |
| Loan | liability | Loans | same as credit cards |
| Other | asset | Other | anything else |

## Step by step

### Create an account

1. Open **Accounts** in the sidebar and click **New account** (or "Create new" inside any account picker).
2. Choose the type, a name and the currency. The currency defaults to your primary currency and is locked once the account has transactions.
3. Optionally enter an **opening balance**: the balance today. For a credit card enter what you owe as a negative number (for example `-350`).
4. Add the institution, the last digits of the account number and notes if you like, then click **Create**.

<!-- screenshot: "Create new account" dialog with type, name, currency and opening balance filled (docs/assets/screenshots/accounts-create.png) -->

The opening balance becomes a transaction of kind `opening` dated today; it counts for the balance and net worth but never for spending.

### Edit an account

1. Open the account from the sidebar or the Accounts page and click **Edit**.
2. Change any descriptive field. The currency field is disabled once the account has transactions.

### Archive or restore an account

1. On the account page click **Archive**. Archived accounts leave the sidebar and pickers, keep their history and can be shown on the Accounts page with **Show archived**.
2. Click **Restore** to bring it back.

Accounts with transactions cannot be deleted; archive them instead.

<!-- screenshot: Accounts page grouped by type with balances and an archived account visible (docs/assets/screenshots/accounts-list.png) -->

### Read an account page

The account page shows the balance (or amount owed), the number of transactions, the details panel and the full ledger for that account with filters and export. Liability accounts also show a **Pay card** button; see [Transfers and credit cards](transfers-and-credit-cards.md).

<!-- screenshot: credit-card account page with "Amount owed" and the Pay card button (docs/assets/screenshots/accounts-card-detail.png) -->

## How it works

- Balances are `SUM(amount_minor)` over the account's live transactions, computed in `accounts.list` as a correlated subquery. Nothing is cached.
- `classification` is derived from the type in `classificationFor()` (`apps/web/src/server/accounts/service.ts`).
- The currency lock and the delete guard are enforced in `accounts.update` and `accounts.remove`.
- The sidebar grouping comes from `AccountGroups` in `apps/web/src/constants/account.ts`; subtotals are computed per currency and liabilities are sign-flipped for display.

Related: [Data model › accounts](../architecture/data-model.md#accounts), [Money and currencies](../architecture/money.md).
