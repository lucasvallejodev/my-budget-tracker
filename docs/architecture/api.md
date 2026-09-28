# API service

> Summary: the Fastify service in `apps/api`: folder layout, how a request flows through plugins and routes, start-up and graceful shutdown, request ids, logging and time limits, sign-up, sign-in and cookie sessions, the layers that keep other sites and strangers out, the client IP behind a reverse proxy, error responses, soft deletes, and how to add or test an endpoint.

The API is a standalone Fastify 5 application (`@coinkeeper/api`). It owns the database: the Drizzle schema, the migrations, every business rule and every query. The web app talks to it over HTTP under `/api/v1`. The endpoint list is in the [REST API reference](../reference/rest-api.md).

## Layout

```
apps/api/
├─ drizzle/                 SQL migrations and Drizzle snapshots (0000_init.sql is the whole schema)
├─ scripts/                 database.mjs (npm run db:check) and its helper
├─ src/
│  ├─ server.ts             Entry point: loads .env, opens the pool, builds the app, listens, purges expired sessions hourly
│  ├─ shutdown.ts           shutDown(): on SIGTERM/SIGINT closes Fastify, then the pool, within 8 s; exit code 0 or 1
│  ├─ app.ts                buildApp({ config, db, logger? }): server timeouts, request ids, logger, plugins and routes; never listens (tests use it)
│  ├─ config.ts             Environment variables validated with Zod (see Configuration)
│  ├─ environment.ts        Reads the root .env and opens the database for the server and the CLI
│  ├─ auth/                 passwords.ts (argon2id), sessions.ts (session store), service.ts (sign-up, sign-in, profile, password), sign-in-throttle.ts (slows repeated failed sign-ins per account)
│  ├─ plugins/              security.ts, authentication.ts, error-handler.ts, openapi.ts, context.ts (request.auth, requireAuth),
│  │                        request-id.ts, logging.ts (redaction), audit.ts (security events)
│  ├─ routes/               One plugin per resource (accounts.ts, transactions.ts, …), inputs.ts (amount parsing), responses.ts
│  ├─ modules/              Domain services (accounts, categories, ledger, payees, reports, fx, import, rules, budgets) and services.ts
│  ├─ db/                   schema.ts, connection.ts (DATABASE_URL checks), index.ts (node-postgres pool)
│  ├─ cli/reset-password.ts npm run user:reset-password -- <email>
│  └─ test/                 database.ts (PGlite with every migration), app.ts (buildApp on PGlite, sign-up helper, inject client)
└─ tsup.config.ts           Production bundle in dist/ (the shared package is bundled in)
```

Request and response shapes are Zod schemas in `packages/shared/src/schema/`. The same schema validates the request in Fastify, types the handler, serialises the response (unknown fields are stripped, so internal columns never leak), documents the endpoint in OpenAPI and validates the web forms.

## Request lifecycle

```mermaid
sequenceDiagram
  participant B as Browser
  participant N as Next.js (same origin)
  participant F as Fastify
  participant S as Service
  B->>N: fetch /api/v1/accounts (session cookie attached)
  N->>F: rewrite to http://api:4000/api/v1/accounts
  F->>F: request id, helmet headers and CSP, CORS, origin check (writes only)
  F->>F: resolve session cookie → request.auth
  F->>F: authenticated scope: 401 when request.auth is empty
  F->>F: body must be JSON (415 otherwise); Zod validates params, query and body (400 on failure)
  F->>S: services.accounts.list(userId, query)
  S-->>F: AccountSummary[]
  F-->>B: 200 { items: [...] } (serialised through the response schema)
```

Routes that need a user are registered inside one scope with an `onRequest` hook (`requireSession`), so forgetting the check on a new route is not possible. Only `GET /health/live`, `GET /health/ready` and `POST /auth/sign-up | sign-in | sign-out` are outside it.

### Start and shutdown

