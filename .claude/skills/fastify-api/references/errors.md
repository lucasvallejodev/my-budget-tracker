# Errors

> Summary: how CoinKeeper's API fails: ServiceError and its helpers, the single error handler and its mapping table (including 415 for non-JSON bodies and statement timeouts as 503), adding an error code, Fastify's own FST_ERR errors, and the traps (500 for other 5xx, echoing input, replying from hooks).

## Throwing

| Situation                                   | Throw                                                                 |
| ------------------------------------------- | --------------------------------------------------------------------- |
| a row is missing or belongs to another user | `notFound('Account')` → `404 NOT_FOUND`                               |
| a unique business key is taken              | `conflict('A budget for this month already exists')` → `409 CONFLICT` |
| a domain rule is broken                     | `new ServiceError(message)` → `422 RULE_VIOLATION` (default status)   |
| bad input the schema cannot express         | `new ServiceError(message, HttpStatus.badRequest)` → `400`            |
| not signed in                               | `requireAuth(request)` already throws `401 UNAUTHENTICATED`           |
| a specific, client-visible reason           | `new ServiceError(message, status, 'EMAIL_TAKEN')`                    |

All of them live in `apps/api/src/modules/db.ts`. `ServiceError.message` is shown to users by the web app (`ApiError.message` in a toast), so write it as a sentence for a person, without ids or SQL.

## The handler

`registerErrorHandler` in `apps/api/src/plugins/error-handler.ts` is the only place that shapes an error response:

| Error                                                  | Status and code                                                                                                |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Zod validation (`hasZodFastifySchemaValidationErrors`) | `400 INVALID_REQUEST` with `fields` per path                                                                   |
| `ServiceError`                                         | its `status` and `code`                                                                                        |
| PostgreSQL `23505` (`isUniqueViolation`)               | `409 CONFLICT`                                                                                                 |
| PostgreSQL `23503` (`isForeignKeyViolation`)           | `422 RULE_VIOLATION`                                                                                           |
| PostgreSQL `57014` (`isQueryCanceled`)                 | treated as a `503` (a `statement_timeout` cancel), see the 503 row                                             |
| any other error with `statusCode < 500`                | that status, code from `StatusCodes` or `INVALID_REQUEST`, the message from `ClientErrorMessages` or Fastify's |
| any other error with `statusCode` 503                  | `503 UNAVAILABLE`, message `The service is temporarily unavailable`                                            |
| everything else                                        | `500 INTERNAL`, message `Unexpected error`, logged with `request.log.error`                                    |

The PostgreSQL checks live in `apps/api/src/modules/errors.ts` (`hasPostgresCode` follows `error.cause`, because Drizzle wraps driver errors in `DrizzleQueryError`). `setNotFoundHandler` answers unknown routes with `404 NOT_FOUND`. Every route's `withErrors()` declares `'4xx'` and `'5xx'` as `errorResponseSchema`, so the envelope is serialized and documented everywhere.

## Adding a code

1. Add the string to `ErrorCodeValues` in `packages/shared/src/schema/common.ts` (sorted). The web app gets it through `ApiError.code`.
2. If a `ServiceError` carries it, pass it as the third argument; nothing else changes.
3. If it comes from Fastify or a plugin, add a branch in `describe` (keep the function under the complexity budget: extract a small `…Body` helper per family) and a route test that triggers it.
4. Update `docs/architecture/api.md` › Errors and `docs/reference/rest-api.md` › Conventions.

## Traps

- **503 is the only 5xx that keeps its status.** Any error with status `503` (`FST_ERR_HANDLER_TIMEOUT` from `handlerTimeout`, a query canceled by `statement_timeout` with SQLSTATE `57014`, `@fastify/under-pressure` if it is ever added) is answered as `503 UNAVAILABLE` with the fixed message "The service is temporarily unavailable"; `plugins/error-handler.test.ts` and `app.test.ts` pin this. Every other status `>= 500` on a non-`ServiceError` becomes `500 INTERNAL`. A `ServiceError` is different: the handler returns its own status and code before that branch, so `new ServiceError(message, 502)` answers `502` with the fallback code `RULE_VIOLATION` (no `DefaultCodes` entry for 502) and your message. For an upstream or dependency failure, use `HttpStatus.serviceUnavailable` so the client gets `503 UNAVAILABLE`. A `ServiceError` built with `HttpStatus.serviceUnavailable` gets `UNAVAILABLE` from `DefaultCodes` in `modules/db.ts` and keeps its own message, so write that message for users (readiness uses "The database is not reachable"). Every 5xx, 503 included, is logged once at `error` level by the handler.
- **413 and 415.** Body too large (`FST_ERR_CTP_BODY_TOO_LARGE`) falls into the `< 500` branch as `INVALID_REQUEST` with Fastify's English message. Unsupported media type (`FST_ERR_CTP_INVALID_MEDIA_TYPE`) is `415 INVALID_REQUEST` with the message from `ClientErrorMessages` ("Send the request body as application/json"). The API parses only JSON: `registerSecurity` removes Fastify's `text/plain` parser, so a plain-text or form body answers `415` even on a route without a body schema (`app.test.ts` › request bodies). Do not add a content-type parser back; it reopens the simple-request CSRF path. Give either status its own code only if the web app needs to react.
- **Do not echo input.** Upstream Fastify examples put `value: err.data` in validation details. Our `fields` carry only the Zod message per path; never add the submitted value (passwords travel through these schemas).
- **Do not reply from hooks.** A hook that does `reply.code(401).send(…)` bypasses the envelope and the OpenAPI contract. Throw `ServiceError` (as `requireSession` does through `requireAuth`).
- **Do not catch to log and rethrow.** The handler logs 5xx once with the request id; logging again in services duplicates lines. Catch only to translate (as `parseAmount` does) or to add `{ cause }`.
- **Unique violations inside services.** Prefer a pre-check plus `conflict()` with a helpful message; the generic `23505` mapping says only "That value is already in use". Import `isUniqueViolation`, `isForeignKeyViolation` and `isQueryCanceled` from `modules/errors.ts`, which `auth/service.ts` and the error handler also use; never match on the error message and never add a private copy. A new SQLSTATE check goes there as a named constant.
