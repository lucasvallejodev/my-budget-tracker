# Categories

> Summary: groups and categories, the default taxonomy, the manager page, archiving with history, icons, colours and payee memory.

## Model

Two levels:

- A **group** has a name, a **kind** (income or expense), a **colour** and an order. The colour is the only colour in the system: every category, chart slice and icon badge uses its group's colour.
- A **category** belongs to one group and has a name, an **icon** from the curated registry and an order.

The **Income** group is a system group: it cannot be archived and always stays an income group. Everything else is yours to rename, recolour, reorder, add to or archive.

## Defaults

On your first sign-in the app seeds 12 groups and 55 categories from `apps/web/src/server/categories/default-taxonomy.ts` (listed in [Default categories](../reference/default-taxonomy.md)). Seeding runs once per user and is versioned; future changes to the defaults never rewrite your data.

## Step by step

### Open the manager

1. Go to **Settings → Categories** and click **Open the category manager**, or navigate to `/settings/categories`.

<!-- screenshot: category manager with several groups expanded, colour dots and the per-group action buttons (docs/assets/screenshots/categories-manager.png) -->

### Add or edit a group

1. Click **New group** (or **Edit** on an existing group).
2. Set the name, the kind and pick a colour from the palette or the custom colour input.
3. Save. Use the arrows on a group to move it up or down; the order is used in pickers and the manager.

### Add or edit a category

1. Click **Category** on the group, or the pencil on a category.
2. Set the name, choose the group and pick an icon from the searchable grid.
3. Save. Use the arrows to reorder categories inside a group.

<!-- screenshot: category dialog with the icon grid filtered by a search term (docs/assets/screenshots/categories-icon-picker.png) -->

### Archive a category (and what happens to its transactions)

1. Click the archive icon on a category.
2. If it has transactions, choose what to do with them:
   - **Move transactions to** another category, or
   - **Keep uncategorized (review later)**: the rows lose their category and reappear in the [review inbox](review-inbox.md).
3. Confirm. Archived categories disappear from pickers; **Show archived** reveals them with a **Restore** button.

Groups can only be archived once they have no live categories.

### Change a transaction's category

Edit the transaction, or use the [review inbox](review-inbox.md) for anything flagged.

## Payee memory

Each payee remembers a **usual category**. It is pre-filled in the transaction form when you pick the payee, and it updates itself: after you save a categorised transaction, the payee's default becomes whichever category at least two of its last three transactions used (the first transaction sets it directly). You can also set it by hand when creating or editing a payee.

## How it works

- Tree, CRUD, reorder, archive and restore live in `apps/web/src/server/categories/service.ts`; seeding in `seed.ts`.
- `archiveCategory(userId, id, moveToId?)` re-points transactions and payee defaults inside one database transaction, or flags them with `needs_review`.
- Icon names are validated by `z.enum(IconNames)` from `packages/shared/src/constants/icon-names.ts`; colours by a hex regex. Both in `packages/shared/src/schema/categories.ts`.
- Payee memory is `payees.learnDefaultCategory`, called after every categorised create or update in the ledger service.
- The picker (`apps/web/src/components/finance/category-picker/`) groups categories, filters by kind when the direction is known, and offers "Leave uncategorized".
