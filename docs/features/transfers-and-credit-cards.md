# Transfers and credit cards

> Summary: moving money between your own accounts, paying a credit card or loan, editing, deleting and restoring a transfer, and why none of it counts as spending.

## The idea

Spending happens when you buy something, whichever account pays. Paying the credit card later just moves money from checking to the card: nothing new was spent. So a card payment is a **transfer**, and transfers never appear in spending or income reports.

![Where each entry lands](../assets/diagrams/money-movement-flow.svg)

A transfer is stored as two rows, one per account, with opposite signs and the same `transfer_id`. Each account's ledger stays complete on its own, and a cross-currency transfer simply has two different amounts.

## Step by step

### Move money between two accounts

1. Click **New transaction** and set **Type** to _Transfer between accounts_.
2. Choose the **From** account (money leaves) and the **To** account (money arrives).
3. Enter the **amount sent** in the source currency. If the two accounts use different currencies, also enter the **amount received** in the destination currency.
4. Add a memo and the date, then click **Record transfer**.

<!-- screenshot: transaction dialog in Transfer mode between an EUR and a USD account showing both amount fields (docs/assets/screenshots/transfer-cross-currency.png) -->

### Pay a credit card or loan

1. Open the card's account page. It shows **Amount owed** and a **Pay card** button whenever something is owed.
2. Click **Pay card**. The transfer form opens with the card as destination, your first asset account as source and the owed amount pre-filled.
3. Adjust the source account, amount or date if needed and click **Record transfer**.

<!-- screenshot: Pay card dialog pre-filled from a credit-card account page (docs/assets/screenshots/transfer-pay-card.png) -->

The card's balance goes back towards zero; checking goes down by the same amount; the month's spending is unchanged.

### Edit or delete a transfer

Open either leg's **⋯** menu. **Edit** opens the transfer editor for both legs (accounts, amounts, memo, date). **Delete** removes both legs after confirmation; the toast's **Undo** button, or **Restore** in **Settings › Deleted items**, brings both back together (see [Deleted items](deleted-items.md)). A transfer cannot be restored while either of its accounts is deleted.

### Turn two imported rows into a transfer

After a CSV import, the wizard lists **possible transfers**: an outgoing row in one account and an incoming row of the same amount in another account within four days. Click **Link as transfer** to join them. See [Import](import.md).

## Reading the ledger

Each leg is labelled with the other account: "Transfer to Visa" in checking, "Transfer from Checking" on the card. The category column shows _Transfer_. On liability accounts the balance is shown as an amount owed; the raw ledger balance (negative when you owe) is visible in the details panel.

<!-- screenshot: checking account ledger showing a "Transfer to Visa" row next to normal expenses (docs/assets/screenshots/transfer-ledger-row.png) -->

## How it works

- `ledger.createTransfer` writes both legs in one database transaction; it requires two different accounts of the user, a positive amount, and a destination amount when currencies differ.
- `ledger.updateTransfer` rewrites both legs (`PUT /api/v1/transfers/:transferId`); `ledger.removeTransfer` (`DELETE /api/v1/transfers/:transferId`) sets `deleted_at` on both legs and `ledger.restoreTransfer` (`POST …/restore`) clears it on both, after checking that both accounts are live. Deleting a single leg through `/transactions/:id` is refused with `409`.
- `ledger.linkAsTransfer` converts two existing standard rows (opposite signs, different accounts) into a transfer pair and clears their categories and payees.
- The database enforces `kind = 'transfer'` ⇔ `transfer_id IS NOT NULL` and forbids a category on non-standard rows.
- Every report filters `kind = 'standard'`, so exclusion needs no special casing (`apps/api/src/modules/reports/service.ts`, `spendingWhere`).
- Interest charged by a card is a normal expense on the card account (category Financial › Interest & charges); it is spending.