`server.ts` never migrates: migrations are a separate one-shot command (`node dist/cli/migrate.js`, the `migrate` service in Docker Compose), so restarting the API does not touch the schema. On `SIGTERM` or `SIGINT` the server stops the session purge timer and calls `shutDown()` (`src/shutdown.ts`): Fastify stops accepting connections and waits for requests in flight, then the PostgreSQL pool closes (even if closing Fastify failed). The process exits `0` when both finish, and `1` when either fails or the whole shutdown takes longer than 8 seconds, which is inside Docker's default 10-second grace period before `SIGKILL`. In the container image `tini` is PID 1 and `node` is started directly (exec form), so the signal reaches Node; a second signal during shutdown ends the process at once.

## Sign-up, sign-in and sessions

- **Users** live in `users` (`email` unique and stored lower-case, `password_hash`, optional `name`). Passwords are hashed with argon2id (`@node-rs/argon2`, 19 MiB memory, 2 iterations). Passwords must have 12 to 128 characters.
- **Sign-up** inserts the user and seeds their settings and default categories (`ensureUserBootstrap`) in one transaction, then starts a session. Every table's `user_id` references `users(id) ON DELETE CASCADE`.
- **Sessions** live in `sessions`. The browser holds a random 32-byte token; the database stores only its SHA-256 hash, so a database leak does not expose usable tokens. A session lasts `SESSION_DAYS` (30 by default) and is renewed automatically when less than half of that remains; `last_used_at` is refreshed at most once a minute.
- **Maximum age.** Renewal never goes past `SESSION_MAX_AGE_DAYS` (90 by default, at least `SESSION_DAYS`) counted from the session's own `created_at`. After that the session is rejected and deleted even if it was used a minute ago, and the user signs in again. A stolen cookie therefore stops working at the latest after that many days.
- **Every sign-in and sign-up issues a new token.** A token the browser already holds is never reused: if the request carries a session cookie, that session is deleted before the new one is created, so a cookie planted before sign-in (session fixation) is worthless.
- **Sign-out** deletes the session and clears the cookie. **Changing the password** deletes every session of the user, including the current one, and answers with a new cookie for a fresh session in the same response, so the browser that made the change stays signed in and every other cookie stops working. `GET /me/sessions` lists active sessions and `DELETE /me/sessions/:id` ends one.
- **Unknown email or wrong password** give the same `401 INVALID_CREDENTIALS` answer, and an unknown email still spends the time of a password check so response times do not reveal which emails exist.
- **Failed sign-ins per account.** Besides the limit per IP, sign-in attempts for one normalized email are slowed down once it has `SIGN_IN_FAILURES_PER_ACCOUNT` wrong passwords (5 by default), from any address. Each further attempt waits for its own slot: 1 s after the previous one, then 2 s, 4 s and at most 5 s apart, so a distributed attack on one account gets about 12 guesses a minute at best. The account is never locked: the right password always signs in, at worst after a 5-second wait. Only when so many attempts are already queued that the wait would pass 15 seconds is the request refused with `429 RATE_LIMITED` ("try again in a few seconds"); a single address at the per-IP limit cannot cause that. Unknown emails are counted and slowed the same way before any database lookup, so neither the answer nor its timing reveals whether the account exists. Failures are forgotten 15 minutes after the last one, and a successful sign-in clears them. The state lives in the API process memory (at most 10 000 emails, oldest dropped first): it resets on restart and is not shared between replicas, which is fine for the single API instance we run.
- **Password reset** has no email flow yet. An operator runs `npm run user:reset-password -- <email>` (prompts for the password, or reads `NEW_PASSWORD`); it signs the user out everywhere.

### The session cookie

| Attribute  | Value                                                                   | Why                                                                                                                                                                      |
| ---------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Name       | `__Host-ck_session` (production), `ck_session` (plain-HTTP development) | The `__Host-` prefix makes browsers accept the cookie only when it is `Secure`, has `Path=/` and no `Domain`, so a subdomain cannot set or read it.                      |
| `HttpOnly` | yes                                                                     | Page JavaScript cannot read the token, so an injected script cannot steal it.                                                                                            |
| `Secure`   | in production and in Docker Compose (`COOKIE_SECURE`)                   | Only sent over HTTPS.                                                                                                                                                    |
| `SameSite` | `Lax`                                                                   | The browser does not attach the cookie to requests started by other sites (forms, `fetch`, images); it only sends it on our own pages and on top-level navigation to us. |
| `Expires`  | session expiry                                                          | Renewed with the session, never past its maximum age.                                                                                                                    |

