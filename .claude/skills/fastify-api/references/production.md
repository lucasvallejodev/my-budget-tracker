# Production behavior

> Summary: how the API starts and stops, the Fastify 5 timeouts app.ts sets from HANDLER_TIMEOUT_MS, the bounded shutdown in shutdown.ts and its remaining gap (fatal errors), liveness versus readiness, UUID request ids, Pino redaction and audit events, load shedding (not added yet) and process-wide state; each item says what exists, what to keep and what is still missing.

## Contents

- [Lifecycle](#lifecycle)
- [Timeouts](#timeouts)
- [Graceful shutdown](#graceful-shutdown)
- [Liveness and readiness](#liveness-and-readiness)
- [Request ids](#request-ids)
- [Logging and redaction](#logging-and-redaction)
- [Load shedding](#load-shedding)
- [Process-wide state and background work](#process-wide-state-and-background-work)
- [Checklist for a production change](#checklist-for-a-production-change)

## Lifecycle

`apps/api/src/server.ts` is the entry point (`node dist/server.js` in the container, `tsx watch src/server.ts` in development):

1. `openRuntime()` (`environment.ts`) loads `.env`, validates config and creates the `pg` pool (`db/index.ts`: `max` 10, connect timeout 10 s, idle timeout 30 s, a `statement_timeout` derived from `HANDLER_TIMEOUT_MS`, `idle_in_transaction_session_timeout`, `application_name` and a `pool.on('error')` listener; the database-change skill owns these).
2. `buildApp({ config, db })` registers everything; `reportDatabaseErrorsTo` sends idle-client errors to `app.log.error`; `app.listen({ host, port })` starts it.
3. A `setInterval` purges expired sessions every hour (`SESSION_PURGE_INTERVAL_MS`).
4. `SIGINT` / `SIGTERM` (`process.once`) clear the interval, log `Shutting down` and call `shutDown` from `shutdown.ts` (see [Graceful shutdown](#graceful-shutdown)). A start-up failure logs the error and exits with `EXIT_FAILURE`.

Migrations do not run here: `node dist/cli/migrate.js` is a separate one-shot command (the `migrate` Compose service), run with no statement timeout.

Fastify 5 facts that matter here:

- `app.close()` runs `preClose` and `onClose` hooks, stops accepting connections and, with `return503OnClosing` (default `true`), answers requests that arrive meanwhile with `503` and `Connection: close`. `forceCloseConnections` defaults to `'idle'`: idle keep-alive sockets are closed, in-flight requests finish.
- The `logger` option takes options or `false`; a ready-made Pino instance must go in `loggerInstance` (v5 change). `buildApp` accepts `logger` (`false`, or `{ stream }` for tests) and builds the options itself with `loggerOptions` from `plugins/logging.ts`.
- In the container, check what PID 1 is (`ENTRYPOINT` and `CMD` in the `api` stage of `Dockerfile`). Today it is `tini` running `node dist/server.js`, so `SIGTERM` reaches the handler. If an image (an older branch, a new Dockerfile) starts node through `sh -c "… && node dist/server.js"`, `sh` does not forward `SIGTERM` and the handler in `server.ts` never runs there. Fixing the image is the container-hardening skill's job; this skill's job is to make the handler correct once the signal arrives.

## Timeouts

Fastify 5.12 defaults (from `node_modules/fastify/lib/config-validator.js`):

| Option              | Default   | Meaning                                                                                                  |
| ------------------- | --------- | -------------------------------------------------------------------------------------------------------- |
| `connectionTimeout` | `0`       | socket inactivity timeout; none                                                                          |
| `requestTimeout`    | `0`       | time to receive the whole request; none (Node's own `headersTimeout` still applies)                      |
| `handlerTimeout`    | `0`       | application-level limit for the whole route lifecycle; on expiry sends `503` and aborts `request.signal` |
| `keepAliveTimeout`  | `72000`   | idle keep-alive socket lifetime (ms)                                                                     |
| `bodyLimit`         | `1048576` | maximum body size (bytes); per route override exists on the import routes                                |
| `pluginTimeout`     | `10000`   | time for each plugin to load                                                                             |
| `maxParamLength`    | `100`     | longest path parameter                                                                                   |

What `buildApp` passes to `Fastify({ … })` in `app.ts`:

| Option              | Value                                                                        | Defined in          |
| ------------------- | ---------------------------------------------------------------------------- | ------------------- |
| `handlerTimeout`    | `config.handlerTimeoutMs` (`HANDLER_TIMEOUT_MS`, default 20 s, 1 s to 120 s) | `config.ts`         |
| `connectionTimeout` | `handlerTimeoutMs + ServerTimeoutsMs.connectionGrace` (10 s)                 | `constants/http.ts` |
| `requestTimeout`    | `ServerTimeoutsMs.request` (30 s)                                            | `constants/http.ts` |
| `keepAliveTimeout`  | `ServerTimeoutsMs.keepAlive` (72 s)                                          | `constants/http.ts` |

`app.test.ts` › timeouts checks the socket values and that a slow handler gets `503 UNAVAILABLE` with `request.signal` aborted (`FST_ERR_HANDLER_TIMEOUT`). When changing any of them:

- Keep the order: the database `statement_timeout` (`HANDLER_TIMEOUT_MS` minus 1 s, at least 0.5 s) ends before `handlerTimeout`, which ends before `connectionTimeout`. A query that outlives the handler would keep running after the client got its `503`.
- `requestTimeout` protects against slow-body clients; a few tens of seconds is enough for our JSON bodies, CSV import included.
- `handlerTimeout` is cooperative: the `503` goes out, but the handler keeps running unless it listens to `request.signal`. Pass the signal to work that accepts one; a long `db.transaction` is not canceled by it (the statement timeout is what stops the query). A route that legitimately runs longer gets its own `handlerTimeout` option instead of a higher global value.
- `keepAliveTimeout` must stay longer than the idle timeout of whatever keeps connections to the API open (the Next.js rewrite proxy, a reverse proxy), otherwise the client reuses a socket the API just closed and gets `ECONNRESET`. Only lower it together with the proxy.
- Tunable values are environment variables with named defaults in `config.ts`; fixed ones are named constants in `ServerTimeoutsMs`.
- Pool settings and database-side limits (`statement_timeout`, `idle_in_transaction_session_timeout`, the `pool.on('error')` listener) are owned by the database-change skill (`connection-settings.md`); do not change them here.

## Graceful shutdown

`apps/api/src/shutdown.ts` exports `shutDown({ closeApp, closeDatabase, exit, log, successExitCode, timeoutMs })`, `shutDownAfterFatal(error, options)`, `SHUTDOWN_TIMEOUT_MS` (8000, under Docker's default 10 s `stop_grace_period`), `EXIT_SUCCESS` and `EXIT_FAILURE`. It races `closeApp()` then `closeDatabase()` (in a `finally`, so the pool closes even if `app.close()` throws) against the deadline, logs `Shutdown complete` and exits `0`, or logs `Shutdown failed` and exits `1` when a step throws or the deadline passes. The deadline timer is `unref()`-ed and canceled. `shutdown.test.ts` covers each outcome with a fake `exit`; the signal wiring is checked by the Compose smoke test in `.github/workflows/docker.yml` (`docker compose stop api` must leave exit code `0`) and by hand.

The target behavior, which a change must keep:

1. On `SIGTERM` / `SIGINT`: log once, stop background timers, `app.close()`, close the pool, exit `0`.
2. If that takes longer than a deadline shorter than the orchestrator's grace period (Docker's default `stop_grace_period` is 10 s), log and exit `1`.
3. On `unhandledRejection` or `uncaughtException`: log `fatal` with the error, run the same shutdown, exit `1`.
4. A second signal during shutdown is ignored (`process.once`).

Item 3 exists: `server.ts` registers `FatalEvents` (`uncaughtException`, `unhandledRejection`) with `process.once` and calls `shutDownAfterFatal(error, shutdownOptions)` from `shutdown.ts`, which logs `fatal` with the error and runs the same bounded `shutDown` with `successExitCode: EXIT_FAILURE`, so the process exits `1` even when closing succeeds. Keep one close path: new process-level handlers reuse `shutdownOptions` instead of calling `app.close()` or `process.exit` themselves. `shutdown.test.ts` covers the fatal path, including a timed-out close.

On a branch without `shutdown.ts`, port the file and its test as they are (they have no dependencies) instead of inlining a new timer. `close-with-grace` (not installed) packages the same behavior; adding it is fine only if the named deadline, the pool close and the exit codes are kept.

## Liveness and readiness

`routes/health.ts` serves two public routes, with contracts `livenessSchema` and `readinessSchema` in `packages/shared/src/schema/health.ts`. This skill owns the names and status codes; container-hardening (Docker `HEALTHCHECK`), e2e-playwright (`ApiHealthUrl` in `playwright.config.ts`) and api-security-review (public route list) use them as written here. The human version is `docs/architecture/api.md` › Health checks.

| Route                      | Checks                                                                  | Used by                                                   |
| -------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------- |
| `GET /api/v1/health/live`  | nothing beyond the process answering; `200 { status: 'ok' }`            | the `api` image's `HEALTHCHECK`, restart decisions        |
| `GET /api/v1/health/ready` | `SELECT 1`; `200 { database: 'ok', status: 'ok' }` or `503 UNAVAILABLE` | Playwright's `webServer`, a load balancer or orchestrator |

- The old combined `GET /api/v1/health` is gone and answers `404` (`catalog.test.ts` asserts it). Do not reintroduce it as an alias.
- A failing readiness check logs a `warn` with the error and throws `new ServiceError('The database is not reachable', HttpStatus.serviceUnavailable)`; `DefaultCodes` in `modules/db.ts` gives it the `UNAVAILABLE` code.
- Liveness never touches the database, so a database outage does not restart the container. Keep it that way when adding checks: anything that depends on another system belongs in readiness.
- Both declare `security: []`, a shared response schema and `withErrors`, and do no per-user work. During `app.close()`, `return503OnClosing` makes both answer `503`.
- A further readiness condition (for example that migrations are applied) goes into the same handler and fails the same way.

## Request ids

`plugins/request-id.ts` owns them; `app.test.ts` › request ids and `logging.test.ts` test them. Keep these properties:

- `buildApp` passes `genReqId: requestIdOf` and leaves Fastify 5's `requestIdHeader` at its default `false`. `requestIdOf` accepts an incoming `x-request-id` only if `z.uuid()` parses it, otherwise it generates `randomUUID()` from `node:crypto`. Never switch to `requestIdHeader: 'x-request-id'`: it would trust any client string and write it into every log line. The default sequential `req-1` ids collide across restarts and replicas.
- The header name is `REQUEST_ID_HEADER` in `constants/http.ts`. `registerRequestId` echoes it with an `onSend` hook, so error responses and unknown routes carry it too.
- `registerRequestUser` binds the signed-in user after authentication: an `onRequest` hook replaces both `request.log` and `reply.log` with a child carrying `userId`, because Fastify writes the `request completed` line through `reply.log`. It logs the user id, never the email.
- A test for a change here: a request with a valid id gets the same id back; an invalid one gets a fresh UUID per request.

## Logging and redaction

`plugins/logging.ts` builds the logger options (`loggerOptions(config, stream)`) that `buildApp` passes to Fastify. Keep what it does:

- `level: config.logLevel` (`LOG_LEVEL`, default `info`).
- `redact` with `censor: REDACTED` (`'[REDACTED]'`) over `RedactedLogPaths`: the headers `authorization`, `cookie` and `set-cookie` (at `headers[...]` and `*.headers[...]`) and the fields in `SecretFields` (`currentPassword`, `newPassword`, `password`, `passwordHash`, `token`, `tokenHash`) at the top level and up to two levels deep. A new secret field name joins `SecretFields`, sorted, with a case in `logging.test.ts`.
- A `logMethod` hook that replaces a `DrizzleQueryError` (logged directly or as `err`) with an error that keeps the SQL (`Failed query: …`) and the cause but drops the bound parameters, so a failed insert never writes a user's values or a password hash to the log.

Fastify's default serializers log `method`, `url`, `host`, `remoteAddress` (from `request.ip`, so it depends on `trustProxy`) and `statusCode`. Headers and bodies are not logged by default. The error handler logs 5xx errors once.

Rules:

- Redaction paths are a named, sorted list in `plugins/logging.ts`; do not add a second `redact` elsewhere, and do not log whole headers, bodies or rows when a few named fields say enough.
- URLs are logged with their query string. Do not put secrets or free-text searches in query strings; if a search endpoint needs one, log it with a custom `req` serializer that drops the query.
- Log structured objects, not concatenated strings: `request.log.warn({ accountId }, 'Import skipped rows')`. One line per event; the message is a fixed sentence and variables go in the object.
- Levels: `fatal` the process is going down; `error` a request failed because of us (5xx); `warn` handled but surprising (retry, fallback, deadline close, a failed sign-in); `info` lifecycle and security events; `debug` diagnostics, off in production.
- Security events go through `audit(request, AuditEvents.<event>, details)` from `plugins/audit.ts`: one `Security event` line with an `audit` field (`signed_up`, `signed_in`, `sign_in_failed`, `signed_out`, `password_changed`, `session_revoked`) and optional `reason`, `sessionId`, `userId`. `sign_in_failed` is a `warn`, the rest `info`; the `userId` detail is dropped when the request logger already carries the same id. Never pass the email, password, token or cookie. A new event is added to `AuditEvents` with a test in `audit.test.ts`; which events exist and what they must contain is reviewed by api-security-review.
- In development, pretty printing is optional and must not change production output: pass a transport only when an explicit `LOG_PRETTY`-style flag is set, not based on `NODE_ENV`. Add it inside `loggerOptions`, so `level`, `redact` and the `logMethod` hook still apply to pretty output.

## Load shedding

`@fastify/under-pressure` is not a dependency. `handlerTimeout` already turns one slow request into a `503`, but nothing turns work away when the event loop is saturated. When adding it:

- Register it in `buildApp` before the routes, with named thresholds from config (`maxEventLoopDelay`, `maxEventLoopUtilization`, `maxHeapUsedBytes`, `maxRssBytes`).
- Its rejection is a `503`, which the error handler already answers as `503 UNAVAILABLE` (see `errors.md`); add a route test that proves it.
- Do not use its status route as our health check; keep liveness independent of pressure so the orchestrator does not restart a busy but healthy process.
- Sign-in is the most CPU-expensive route (argon2id through `@node-rs/argon2`, 19 MiB per hash): measure it with the node-diagnostics skill before choosing thresholds.

## Process-wide state and background work

- The API may run as several replicas. Anything held in memory is per process: the `@fastify/rate-limit` store, the per-account sign-in failure windows in `auth/sign-in-throttle.ts`, a cache, the hourly session purge in `server.ts`. Counters reset on restart and are not shared, so limits multiply by the replica count; the purge runs in every replica. Both are acceptable with one replica; when scaling out, move the limit stores to PostgreSQL or Redis and guard the purge with `pg_try_advisory_lock`.
- Never store request or user data at module scope (see `plugins-and-hooks.md` › No request data in module state).
- `trustProxy` comes from `TRUST_PROXY` in `config.ts`, parsed by `trustedProxies`: `false` (the default) or a comma list of IP addresses, CIDR ranges or the named ranges `loopback`, `linklocal`, `uniquelocal`. `true` and hop counts are rejected at start with `TRUST_PROXY_ERROR`, because they would trust any `X-Forwarded-For` a client sends and make `request.ip`, the rate-limit key, spoofable. `buildApp` passes the list, or `false` when it is empty. `config.test.ts` and `auth.test.ts` (a forged `X-Forwarded-For` is ignored by default, honored only from a listed peer) pin this; keep both when touching it. container-hardening sets the value for the deployed proxy; api-security-review checks it.

## Checklist for a production change

1. The value is a named constant with an environment override in `config.ts` if it is tunable.
2. New 5xx paths are mapped to explicit codes and tested with `app.inject`.
3. The change is covered by a route or unit test; shutdown and signals are also checked by hand in the container.
4. `docs/architecture/api.md` (lifecycle, configuration) and `agents/architecture.md` › API service describe the new behavior.
