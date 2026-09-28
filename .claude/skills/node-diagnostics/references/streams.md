# Streams: CSV import and export

> Summary: how CoinKeeper moves CSV data (bounded in-memory import committed in one transaction, client-side export in the browser through the shared toCsvCell), when a stream is justified, and the rules a streaming import or export must keep (per-user filter, soft delete, the shared formula-injection guard, backpressure, one transaction).

## How it works

| Flow   | Path                                                                                                                                                                                                                                                                                                                                    | Size bound                                                                                                                                                                           |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| import | The browser reads the file and posts its text in JSON to `POST /api/v1/imports/preview`, then the classified rows to `POST /api/v1/imports` (`routes/imports.ts`). `modules/import/service.ts` parses it with `parseCsv` from `packages/shared/src/lib/csv.ts` and commits every row in one transaction with chunked inserts.           | `csv` is capped at `FieldLengths.importCsv` (2 000 000 characters) in `packages/shared/src/schema/imports.ts`; the routes allow `IMPORT_BODY_LIMIT` (twice that, for JSON overhead). |
| export | The browser pages through `/transactions` with `apiPages` at `MAX_PAGE_SIZE` (`settings-panels.tsx`) and builds the file with `transactionsToCsv` in `apps/web/src/components/finance/export-transactions.ts`, which formats amounts with `minorToDecimalString` and every cell with `toCsvCell` from `packages/shared/src/lib/csv.ts`. | every live transaction of the user, in browser memory                                                                                                                                |

Both are deliberate: the files of a personal ledger are small, the same parser runs in the browser (column mapping preview) and the API, and nothing CSV-shaped touches the server's disk.

## When not to stream

A stream does not help while the whole payload has to be validated as one JSON body against a Zod schema, or while the result is needed in full (preview classification, duplicate detection). Do not rewrite the import as a pipeline "for performance" without a profile showing memory or latency trouble at the current cap (see `profiling.md`).

## When a stream is justified

- A **server-side export** (for example a download link, or exports larger than the browser handles comfortably).
- An **upload above the body limit**, as a file rather than JSON text.

### Server-side export shape

- A route in `routes/<resource>.ts` inside the authenticated scope, calling one service function that yields rows for `userIdOf(request)` only, with `deleted_at IS NULL`, page by page with the same cursor logic as `ledger.page` (never one unbounded `SELECT`).
- Turn the pages into CSV lines with an `async function*` and send it with `reply.header('content-type', …)` and `reply.send(Readable.from(generator))`; Fastify handles backpressure for a stream payload. If there is a transform step, compose with `pipeline` from `node:stream/promises`, never chained `.pipe()` (errors do not propagate through `.pipe`).
- Stop reading when the client disconnects: check `request.signal.aborted` between pages.
- Reuse the one CSV cell implementation: `toCsvCell` in `packages/shared/src/lib/csv.ts` quotes every cell, doubles quotes, prefixes `'` to text matching `Patterns.csvFormulaPrefix` (`=`, `+`, `-`, `@`, tab, carriage return) and leaves plain decimals matching `Patterns.decimalNumber` alone so amounts stay numeric. The web export already uses it. Anything else both sides need (the line break, the header row, a byte-order mark) moves into the same module with TSDoc and tests before the API uses it; never write a second escaper in `apps/api`, and keep regular expressions in `Patterns`.
- Response schemas do not apply to a stream: declare the content type and document the endpoint in `docs/reference/rest-api.md` by hand.
- Amounts are written with `minorToDecimalString` and the row's currency; never as floats, never summed across currencies.

### Streaming upload shape

- Needs a multipart parser (`@fastify/multipart` is not installed; adding it is a decision) with a per-route file size limit as a named constant.
- Parse incrementally into rows, validate each row, and write the whole import in one `db.transaction` so a failure leaves nothing half-imported, the way `commit` in `modules/import/service.ts` already does for the JSON import (see the database-change skill, `batching-and-transactions.md` › Atomic CSV import). Streaming must not bring back per-row commits.
- Keep the import key (`transactions_account_import_key`) so re-importing the same file stays idempotent.

## Test

- Unit-test the generator or line builder with small arrays, including quotes, newlines inside cells and formula prefixes.
- Route-test the stream with `inject`: status, content type, the header row, one data row, and that another user's rows never appear.
