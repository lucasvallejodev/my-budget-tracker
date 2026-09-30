# Categories

> Summary: groups and categories, the default taxonomy, the manager page, archiving with history, icons, colours, the optional emoji, the category autocomplete used to pick a category, payee memory and how a payee looks in lists.

## Model

Two levels:

- A **group** has a name, a **kind** (income or expense), a **colour** and an order. The colour is the only colour in the system: every category, chart slice and icon badge uses its group's colour.
- A **category** belongs to one group and has a name, an **icon** from the curated registry (or an emoji, see [Use emoji](#use-emoji)) and an order.

The **Income** group is a system group: it cannot be archived and always stays an income group. Everything else is yours to rename, recolour, reorder, add to or archive.

## Defaults

When you create your account the app seeds 12 groups and 55 categories from `apps/api/src/modules/categories/default-taxonomy.ts` (listed in [Default categories](../reference/default-taxonomy.md)). Seeding runs once per user and is versioned; future changes to the defaults never rewrite your data.

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
2. Set the name, choose the group and pick an icon from the searchable grid, or type an emoji in the **Emoji** field when emoji are on.
3. Save. Use the arrows to reorder categories inside a group.

<!-- screenshot: category dialog with the icon grid filtered by a search term (docs/assets/screenshots/categories-icon-picker.png) -->

### Use emoji

Emoji are off by default: the curated icons look the same on every system and take the group colour, while an emoji looks different on Windows, macOS and Android.

1. Go to **Settings › Categories**.
2. Turn on **Emoji for categories and payees**. The change is saved at once.
3. The category dialog and the payee dialog now show an **Emoji** field above the icon grid ("Or type an emoji"). It accepts exactly one emoji, flags included; anything else is marked invalid and not used.

Turning the switch off hides the field again; categories and payees that already have an emoji keep it until you pick an icon.

<!-- screenshot: Settings › Categories with the "Emoji for categories and payees" switch turned on (docs/assets/screenshots/settings-emoji-toggle.png) -->

### Archive a category (and what happens to its transactions)

1. Click the archive icon on a category.
2. If it has transactions, choose what to do with them:
   - **Move transactions to** another category, or
   - **Keep uncategorized (review later)**: the rows lose their category and reappear on the [Review](review-inbox.md) page.
3. Confirm. Archived categories disappear from pickers; **Show archived** reveals them with a **Restore** button.

Groups can only be archived once they have no live categories.

### Pick a category

Every place that asks for a category uses the same autocomplete: the transaction dialog, the [Review](review-inbox.md) page, the budget dialog, the payee dialog, the rules page and the **Choose category** chip on uncategorized rows in the [transactions list](transactions.md#read-the-list).

1. Click the category field. A search box opens with the list below it.
2. Type part of a category or group name. Every word you type must appear in the category name or its group name, so `food` lists every category of the Food & Dining group and `food gro` narrows it to Groceries.
3. Pick a category with the mouse, or with the arrow keys and `Enter`. `Esc` closes the list without changing anything.

Before you type, the list shows these sections in order:

| Section       | What it holds                                                  |
| ------------- | -------------------------------------------------------------- |
| Suggested     | the suggested category, when there is one (on the Review page) |
| Recent        | the last five categories you picked in this browser            |
| One per group | every active category of that group, in the manager's order    |
| Last row      | **Leave uncategorized**, which clears the category             |

Only expense or income categories are offered when the direction is known (an expense, an income, a budget). **Create a category** at the bottom opens the category manager.

<!-- screenshot: the category autocomplete open in the transaction dialog with "food" typed, showing Food & Dining categories, and the "Create a category" link (docs/assets/screenshots/category-autocomplete.png) -->

### Change a transaction's category

Edit the transaction, choose a category on an uncategorized row in the transactions list, or use the [Review](review-inbox.md) page for anything flagged.

## Payee memory

Each payee remembers a **usual category**. It is pre-filled in the transaction form when you pick the payee, and it updates itself: after you save a categorised transaction, the payee's default becomes whichever category at least two of its last three transactions used (the first transaction sets it directly). You can also set it by hand when creating or editing a payee.

## Payee look

Every payee shows an avatar in the transactions list, Home's recent activity and the [Review](review-inbox.md) page. The payee dialog (open it with **Create new** in the payee picker) has a **Look in lists** section to choose it:

1. Watch the preview next to the hint: it shows the avatar as the lists will draw it.
2. Pick a **colour** from the palette or the custom colour input.
3. Pick an **icon** from the searchable grid, or type an emoji when [emoji are on](#use-emoji).
4. Click **Use initials** to clear both and go back to the initials.
5. Save.

The avatar is chosen in this order: the brand logo when the name matches one of the bundled brands (a chosen icon never replaces a logo); otherwise the chosen icon or emoji, tinted in the chosen colour; otherwise the initials, on the chosen colour or on a tint picked from the name.

<!-- screenshot: payee dialog with the "Look in lists" section: avatar preview, colour palette, icon grid and the Use initials button (docs/assets/screenshots/payee-look.png) -->

## How it works

- Tree, CRUD, reorder, archive and restore live in `apps/api/src/modules/categories/service.ts`; seeding in `seed.ts`, called by sign-up inside the same database transaction.
- `archiveCategory(userId, id, moveToId?)` re-points transactions and payee defaults inside one database transaction, or flags them with `needs_review`.
- Icons are validated by `iconSchema` (`packages/shared/src/schema/common.ts`): a name from `packages/shared/src/constants/icon-names.ts` or one emoji (`isEmoji` in `packages/shared/src/lib/patterns.ts`); colours by `hexColorSchema`. Categories and payees share both. The API accepts an emoji whatever the `allowEmoji` setting says; the setting only decides whether the web app offers the **Emoji** field.
- Payees store `icon` and `color` (nullable; `null` clears them), and transaction rows return them as `payeeIcon` and `payeeColor`. The avatar is `PayeeAvatar` (`finance/payee-avatar/`); the dialog section is `payee-appearance.tsx` in `finance/create-payee-dialog/`.
- Payee memory is `payees.learnDefaultCategory`, called after every categorised create or update in the ledger service.
- The autocomplete is `CategoryPicker` (`apps/web/src/components/finance/category-picker/`) on top of the `Combobox` in `apps/web/src/components/ui/combobox/`. It drops archived categories, filters by kind when the caller passes one, and keeps the recent list in `localStorage` through `rememberInList` in `apps/web/src/lib/form-memory.ts`, so it is per browser and starts empty in a private window.
