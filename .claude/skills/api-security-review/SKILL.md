---
name: api-security-review
description: Reviews CoinKeeper API, auth and web-client changes for security defects against OWASP ASVS, mapped to our design (self-hosted argon2id auth, opaque SHA-256-hashed session tokens, a __Host- HttpOnly SameSite=Lax cookie, an Origin and Sec-Fetch-Site check on writes, closed CORS, per-user scoping with 404 for foreign ids, soft delete). Checks session lifetime and rotation, re-authentication, lockout, rate-limit keys and trustProxy, CSP for Next 16, headers, input limits, log redaction, authorization matrix tests and dependency audit; reports findings with severity, file:line, exploit scenario and fix, ending with a verdict. Use when the user asks for a security review, an auth, session or cookie audit, "is this safe", OWASP or ASVS checks, or before merging changes to apps/api/src/auth, plugins, routes, config.ts, next.config.ts or proxy.ts. Not for building endpoints (use fastify-api), Docker or CI hardening (use container-hardening), schema work (use database-change), or the built-in /security-review.
---

# API security review

Review a diff or an area of CoinKeeper for security defects, and say whether it can merge. The design is deliberate, and several generic "best practices" contradict it. Judge each change against our controls and the listed decisions, not against a textbook stack. Every finding must be specific, cited and fixable. Pre-existing gaps go in a separate list so they do not block an unrelated change.

## Before you start

- `agents/architecture.md` › Core rules (per-user scoping, soft delete) and › API service.
- `docs/architecture/api.md` › Sign-up, sign-in and sessions, › Who can reach the API, and what stops them, › Errors and › Configuration.
- `agents/conventions.md` › Server patterns and › Tests (the fix must follow them).
- [references/controls.md](references/controls.md): the existing controls and how each one gets weakened. Read it every time.

## Decisions that are not findings

Do not report these as defects. Raise them only if the change breaks what the decision depends on.

- **Self-hosted authentication** is the recorded decision: argon2id through `@node-rs/argon2`, 32-byte tokens from `crypto.randomBytes`, SHA-256 token hashes in `sessions`. Do not recommend Auth0, Passport, `@fastify/jwt`, `@fastify/session` or Redis sessions. What must never happen is new hand-written crypto primitives.
- **Opaque server-side sessions, not JWT.** They are revocable, listed in `GET /me/sessions` and never stored in `localStorage`.
- **`SameSite=Lax` plus the Origin and `Sec-Fetch-Site` check**, instead of `Strict` plus CSRF tokens. Lax keeps the session on top-level navigation into the app, and the origin check (`rejectForeignOrigin`) blocks cross-site writes. CSRF tokens were a rejected alternative.
- **404, not 403, for other users' ids.** A 403 would confirm that the id exists.
- **Closed CORS** (`CORS_ORIGINS` empty). CORS is not an access control; the session check is.
- **argon2id at 19 MiB, t=2, p=1** is the OWASP minimum profile. Raising it is a capacity decision. It is not a defect.
- **In-memory limiters.** The `@fastify/rate-limit` store and the per-account sign-in throttle (`auth/sign-in-throttle.ts`) live in process memory. That is correct for one API process. It only becomes a finding when a change runs several replicas.
- **The report-only page CSP with `'unsafe-inline'`** and no nonce is the recorded decision (`references/csp-headers.md`).
- **Soft delete for financial data.** Only sessions are hard-deleted, and users go with `ON DELETE CASCADE`.

## Workflow

1. **Scope.** For a branch: `git diff --stat main...HEAD`, then read every changed file in full, not just the hunks. For an area, list its files. Changes under `apps/api/src/auth/`, `apps/api/src/plugins/`, `apps/api/src/routes/`, `apps/api/src/config.ts`, `apps/web/next.config.ts`, `apps/web/src/proxy.ts`, `apps/web/src/api/client.ts`, `Dockerfile` or `docker-compose.yml` get the full checklist. Other changes get the sections they touch.
2. **Check the controls first.** Run `git diff main...HEAD -- apps/api/src/plugins apps/api/src/auth apps/api/src/config.ts apps/api/src/routes/index.ts apps/web/next.config.ts apps/web/src/proxy.ts`. Compare each hunk with the red flags in `controls.md`. A weakened control is a blocker unless the pull request states the decision and updates the docs.
3. **Walk the checklist.** Use [references/asvs-checklist.md](references/asvs-checklist.md) for the sections in scope: access control, sessions, CSRF and origin, headers and CSP, input and limits, injection, data exposure, logging, client, dependencies and deployment coupling. Each item says how to check it. Run the commands; do not guess.
4. **Trace ownership by hand** for every new or changed handler: route → `userIdOf(request)` → service → every query and every foreign id in the body (`accountId`, `categoryId`, `payeeId`, `groupId`, `moveToId`, `transferId`). Each must be scoped to the user, and a foreign one must end in `ServiceError('… not found', HttpStatus.notFound)`.
5. **Check the tests.** Every rule the change touches needs a route test in `apps/api/src/routes/*.test.ts`: happy path, `400`, and another user's id answering `404`. Security behavior (cookies, origin, rate limits, session lifetime and rotation, proxy trust, audit lines) belongs in `auth.test.ts`; headers, body parsing, request ids and timeouts in `app.test.ts`. A new route must also be covered by `apps/api/src/routes/authorization.test.ts`, the route-inventory and foreign-id matrix: see [references/authz-matrix.md](references/authz-matrix.md) for what it checks and how a change can quietly weaken it.
6. **Run the checks** in the next section and record their output.
7. **Write the report** in the format of [references/findings-format.md](references/findings-format.md), ending with the verdict line: the report's final line is exactly `Verdict: Safe to merge`, `Verdict: needs changes` or `Verdict: reject`. Every finding carries a `file:line` (or says the code under review is not in the repository) and an exploit scenario.

