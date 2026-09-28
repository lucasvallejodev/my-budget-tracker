# Connection settings

> Summary: the node-postgres pool in `apps/api/src/db/index.ts` (owned by this skill): the statement timeout derived from HANDLER_TIMEOUT_MS, the idle-in-transaction timeout, application name and error listener it already sets, why the migrator runs without a statement timeout, what to keep when changing them, and how to size the pool.

## What the pool has

`poolConfig(connectionString, { statementTimeoutMs })` in `apps/api/src/db/index.ts` builds the `pg` `Pool` options, each value a named constant:

| Option                                | Value                                                                |
| ------------------------------------- | -------------------------------------------------------------------- |
| `application_name`                    | `APPLICATION_NAME` (`coinkeeper-api`), visible in `pg_stat_activity` |
| `connectionTimeoutMillis`             | `CONNECTION_TIMEOUT_MS` (10 s)                                       |
| `idleTimeoutMillis`                   | `IDLE_TIMEOUT_MS` (30 s)                                             |
| `idle_in_transaction_session_timeout` | `IDLE_IN_TRANSACTION_TIMEOUT_MS` (30 s)                              |
| `max`                                 | `MAX_CONNECTIONS` (10)                                               |
| `statement_timeout`                   | the `statementTimeoutMs` option                                      |

`createDatabase(connectionString, options)` opens the pool, wraps it with `drizzle(pool, { schema })`, and registers `pool.on('error')`. `openRuntime` in `apps/api/src/environment.ts` passes `statementTimeoutFor(config.handlerTimeoutMs)`: `HANDLER_TIMEOUT_MS` minus `STATEMENT_TIMEOUT_MARGIN_MS` (1 s), never below `MIN_STATEMENT_TIMEOUT_MS` (0.5 s), so 19 s with the default 20 s handler timeout. `apps/api/src/cli/migrate.ts` calls `openRuntime({ statementTimeoutMs: NO_STATEMENT_TIMEOUT })` instead. The PGlite tests use neither. `apps/api/src/db/index.test.ts` pins all of this.

## What to keep when changing it

- **The statement timeout stays below the handler timeout.** When a query runs past it, PostgreSQL cancels it with SQLSTATE `57014` (`query_canceled`), `isQueryCanceled` in `modules/errors.ts` recognizes it and the error handler answers `503 UNAVAILABLE` without leaking the driver message (error mapping is the `fastify-api` skill's). If the statement timeout were longer than `handlerTimeout`, the client would get its `503` while the query kept holding a connection and its locks. Change the margin or minimum here, never by setting a separate fixed value.
- **Migrations run without a statement timeout.** `NO_STATEMENT_TIMEOUT` (`0`) is what lets a long index build or backfill finish, so a migration does not need `SET LOCAL statement_timeout = 0`. Keep `SET LOCAL lock_timeout` in migrations: it is what stops a blocked `ALTER` from queueing every request (see `migrations.md`). `npm run db:migrate` runs `drizzle-kit migrate` with its own connection from `drizzle.config.ts`, which sets no timeouts.
- **`idle_in_transaction_session_timeout` ends forgotten transactions.** A connection left inside `BEGIN` for 30 s is closed by the server and its locks released. Code that awaits something slow (a network call, a big parse) inside `db.transaction` hits it: parse and fetch before opening the transaction.
- **Pick values from measured query times, not guesses**; the transactions page at `MAX_PAGE_SIZE` and the reports are the slowest paths. A value that operators should tune goes through `apps/api/src/config.ts` and `.env.example` (configuration changes follow the `fastify-api` skill), as `HANDLER_TIMEOUT_MS` does.
- **`lock_timeout` belongs in migrations** (`SET LOCAL`), not in the pool: request queries should wait for row locks held by short transactions.

## Pool sizing

- Total connections = `max` × API processes (+ migrations, `db:studio`, psql sessions). Keep it well under the server's `max_connections` (100 by default in the `postgres:17-alpine` image).
- More connections do not make a single Node process faster; the event loop and argon2 hashing are the usual limits. Raise `max` only when `pg_stat_activity` shows requests waiting for a connection, not idle ones.

## Pool error listener

This skill owns every pool setting, the error listener included; `fastify-api` links here. Without `pool.on('error', …)`, an error on an idle client (the server restarted, a network blip) is emitted on the pool and, unhandled, crashes the process.

How it is wired, and what to keep:

- `createDatabase` registers the listener at once, logging to the console by default, and returns `reportErrorsTo(handler)`. `server.ts` calls it through `reportDatabaseErrorsTo` with a handler that logs through the Fastify logger (`app.log.error({ err: error }, 'Idle database client failed')`).
- Log and continue: the pool has already discarded the broken client. Do not exit the process from the listener.
- Readiness (`GET /api/v1/health/ready`, see `fastify-api`) is what reports a database that stays unreachable.
