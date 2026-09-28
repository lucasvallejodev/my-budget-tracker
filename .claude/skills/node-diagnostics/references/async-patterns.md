# Async patterns

> Summary: when to await in sequence and when in parallel in CoinKeeper's API, given one pg pool of 10 connections and single-connection transactions; bounding concurrency, partial failure, cancellation with request.signal, and background work.

## Sequential or parallel

| Situation                                                        | Do                                                                                                                                                                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| independent reads, outside a transaction                         | `Promise.all([...])`, as the dashboard handler in `routes/reports.ts` does. Each query takes its own pool connection.                                                                 |
| reads or writes inside `db.transaction(async tx => …)`           | `await` one after another. A transaction is one connection; `pg` queues queries on it, so `Promise.all` gains nothing and makes error handling and lock order harder to reason about. |
| the second call needs the first result                           | sequential, obviously; do not hide it in `.then` chains.                                                                                                                              |
| the same query once per item (per row, per currency, per id)     | neither: batch it into one query (`inArray`, `unnest`, a grouped `SELECT`). This is the N+1 pattern; the SQL belongs to database-change.                                              |
| many independent external calls (a future FX provider over HTTP) | bounded concurrency (below).                                                                                                                                                          |

Pool arithmetic: `max` is 10 (`MAX_CONNECTIONS` in `apps/api/src/db/index.ts`). A handler that fans out 7 queries lets only one such request run without waiting; two concurrent dashboards already queue. Before adding more parallelism to a request, count its queries and consider one grouped query instead.

## Bounding concurrency

No `p-limit` style dependency is installed. When a loop must run async work with a limit:

- Process the items in chunks of a named size (`FX_LOOKUP_CONCURRENCY`) with `Promise.all` per chunk, or a small worker-pool helper.
- A helper used in two places goes to `packages/shared/src/lib/` (or `apps/api/src/` if server-only) as an arrow function with a declared return type, TSDoc if it is in a `lib/` folder, and a colocated test. `chunk` in `packages/shared/src/lib/arrays.ts` already splits a list into slices of a named size.

## Partial failure

- `Promise.all` rejects on the first failure and the other promises keep running; their results are discarded. That is right when the response is useless without every part.
- `Promise.allSettled` when some parts are optional. Decide per part what the response shows when it fails, keep the contract (a nullable field in the shared Zod schema), and log the failure once at `warn`.
- Never swallow: a `catch` either translates to `ServiceError`, adds `{ cause }`, or logs and rethrows at a boundary.

## Cancellation

- Fastify 5.12 gives every request `request.signal`, an `AbortSignal` that aborts when the client disconnects or when `handlerTimeout` expires. `app.ts` sets `handlerTimeout` from `HANDLER_TIMEOUT_MS` (default 20 s); on expiry the client gets `503 UNAVAILABLE`. The signal is created lazily, so reading it costs nothing until used.
- Pass it to anything that accepts a `signal` (`fetch`, `stream/promises` `pipeline`, timers from `node:timers/promises`). `pg` queries do not accept a signal; what stops a runaway query is the pool's `statement_timeout`, one second shorter than the handler timeout (database-change › `connection-settings.md`). A transaction still keeps working until that point after the client leaves, which is another reason to keep transactions short.
- Check `request.signal.aborted` between expensive steps of a long operation (import commit) and stop early by throwing; nothing is committed if the transaction has not finished.

## Background work

- Timers that run outside requests (the session purge in `server.ts`) catch their own errors (`.catch(error => app.log.error(error))`) and are cleared on shutdown.
- Do not start background work from a request handler with a floating promise; `@typescript-eslint/no-floating-promises` (part of `recommendedTypeChecked` in `eslint.config.mjs`) rejects it. If work must continue after the response, it needs a queue or a table and its own process, which is an architecture decision.
- With several API replicas, every replica runs every timer; see fastify-api `references/production.md` › Process-wide state and background work.