## Who can reach the API, and what stops them

CORS is only one of several layers, and it is not the one that keeps strangers out. CORS is a rule browsers enforce: JavaScript on another site may send a request, but the browser hides the response unless the server allows that site. It does nothing against `curl`, scripts or other servers. What actually protects the data is the session check.

```
Browser ──► https://app.example.com   (Next.js, the only public entry point)
               └─ /api/* forwarded ──► Fastify on a private network ──► PostgreSQL
```

| Layer                  | What it does                                                                                                                                                                                                                                                                                                                                                                                              | Where                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1. Network             | Fastify is not published to the internet; Next.js forwards `/api/*` to it. In development it listens on `127.0.0.1`; Docker Compose publishes only the web app, on `127.0.0.1`, for a TLS-terminating reverse proxy.                                                                                                                                                                                      | `API_HOST`, Docker Compose network             |
| 2. Session check       | Every route except health and sign-up/in/out needs a valid session: no cookie, an unknown token or an expired one → `401`. This is what stops a stranger.                                                                                                                                                                                                                                                 | `plugins/authentication.ts`, `routes/index.ts` |
| 3. Cookie attributes   | `HttpOnly`, `Secure`, `SameSite=Lax`, `__Host-` prefix (table above).                                                                                                                                                                                                                                                                                                                                     | `plugins/authentication.ts`                    |
| 4. Origin check (CSRF) | For `POST`, `PUT`, `PATCH` and `DELETE`, a browser always sends `Origin`; if it is not in `ALLOWED_ORIGINS`, or `Sec-Fetch-Site` says `cross-site`, the answer is `403 ORIGIN_NOT_ALLOWED`. Requests without either header (scripts, `curl`) still need a session.                                                                                                                                        | `plugins/security.ts`                          |
| 5. CORS                | Registered with the `CORS_ORIGINS` allow-list, empty by default: no `Access-Control-Allow-Origin` header, so no other site's JavaScript can read a response.                                                                                                                                                                                                                                              | `plugins/security.ts`                          |
| 6. Security headers    | `@fastify/helmet`: `X-Frame-Options`, `X-Content-Type-Options`, HSTS and friends, and `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'` on every API response (Swagger UI under `/api/docs` gets its own policy that allows only its own scripts and styles). Pages get their own headers and Content Security Policy from Next.js ([Security headers](security-headers.md)).         | `plugins/security.ts`                          |
| 7. Rate limiting       | Sign-up, sign-in and password change: `AUTH_ATTEMPTS_PER_MINUTE` per client IP (10 by default) → `429 RATE_LIMITED`; sign-in attempts for one email are slowed (1 s growing to 5 s apart) after `SIGN_IN_FAILURES_PER_ACCOUNT` failures, without ever locking the account. The IP is the connection address unless `TRUST_PROXY` lists the proxy (see [Behind a reverse proxy](#behind-a-reverse-proxy)). | `routes/auth.ts`, `auth/sign-in-throttle.ts`   |
| 8. Ownership           | Every service filters by `user_id`; ids of other users answer `404`.                                                                                                                                                                                                                                                                                                                                      | `modules/*`                                    |

What each kind of caller meets:

| Caller                                                 | Result                                                                                                                                                |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| A stranger with `curl`                                 | `401` on everything except sign-up/in (rate limited).                                                                                                 |
| `evil.example` calling `fetch` while you are signed in | The browser leaves the cookie off (`SameSite`), the origin check answers `403`, and without CORS headers the script could not read a response anyway. |
| `evil.example` submitting a hidden form                | No cookie, wrong `Origin`, and any body that is not `application/json` answers `415`, even on routes that take no body.                               |
| You, from a script                                     | Allowed: sign in, keep the cookie, send it back.                                                                                                      |

Other applications (a mobile app, integrations) should get personal access tokens sent as `Authorization: Bearer …` rather than cookies; that is future work. To let a web app on another origin call the API, add it to `CORS_ORIGINS` (it is then also accepted by the origin check).

### Behind a reverse proxy

The rate limit and the address shown in the session list use `request.ip`. By default (`TRUST_PROXY=false`) that is the address of the TCP connection, and `X-Forwarded-For` is ignored, because anyone can send that header: trusting it blindly would let a caller pick a new IP for every request and never hit the limit.

Next.js does not add its own entry to `X-Forwarded-For`: it only fills the header in when the request has none, and otherwise forwards whatever the client sent. So behind Next.js alone the header proves nothing, and the API sees every request coming from the web app (`127.0.0.1` with `npm run dev`, the web container in Docker). The limit then applies to all clients together, which errs on the safe side.

To limit each client separately, put a reverse proxy in front of the web app that **replaces** `X-Forwarded-For` with the address it received the connection from (Caddy does by default; with nginx use `proxy_set_header X-Forwarded-For $remote_addr;`), make the web app reachable **only** through that proxy, and set `TRUST_PROXY` to the address of the web app as the API sees it:

| Setup                                          | `TRUST_PROXY`                                                                                   |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| No reverse proxy                               | `false` (default)                                                                               |
| Reverse proxy → `npm start` on the same host   | `loopback`                                                                                      |
| Reverse proxy → Docker Compose `web` container | the Compose network's subnet (`docker network inspect <project>_app-network`), or `uniquelocal` |

`TRUST_PROXY` accepts `false` or a comma-separated list of IP addresses, CIDR ranges and the names `loopback`, `linklocal` and `uniquelocal` (the private ranges); `true` and hop counts are rejected at start-up. The API then takes the last `X-Forwarded-For` entry that is not itself a trusted address.

## Health checks

Two public routes report the state of the API. Neither needs a session or does per-user work.

| Route                      | Checks                                  | Answers                                                      | Used by                                            |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------- |
| `GET /api/v1/health/live`  | The process answers; no database access | `200 { status: "ok" }`                                       | The API image's Docker `HEALTHCHECK` (restarts)    |
| `GET /api/v1/health/ready` | `SELECT 1` against PostgreSQL           | `200 { status: "ok", database: "ok" }`, or `503 UNAVAILABLE` | Playwright's `webServer`, load balancers (routing) |

Liveness never touches the database, so a database outage does not make Docker restart a healthy API container. Readiness logs the driver error as a warning and returns only a generic message.

## Request ids, logs and time limits

**Request ids.** Every response, errors and unknown routes included, carries an `X-Request-Id` header. When the caller sends an `X-Request-Id` that is a UUID, the API reuses it; anything else (missing, malformed, repeated) is replaced by a fresh random UUID, so a client cannot write arbitrary text into the logs. The same id is the `reqId` field of every log line for that request, and once the session cookie is resolved the lines also carry `userId` (never the email). Quote the id from a failed response to find its log lines. The code is in `plugins/request-id.ts`.

**Logs** are JSON lines (Pino) at `LOG_LEVEL`. Headers and bodies are not logged, and before a line is written (`plugins/logging.ts`):

- the `authorization`, `cookie` and `set-cookie` headers and any `password`, `currentPassword`, `newPassword`, `passwordHash`, `token` or `tokenHash` field (up to two levels deep) are replaced by `[REDACTED]`;
- a failed database query is logged with its SQL text only: the values bound to it (emails, password hashes, token hashes) are dropped from the message, the stack and the error's fields.

Log structured objects with a fixed message (`request.log.warn({ accountId }, 'Import skipped rows')`, errors as `{ err: error }`), and never put secrets in URLs, because URLs are logged with their query string. A `500` or `503` is logged once, as `Request failed`, under its request id.

**Security events.** Sign-up, sign-in, failed sign-in, sign-out, password change and session revocation each write one `Security event` line with an `audit` field (`signed_up`, `signed_in`, `sign_in_failed`, `signed_out`, `password_changed`, `session_revoked`), the request id, the user id when known and, for a failed sign-in, the reason. Failed sign-ins are `warn`, the rest `info`. These lines never contain the email, the password or the token. Routes call `audit(request, AuditEvents.<event>, { userId, sessionId, reason })` from `plugins/audit.ts`.

**Time limits.** Every request must finish within `HANDLER_TIMEOUT_MS` (20 s by default). When it runs out, the API answers `503 UNAVAILABLE` and aborts `request.signal`. Aborting frees the client, not the database; the database stops on its own instead: every pooled connection has `statement_timeout` set to `HANDLER_TIMEOUT_MS` minus 1 s (at least 0.5 s), so PostgreSQL cancels a runaway statement (SQLSTATE `57014`) just before the request times out. The migrator runs without that limit ([Domain services › Database pool](server.md#database-pool)). The default stays below the 30-second proxy timeout of the Next.js rewrite, so the browser gets the API's JSON error rather than a bare `500` from Next.js; raise `experimental.proxyTimeout` in `apps/web/next.config.ts` before raising `HANDLER_TIMEOUT_MS` above about 25 s. The socket limits are constants in `constants/http.ts`:

| Limit               | Value                       | Why                                                                                                                                                                                                                                                |
| ------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requestTimeout`    | 30 s                        | A client has this long to send the whole request (headers and body), which stops slow-upload attacks; a CSV import body arrives well within it.                                                                                                    |
| `connectionTimeout` | `HANDLER_TIMEOUT_MS` + 10 s | A socket with no traffic for this long is closed. It must outlast the handler timeout, or a slow request would lose its socket before the `503` goes out.                                                                                          |
| `keepAliveTimeout`  | 72 s                        | An idle keep-alive connection stays open this long. The Next.js rewrite proxy keeps idle sockets to the API with no timeout of its own and load balancers commonly use 60 s, so the API is the side that waits longest (no `ECONNRESET` on reuse). |

## Errors

Every error has the same body:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Use YYYY-MM-DD",
    "fields": { "date": "Use YYYY-MM-DD" }
  }
}
```

| Status | `code`                                   | When                                                                                                                                                                                                                                                        |
| ------ | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 400    | `INVALID_REQUEST`                        | The request does not match its schema (`fields` names each problem), an amount cannot be parsed, a cursor is invalid.                                                                                                                                       |
| 401    | `UNAUTHENTICATED`, `INVALID_CREDENTIALS` | No valid session; wrong email or password.                                                                                                                                                                                                                  |
| 403    | `ORIGIN_NOT_ALLOWED`, `FORBIDDEN`        | Cross-site write; wrong current password.                                                                                                                                                                                                                   |
| 404    | `NOT_FOUND`                              | Unknown route, or a record that does not exist or belongs to someone else.                                                                                                                                                                                  |
| 409    | `CONFLICT`, `EMAIL_TAKEN`                | Duplicate payee name or email, account currency locked, account with transactions, transfer leg edited as a plain transaction, restoring into a deleted account, unarchiving a category of an archived group.                                               |
| 422    | `RULE_VIOLATION`                         | A business rule refused the change (unknown currency, archived account, system group, amounts that do not pair up).                                                                                                                                         |
| 415    | `INVALID_REQUEST`                        | The request has a body that is not `application/json`, on any route.                                                                                                                                                                                        |
| 429    | `RATE_LIMITED`                           | Too many sign-in attempts from one address, or too many failed ones for one account.                                                                                                                                                                        |
| 500    | `INTERNAL`                               | Anything unexpected; the details are logged, never returned.                                                                                                                                                                                                |
| 503    | `UNAVAILABLE`                            | The API cannot serve the request right now: readiness cannot reach the database, a request ran longer than `HANDLER_TIMEOUT_MS`, PostgreSQL cancelled a query at its `statement_timeout` (SQLSTATE `57014`), or any other `503`. The message stays generic. |

Services throw `ServiceError(message, status, code)`; `plugins/error-handler.ts` turns it, Zod validation errors and PostgreSQL unique or foreign-key violations into the body above. Every error response also carries `X-Request-Id`.

## Soft deletes

Financial data is never removed from the database. `DELETE` sets `deleted_at` and the row disappears from every list, balance, report, budget and conversion; the matching `POST …/restore` clears it again.

| Resource                                                     | Delete                                      | Restore                                                                                       | See deleted rows                               |
| ------------------------------------------------------------ | ------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Transactions                                                 | `DELETE /transactions/:id`                  | `POST /transactions/:id/restore`                                                              | `GET /transactions?deleted=true`               |
| Transfers (both legs)                                        | `DELETE /transfers/:transferId`             | `POST /transfers/:transferId/restore`                                                         | `GET /transactions?deleted=true&kind=transfer` |
| Accounts (only without live transactions; archive otherwise) | `DELETE /accounts/:id`                      | `POST /accounts/:id/restore`                                                                  | `GET /accounts?deleted=true`                   |
| Rules                                                        | `DELETE /rules/:id`                         | `POST /rules/:id/restore`                                                                     | `GET /rules?deleted=true`                      |
| Budgets                                                      | `DELETE /budgets/:id`                       | `POST /budgets/:id/restore` (upserting the same month, category and currency also revives it) | `GET /budgets?month=…&deleted=true`            |
| Exchange rates                                               | `DELETE /exchange-rates/:base/:quote/:date` | `POST …/restore` (or `PUT` the rate again)                                                    | `GET /exchange-rates?deleted=true`             |

Categories, category groups and payees are archived instead (`POST …/archive`, `POST …/unarchive`), because history keeps pointing at them. Restoring checks the rules again: a transaction whose account was deleted cannot come back until the account does (`409`); a transaction whose category was archived meanwhile comes back uncategorised and waiting for review; a bank row that was deleted and then imported again cannot be restored twice (`409`). Only sessions are deleted for real, and users are removed with everything they own (`ON DELETE CASCADE`) — there is no endpoint for that yet.

## Configuration

Read from the environment (and the root `.env` in development):

| Variable                       | Default                   | Meaning                                                                                                                            |
| ------------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                 | — (required)              | Direct PostgreSQL URL.                                                                                                             |
| `API_HOST`, `API_PORT`         | `127.0.0.1`, `4000`       | Where Fastify listens. Use `0.0.0.0` inside a container.                                                                           |
| `ALLOWED_ORIGINS`              | `http://localhost:3000`   | Comma-separated origins allowed to send writes (the web app's public URL).                                                         |
| `CORS_ORIGINS`                 | empty                     | Comma-separated origins allowed to read responses cross-origin.                                                                    |
| `COOKIE_SECURE`                | `true` in production      | Adds `Secure` and switches to the `__Host-` cookie name.                                                                           |
| `SESSION_DAYS`                 | `30`                      | Session lifetime.                                                                                                                  |
| `SESSION_MAX_AGE_DAYS`         | `90`                      | Absolute session age from sign-in, however often it is used (`SESSION_DAYS` to 365).                                               |
| `SIGN_IN_FAILURES_PER_ACCOUNT` | `5`                       | Wrong passwords for one email before its sign-in attempts are slowed down (1 to 100); forgotten 15 minutes after the last failure. |
| `AUTH_ATTEMPTS_PER_MINUTE`     | `10`                      | Rate limit for sign-up, sign-in and password change.                                                                               |
| `TRUST_PROXY`                  | `false`                   | Proxies whose `X-Forwarded-For` is believed (see [Behind a reverse proxy](#behind-a-reverse-proxy)).                               |
| `API_DOCS`                     | `true` outside production | Serve Swagger UI at `/api/docs` (the JSON document is at `/api/docs/json`).                                                        |
| `HANDLER_TIMEOUT_MS`           | `20000`                   | Longest a request may take (1000 to 120000 ms) before `503 UNAVAILABLE`; keep it below the Next.js proxy timeout (30 s).           |
| `LOG_LEVEL`                    | `info`                    | Pino log level. Secrets are redacted at every level ([Request ids, logs and time limits](#request-ids-logs-and-time-limits)).      |

## Adding an endpoint

1. Put the request and response schemas in `packages/shared/src/schema/<domain>.ts` (inputs end in `Schema`, their types in `Values`; responses are Zod objects with inferred types).
2. Add or extend the service function in `apps/api/src/modules/<domain>/service.ts`; it takes `userId` first, checks ownership, throws `ServiceError` and returns the response type.
3. Register the route in `apps/api/src/routes/<resource>.ts` with `schema: { params, querystring, body, response: withErrors({ 200: … }), tags }`. Use `userIdOf(request)` for the user. Commands are `POST /<resource>/:id/<verb>`; deletes answer `204` and are soft.
4. Test it in `apps/api/src/routes/*.test.ts` with `createTestApp()` and `signUp()` (`src/test/app.ts`): the happy path, validation (`400`), another user's id (`404`) and the rule it enforces.
5. Add the row to the [REST API reference](../reference/rest-api.md).
