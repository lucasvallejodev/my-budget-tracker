# Rules

> Summary: text rules that assign a category automatically on import and to existing uncategorised entries; deleting and restoring a rule.

## What a rule is

"If the payee name, the bank description or the memo **contains** this text, use this category." Matching is case-insensitive. Rules run in priority order (the order they were created) and the first match wins.

## Step by step

1. Go to **Settings → Rules & Import → Manage rules** (or `/settings/rules`).
2. Under **New rule**, type the text to look for (for example `MERCADONA`) and pick a category.
3. Click **Add rule**. The rule appears in the list with its category.
4. To categorise what is already uncategorised, click **Apply to uncategorized**; a toast reports how many rows were updated and they leave the review inbox.
5. Delete a rule with the bin icon. It stops matching at once and can be restored from **Settings › Deleted items** (see [Deleted items](deleted-items.md)).

<!-- screenshot: rules page with the new-rule form and three rules listed (docs/assets/screenshots/rules-page.png) -->

## Where rules apply

- During [import](import.md): the preview shows the suggested category and the import applies it.
- On demand: **Apply to uncategorized** on the rules page.

Rules do not run when you type a transaction by hand; the payee's usual category covers that case.

## How it works

`apps/api/src/modules/rules/service.ts`: `match(userId, texts)` finds the first live (not deleted) rule whose pattern is contained in the joined texts; `applyToUncategorized` scans every uncategorised standard row and sets the category and clears `needs_review`. Rules reference a live category; archiving that category with "move to" re-points transactions but not rules, so a rule may show "archived category" until you recreate it.
