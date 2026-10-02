# Import

> Summary: importing a bank CSV, mapping columns, what the preview statuses mean, duplicates, matching, transfer suggestions, and why an import is written all at once and only once.

## Step by step

1. Open **Import** in the sidebar.
2. **Account and file**: pick the account the file belongs to, then drop the CSV on the **CSV file** area or click it to choose the file. The area shows the file name and the number of columns once it is read; drop or choose another file to replace it. The delimiter (comma, semicolon, tab, pipe) is detected and the column names are shown.
3. **Columns**: the wizard guesses which column holds the date, amount, payee, memo and reference id from the header names. Correct anything it got wrong:
   - use one **Amount** column when the file has signed amounts, or **Debit** and **Credit** columns when it splits them;
   - choose the **date format** if detection is ambiguous (`DD/MM/YYYY` versus `MM/DD/YYYY`);
   - tick **Spending is positive in this file** when the bank shows expenses as positive numbers.
4. Click **Preview**.

<!-- screenshot: import step 2 with the column selects filled from a bank file (docs/assets/screenshots/import-columns.png) -->

5. **Preview** lists every row with a status:

   | Status           | Meaning                                                   | What happens on import                               |
   | ---------------- | --------------------------------------------------------- | ---------------------------------------------------- |
   | New              | not seen before                                           | inserted as pending, flagged for review              |
   | Matches existing | same amount as a manual entry within 7 days               | your entry keeps its data and receives the import id |
   | Already imported | its import id already exists in this account              | skipped                                              |
   | Unreadable       | date or amount could not be parsed, or the amount is zero | skipped                                              |

   The Category column shows a suggestion when a [rule](rules.md) or a payee's usual category applies.

<!-- screenshot: import preview table with New, Matches existing and Already imported badges (docs/assets/screenshots/import-preview.png) -->

6. Click **Import N new**. The result panel reports how many rows were inserted and matched, links to the [Review](review-inbox.md) page, and lists **possible transfers**: an imported outgoing row whose opposite appears in another account within four days. Click **Link as transfer** to pair them.

<!-- screenshot: import result panel with a possible transfer and the "Link as transfer" button (docs/assets/screenshots/import-result.png) -->

## Re-importing

Importing the same file again is safe. Every row gets a deterministic import id (the reference column if mapped, otherwise date + amount + occurrence + a hash of the payee), and ids are unique per account, so repeated rows show as _Already imported_. Submitting the same import twice (a double click, two tabs) is also safe: the second commit finds the rows already there and imports nothing.

## Supported formats

- Delimiters: `,` `;` tab `|`, detected from the header line. Quoted fields and escaped quotes are handled; blank lines are ignored; a UTF-8 BOM is stripped.
- Dates: `YYYY-MM-DD`, `DD/MM/YYYY`, `MM/DD/YYYY` and their `.`/`-` variants; a trailing time is ignored.
- Amounts: anything `parseAmountInput` accepts (`-12,50`, `1.234,56`, `1,234.56`).
- Files up to 2 MB.

## How it works

- After the commit, each new row is matched to your [recurring payments](recurring.md#how-payments-are-matched): a row from the same payee with the usual amount near a due date marks that occurrence paid.

- Parsing: `packages/shared/src/lib/csv.ts` (shared with the import wizard, which reads the headers in the browser) (`parseCsv`, `parseDateCell`).
- Row mapping and classification (pure): `apps/api/src/modules/import/preview.ts` (`resolveColumns`, `parseRow`, `buildImportId`, `findMatch`, `classifyRow`).
- Loading and writing: `apps/api/src/modules/import/service.ts`, behind `POST /api/v1/imports/preview` and `POST /api/v1/imports`. `preview` never writes. `commit` writes in one database transaction while holding a lock on the account row: matched rows get their `import_id` in one statement, missing payees are created in one statement (names match existing payees case-insensitively), and new rows are inserted in chunks of 1,000 with `status = 'pending'`, `needs_review = true`, the import id and the raw payee text in `original_payee`. If any row fails (an impossible date, a category that is not yours), nothing is written. Rows whose import id already exists in the account are skipped with `ON CONFLICT DO NOTHING` on the partial unique index, so a repeated commit inserts nothing and reports `inserted: 0, matched: 0`.
- Category suggestion order: first matching rule, then the payee's usual category.
- `transferSuggestions` looks for uncategorized standard rows with the opposite amount in another account of the same currency within four days, in one query (a `LATERAL` join picks the closest date), over at most `MAX_PAGE_SIZE` outgoing rows; `ledger.linkAsTransfer` pairs them.
