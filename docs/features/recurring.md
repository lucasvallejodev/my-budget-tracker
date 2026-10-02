# Upcoming and recurring payments

> Summary: recurring payments (bills, subscriptions, income) and the Upcoming page with its four sections: adding a series by hand or from payments found in your history, how payments are matched to what is due, the paid, due soon, overdue and upcoming states, recording or linking a payment, payments added to Review when due, the subscription review with monthly and yearly costs and price changes, pausing and deleting, and how it works.

A recurring payment, or series, is something that happens on a rhythm: rent on the 1st, a streaming subscription every month, a salary, a yearly insurance premium. CoinKeeper uses series to show what is coming and what is still to pay. A series never changes a balance by itself: only real transactions do.

## Step by step

### Open Upcoming

Choose **Upcoming** under **Plan** in the sidebar (or open **More** on a phone). Like Analytics, the page is split into sections with tabs at the top; each section starts with a short explanation of what it shows and what you can do there. **New recurring payment** is available in every section.

| Section               | Address                   | What it shows                                                                                                                                                                                                            |
| --------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| What is due           | `/upcoming`               | Every occurrence from the last five weeks to 30 days ahead, grouped under **Overdue**, **Due soon**, **Upcoming** and **Paid**, and the total **Still to pay** per currency. The tab counts what is overdue or due soon. |
| Recurring payments    | `/upcoming/recurring`     | Your series grouped under **Income**, **Bills**, **Subscriptions** and **Other**, with their rhythm, amount and next due date.                                                                                           |
| Subscription review   | `/upcoming/subscriptions` | What each charge costs a month and a year, and price changes (see [Review your subscriptions](#review-your-subscriptions)).                                                                                              |
| Found in your history | `/upcoming/suggestions`   | Payments that repeat at a regular rhythm but are not a series yet. The tab counts the suggestions.                                                                                                                       |

Every group has a heading with its count and a one-line hint (for example, Overdue: "The due date has passed and no matching payment was found"), and every item is separated from the next by a line.

<!-- screenshot: Upcoming › What is due with the section tabs, the explanation, an overdue water bill, items due soon and the Still to pay total (docs/assets/screenshots/upcoming.png) -->

### Add a recurring payment

1. Click **New recurring payment**.
2. Give it a **name**, pick the **account** it is paid from (or into), the **type** (bill, subscription, income or other) and the usual **amount**. Income amounts are money in; every other type is money out.
3. Choose how often it **repeats** (weekly, every 2 weeks, monthly, every 2, 3 or 6 months, or yearly) and a **first due date**. Later dates follow the rhythm; a monthly series due on the 31st falls on the last day of shorter months.
4. Optionally pick the **payee** and **category**, and an **end date**.
5. Turn on **Add it to Review when it is due** if you want a pending transaction created for you on the due date (see below).
6. Click **Add**.

### Add one from your history

**Found in your history** lists payees you paid at least three times at a regular rhythm in the last 400 days (at least three gaps in four close to the usual one), whose last payment is recent. The amount may vary by up to 75 % for monthly or longer rhythms, such as an energy bill, but a weekly payment must be steady (within 20 %), so habits like a weekly coffee are not mistaken for bills. A suggestion disappears once a series exists for that payee.

- **Add** creates the series straight away, starting at the next due date, marked as detected.
- **Review** opens the form with the suggestion filled in, so you can change it first.

### Record or link a payment

Payments are matched automatically (see [How payments are matched](#how-payments-are-matched)). When one was missed:

- **Record** (you paid it but have not entered it yet) opens **New transaction** with the account, amount, payee, category and due date of the occurrence. Saving it marks the occurrence paid.
- **Link** (you entered it but it was not matched, for example because the amount changed) lists transactions within 10 days of the due date in the same currency that are not linked yet; pick one to mark the occurrence paid with it.
- **Not paid** on a paid occurrence removes the link. The transaction itself is not changed.

### Payments added to Review when due

A series with **Add it to Review when it is due** creates its due payment as a **pending** transaction that needs review, dated on the due day, the first time you open Upcoming on or after that day. It then waits on the [Review](review-inbox.md) page for you to confirm, edit or delete. Each occurrence is created once, however often the page loads; occurrences more than five weeks old, or due before the series existed (minus its match window), are never created.

### Review your subscriptions

**Subscription review** (`/upcoming/subscriptions`) lists every series that takes money out, most expensive first, with what it costs a month and a year (a weekly or yearly payment is spread over the months) and when it was last paid. The line at the top adds up the active ones per currency. When the last two payments differ, a badge says **Up 8 %** or **Down 5 %**, which is how price rises show up. **Pause** keeps the series without counting its future payments; cancel the subscription with the provider yourself.

### Pause, edit or delete

- **Edit** opens the form. Turn on **Paused** to keep the series without counting its future payments; a paused series has no next due date and nothing on the Upcoming list.
- **Delete** removes the series, with **Undo** in the toast. Deleted series are kept under **Settings › Deleted items › Recurring** and can be restored. Transactions that were linked keep their link.

## How payments are matched

When you save a transaction or import a bank file, each new income or expense is compared with your active series:

- same currency, and the same payee (or, when the series has no payee, the same account);
- an amount within 7.5 % of the usual amount;
- a date within the series' match window (3 days by default) of a due date that is not paid yet.

The nearest open due date wins, and each occurrence takes at most one payment. When you add or edit a series, the last 400 days are matched the same way, so earlier payments count as paid.

## States

| State    | Meaning                                                            |
| -------- | ------------------------------------------------------------------ |
| Paid     | a transaction is linked to that due date                           |
| Overdue  | not paid and more than the match window past the due date          |
| Due soon | not paid, due today, in the next 3 days or within the match window |
| Upcoming | not paid and further ahead                                         |

## How it works

- Table `recurring_series` (migration `0005_recurring_series.sql`): `name`, `kind`, `account_id`, `payee_id?`, `category_id?`, `currency` (the account's), signed `amount_minor`, optional `amount_min_minor` and `amount_max_minor` (the match range; 7.5 % either side when empty), `cadence` (`weekly`, `monthly`, `yearly`) with `interval`, `anchor_date`, `end_date?`, `match_window_days`, `record_mode` (`match_only` or `create_pending`), `source` (`manual` or `detected`), `status` (`active`, `paused`, `ended`) and `deleted_at`.
- A paid occurrence is a transaction with `recurring_series_id` and `recurring_due_on`. A partial unique index on the pair (live rows only) guarantees one payment per due date, even when two requests race.
- Occurrence dates, monthly equivalents, the match range and cadence detection are pure helpers in `packages/shared/src/lib/recurrence.ts` (`occurrencesBetween`, `nextOccurrence`, `monthlyEquivalent`, `amountRange`, `cadenceFromGap`).
- Service `apps/api/src/modules/recurring/`: `service.ts` (create, update, delete, restore, list with payment statistics), `occurrences.ts` (upcoming list, record due, link and unlink), `matching.ts` (`matchTransactionsToSeries`, called by `ledger.createStandard`, the import commit and series writes), `detection.ts` (suggestions). Endpoints: [REST API › Recurring payments](../reference/rest-api.md#recurring-payments). Requests carry the user's `today` so dates follow the browser's day.
- Web: `Upcoming` in `apps/web/src/components/finance/upcoming/` with a `view` (`due`, `recurring`, `subscriptions`, `suggestions`) rendered by `/upcoming`, `/upcoming/recurring`, `/upcoming/subscriptions` and `/upcoming/suggestions`; the section names, explanations and steps are in `upcoming-sections.ts`, the tabs are the `ui` `SectionTabs` and the explanation is `SectionIntro`. It reads `useUpcoming`, `useRecurringSeries` and `useRecurringSuggestions`; labels and the transaction preset in `finance/recurring-labels.ts`.
