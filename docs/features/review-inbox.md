# Review

> Summary: the Review page, where uncategorized and imported transactions wait; suggested categories and accepting them; keyboard use; undoing a review the same day.

## What lands here

A transaction is flagged `needs_review` when it is:

- saved without a category;
- imported from a bank file (always, until you confirm it);
- left behind when its category was archived without a replacement;
- migrated from the legacy schema, whose categories no longer exist.

Home shows a notice with the count and a link; the **Review** entry in the sidebar shows the same count as a badge (read as "2 to review" by screen readers).

<!-- screenshot: Home notice "3 transactions need a category" above the metric cards (docs/assets/screenshots/review-dashboard-notice.png) -->

## Step by step

1. Open **Review** in the sidebar.
2. Each row shows the payee avatar (logo, chosen icon or initials, as in the [transactions list](transactions.md#read-the-list)), the payee or bank text, then the account, the day and **Pending** for unconfirmed imports, the category field, the amount and a button.
3. Click the category field (or press `C` on a focused row) and type part of a category or group name. Only expense or income categories are offered, depending on the sign. Choosing one saves immediately and clears the flag.
4. When CoinKeeper has a suggestion, the category is already filled in with a **Suggested** tag and the button reads **Accept**. Click it to confirm the suggestion.
5. If the current category is right and there is no suggestion, click **Done** to clear the flag without changing anything.
6. **Accept N suggestions** in the page header accepts every suggestion on the page at once.
7. When the list is empty you see "All caught up".

<!-- screenshot: Review page with three rows: one with a "Suggested" category and the Accept button, one uncategorized with Done, the "Accept 1 suggestion" header button and the keyboard hint (docs/assets/screenshots/review-inbox.png) -->

### Use the keyboard

| Key         | What it does                                                       |
| ----------- | ------------------------------------------------------------------ |
| Up and down | move between rows                                                  |
| `C`         | open the category autocomplete of the focused row                  |
| `Enter`     | confirm the focused row (accepts the suggestion, or marks it done) |
| `Esc`       | close the autocomplete without changing the category               |

### Undo a review

Everything you clear appears under **Reviewed today** below the list, with the category it got and a note when a rule or the payee's usual category chose it. **Undo** puts the entry back in the list with the category it had before. The list lives in this browser only and starts empty the next day.

## Where suggestions come from

For each flagged row without a category, the first [rule](rules.md) that matches the payee name, bank description or memo wins; otherwise the payee's [usual category](categories.md#payee-memory). A suggestion is offered only when that category is active and of the right kind (expense for money out, income for money in). Rows without a suggestion show an empty category field.

## Tips

- Set a **usual category** on frequent payees, or add a [rule](rules.md), so future entries arrive with a suggestion and only need **Accept**.
- After an import, use **Apply to uncategorized** on the rules page to clear whole batches at once.

## How it works

- The page (`ReviewInbox` in `apps/web/src/components/finance/review-inbox/`) lists `GET /api/v1/transactions?needsReview=1` and reads suggestions with `useReviewSuggestions` from `GET /api/v1/transactions/review-suggestions` (`rules.reviewSuggestions` in the API; see the [REST API reference](../reference/rest-api.md#transactions)).
- Choosing, accepting or confirming calls `categorizeTransaction` from `apps/web/src/api/mutations.ts`, which sends `PATCH /api/v1/transactions/:id` with the category and `needsReview: false`; the API applies it through `ledger.updateStandard`.
- **Reviewed today** is kept in `localStorage` by `reviewed-today.ts`, keyed by the local date, so it survives a reload but not another browser or the next day. **Undo** calls `reopenReview`, which sends the previous category and `needsReview: true`.
- The count on Home and on the sidebar badge (`useNeedsReviewCount`) comes from `ledger.needsReviewCount` inside the summary endpoint.
