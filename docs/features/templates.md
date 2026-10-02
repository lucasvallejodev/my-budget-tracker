# Transaction templates

> Summary: saving the transactions you record often as templates, recording one in two taps from the chips at the top of the transaction form, templates that ask for the amount each time, transfer templates, managing and restoring templates, and how they work.

A template is a saved transaction without a date: a name, a type (expense, income or transfer) and any of account, destination account, amount, payee, category and memo. Picking it fills the transaction form with those values and today's date. Nothing is recorded until you click **Create**, so you can change any field first.

A template never touches balances, reports or budgets. Only the transaction you record from it does.

## Step by step

### Record a transaction from a template

1. Open **New transaction** (header button, or the round add button on a phone).
2. Click a template chip in the row at the top of the dialog. On a phone the row scrolls sideways. The most recently used templates come first.
3. The form switches to the template's type and fills its fields. When the template has no amount, the cursor waits in the **Amount** field.
4. Change anything that differs and click **Create** (or **Record transfer**).

<!-- screenshot: New transaction dialog with three template chips above the Type field, one of them showing "…" for an amount asked each time (docs/assets/screenshots/templates-chips.png) -->

### Save a template

- From the form: fill the transaction form, click **Save as template**, type a name and click **Save template**. The open form is not recorded; you can still click **Create** afterwards.
- From the list: open a row's **⋯** menu on the Transactions page and choose **Save as template**. The name starts as the payee name.
- From Settings: open **Settings › Templates › Manage templates** (`/settings/templates`) and click **New template**.

### Templates that ask each time

Leave the amount empty to make a template such as "Groceries …": the chip shows `…` and the form opens with the cursor in **Amount**. A template can also leave the account empty, but an amount needs an account, because the amount is in that account's currency.

### Transfer templates

Choose **Transfer** in the template form (or save from a transfer). A transfer template keeps the source account, the destination account and a positive amount, for example "Move 200 to Savings". It has no payee or category, and the two accounts must differ.

### Manage templates

On **Settings › Templates**, each row shows the type, the account and the amount (or "amount asked each time"):

- **Move up** and **Move down** set the order of templates you have not used yet;
- **Edit** opens the template form;
- **Delete** removes the template, with **Undo** in the toast. Deleted templates are listed under **Settings › Deleted items › Templates** and can be restored.

You can keep up to 50 templates, and two live templates cannot share a name.

<!-- screenshot: Settings › Templates with four templates, one flagged "Account archived" (docs/assets/screenshots/templates-settings.png) -->

## When a template points at something archived

A chip is greyed out when its account, destination account or category has been archived, and the dialog shows a **Fix templates in Settings** link. The settings list shows the reason as a badge. Edit the template to pick another account or category. An archived payee is dropped from the form instead: the rest of the template still works.

## How it works

- Table `transaction_templates` (migration `0003_transaction_templates.sql`): `name`, `kind` (`standard` or `transfer`), `account_id?`, `transfer_account_id?`, `category_id?`, `payee_id?`, `amount_minor?` (signed for standard templates, positive for transfers, `null` when the form asks each time), `memo`, `sort_order`, `last_used_at?` and `deleted_at`. There is no currency column: the currency is the account's. CHECK constraints keep categories off transfers, destination accounts off standard templates and amounts off templates without an account; a partial unique index keeps live names unique per user.
- The template's direction is the sign of its amount, else the kind of its category's group, else expense.
- Service `apps/api/src/modules/templates/service.ts` (`list`, `create`, `update`, `remove`, `restore`, `reorder`) validates ownership of every referenced account, category and payee, and answers `404` for another user's ids. Endpoints: [REST API › Transaction templates](../reference/rest-api.md#transaction-templates).
- `POST /transactions` and `POST /transfers` accept an optional `templateId`; the ledger sets that template's `last_used_at` in the same database transaction. A template of another user is ignored.
- Web: chips in `components/finance/transaction-dialog/template-chips.tsx` (order and preset in `template-preset.ts`), `SaveTemplateDialog` in `components/finance/save-template-dialog/`, the settings screen `TemplatesSettings` in `components/finance/templates-settings/`, read through `useTemplates()`.