## Checks to run

| Check                        | Command                                                                                                                        | Pass when                                                                                                                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Security tests still pass    | `npm test -- --run --project api`                                                                                              | green, including `auth.test.ts`, `authorization.test.ts`, `app.test.ts`, `plugins/logging.test.ts` and `plugins/audit.test.ts`                                                                                |
| No raw SQL from input        | `grep -rn "sql.raw\|sql.identifier" apps/api/src`                                                                              | no hits, or only constants chosen from a lookup object, never request data                                                                                                                                    |
| No state change on GET       | `grep -n "app.get(" -A12 <changed route files>`                                                                                | GET handlers only read                                                                                                                                                                                        |
| New public routes            | `git diff main...HEAD -- apps/api/src/routes/index.ts`                                                                         | new resources are added to `AuthenticatedRoutes`; public additions are justified and rate limited                                                                                                             |
| JSON-only bodies             | `grep -rn "addContentTypeParser\|removeContentTypeParser" apps/api/src`                                                        | no `addContentTypeParser`, and `registerSecurity` still removes the `text/plain` parser: every non-JSON body answers `415` (see the checklist)                                                                |
| No HTML injection sinks      | `grep -rn "dangerouslySetInnerHTML\|innerHTML" apps/web/src`                                                                   | none                                                                                                                                                                                                          |
| No tokens in browser storage | `grep -rn "localStorage\|sessionStorage" apps/web/src`                                                                         | only UI preferences, never session data                                                                                                                                                                       |
| Trusted proxy scope          | `grep -n "TRUST_PROXY\|trustProxy\|isProxyAddress" apps/api/src/config.ts apps/api/src/app.ts docker-compose.yml .env.example` | `false` by default in `config.ts`, compose and `.env.example`; only addresses, CIDRs or the named ranges are accepted (`true` and hop counts rejected); a deployment lists only its proxy hop (see checklist) |
| Log redaction                | `grep -n "SecretFields\|SecretHeaders\|RedactedLogPaths" apps/api/src/plugins/logging.ts`                                      | the lists still cover the cookie, authorization and set-cookie headers and every password and token field; a new secret field was added to them                                                               |
| Dependency advisories        | `npm audit --omit=dev --audit-level=high`                                                                                      | no high or critical advisories; new dependencies are justified in the pull request                                                                                                                            |
| Lockfile surprises           | `git diff main...HEAD --stat -- package-lock.json` and `git diff main...HEAD -- '**/package.json'`                             | every lockfile change traces to a `package.json` change                                                                                                                                                       |

## References

| File                                                | Read it when                                                                                               |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [controls.md](references/controls.md)               | Always: the controls in place, where they live, the test that pins each one, and what weakening looks like |
| [asvs-checklist.md](references/asvs-checklist.md)   | Walking the review: ASVS 4.0.3 items mapped to CoinKeeper checks, including the known gaps to verify       |
| [csp-headers.md](references/csp-headers.md)         | A change touches `next.config.ts`, `proxy.ts`, helmet options or inline scripts and styles                 |
| [authz-matrix.md](references/authz-matrix.md)       | Reviewing or writing per-user authorization tests; checking that a new route cannot skip the session       |
| [findings-format.md](references/findings-format.md) | Writing the findings and the verdict                                                                       |
| [source.md](references/source.md)                   | Crediting the upstream material                                                                            |

## Verify a fix

When the user asks you to fix what you found, hand implementation patterns to `fastify-api` (API), `database-change` (schema) or `container-hardening` (Docker, CI). For every rule you touch, add or update a test that fails without the fix. Then run `npm run lint && npm run typecheck && npm test -- --run && npm run build`, and `npm run test:e2e` when the origin check, cookies or the route guard changed. Report the real results.

## Keep the docs true

A change to a control updates `docs/architecture/api.md` (› Who can reach the API, the cookie table, › Configuration), `docs/features/account-and-security.md` for anything users see (sessions, password, email change) and `agents/architecture.md` › API service. Find further pages with `agents/docs-map.md`. If the review changed nothing, say so.
