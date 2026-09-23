# Review inbox

> Summary: where uncategorised and imported transactions wait, and how to clear them.

## What lands here

A transaction is flagged `needs_review` when it is:

- saved without a category;
- imported from a bank file (always, until you confirm it);
- left behind when its category was archived without a replacement;
- migrated from the legacy schema, whose categories no longer exist.

The dashboard shows a notice with the count and a link; the sidebar has a **Review** entry.

<!-- screenshot: dashboard notice "3 transactions need a category" above the metric cards (docs/assets/screenshots/review-dashboard-notice.png) -->

## Step by step

1. Open **Review** in the sidebar.
2. Each row shows the description, account, date, bank description (for imports), memo and amount.
3. Click the category button to pick a category. The picker is filtered to expense or income categories depending on the sign. Choosing one saves immediately and clears the flag.
4. If the current category is right (for example a rule already applied one), click **Done** to clear the flag without changing anything.
5. When the list is empty you see "All caught up".

<!-- screenshot: review inbox with two imported rows, one with a suggested category and the Done button (docs/assets/screenshots/review-inbox.png) -->

## Tips

- Set a **usual category** on frequent payees, or add a [rule](rules.md), so future entries arrive pre-categorised and only need a quick **Done**.
- After an import, use **Apply to uncategorized** on the rules page to clear whole batches at once.

## How it works

- The page (`src/components/finance/review-inbox/`) lists `/api/transactions?needsReview=1` and calls `categorizeTransactionAction`, which sets the category and `needs_review = false` through `ledger.updateStandard`.
- The count in the dashboard comes from `ledger.needsReviewCount` inside the summary endpoint.
