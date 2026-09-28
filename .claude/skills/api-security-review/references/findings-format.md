# Findings format

> Summary: how to write the security review: scope line, controls checked, findings with severity, file:line, ASVS reference, exploit scenario and fix, the pre-existing gaps kept apart, the checks that were run, and a verdict line.

## Structure

```
Scope: <branch or area>, <n> files read in full
Controls checked: <list from controls.md that the change touches>, all intact | <which one is weakened>

Findings
<file>:<line> (<blocker|important|nit>, <area>, ASVS <id>)
  Defect: what the code does, quoting the symbol.
  Exploit: who does what, step by step, and what they get.
  Fix: the concrete change in our style (helper, schema, service call) and the test that proves it.

Pre-existing gaps (not introduced by this change)
- <file>:<line> <one line> (<severity>, ASVS <id>)

Checks run
- npm test -- --run --project api: <result>
- npm audit --omit=dev --audit-level=high: <result>
- <greps from SKILL.md with their result>

Verdict: Safe to merge | needs changes | reject
```

## Rules

- Cite a file and a line for every finding, and quote the symbol. Line numbers alone go stale. If the diff does not show enough to be sure, say what you need to read, and read it.
- Severity:
  - **blocker**: exploitable now, a control from `controls.md` weakened without a recorded decision, credentials or tokens logged, a state-changing GET, raw SQL from input, a missing ownership check.
  - **important**: a real gap that needs a condition to exploit, such as a removed session lifetime cap, no re-authentication for an email change, a forgeable rate-limit key, a missing CSP or a missing test for a new rule.
  - **nit**: hardening and hygiene.
- Every finding has an exploit scenario. If you cannot write one, it is not a finding. Move it to a question or drop it.
- Fixes follow the house rules: named constants, `ServiceError` with `HttpStatus`, Zod contracts in `packages/shared`, per-user scoping, soft delete, and a test in `apps/api/src/routes/*.test.ts`. Do not propose JWT, CSRF tokens, `SameSite=Strict`, Redis or an external identity provider as the fix. They contradict recorded decisions (see `SKILL.md`).
- Gaps that were there before the change go in their own list. They do not decide the verdict unless the change makes them exploitable or depends on them.
- The verdict is the last line of the report, with nothing after it, and reads `Verdict: ` followed by one of the three phrases exactly. Put any justification in the findings above it, never after it and never as a custom phrase such as "safe to keep". `needs changes` whenever there is at least one blocker or one important finding introduced by the change. `reject` when the approach itself is unsafe, for example tokens in `localStorage` or user ids taken from the request body.
- If no findings survive, say so, list the checks run, and give `Verdict: Safe to merge`.

## Example

```
Scope: feat/account-export, 6 files read in full
Controls checked: authenticated scope, user id source, origin check, response schemas; origin check weakened

Findings
apps/api/src/routes/accounts.ts:88 (blocker, access control, ASVS 4.2.1)
  Defect: GET /accounts/:id/export calls services.accounts.export(request.params.id) without userIdOf(request); the service query filters only by id.
  Exploit: a signed-in user obtains another user's account id (a shared screenshot, a support ticket) and downloads that user's full transaction history.
  Fix: pass userIdOf(request) and resolve through accounts.owned(userId, id) so a foreign id throws ServiceError('Account not found', HttpStatus.notFound); add a user-B case to ForeignCases in authorization.test.ts.

apps/api/src/plugins/security.ts:9 (blocker, CSRF, ASVS 4.2.2)
  Defect: SafeMethods now includes 'POST' to let the export form submit.
  Exploit: any site auto-submits a form to /api/v1/transactions; the origin check no longer runs for POST.
  Fix: revert SafeMethods; fetch the export with apiRequest from the client instead of a form post.

apps/api/src/routes/accounts.ts:95 (nit, logging, ASVS 7.1.2)
  Defect: request.log.info({ email: request.auth.user.email }, 'export started') logs an email address.
  Exploit: anyone with log access learns users' emails; logs are kept longer than the data.
  Fix: log userIdOf(request) only.

Pre-existing gaps (not introduced by this change)
- apps/api/src/auth/sessions.ts:83 resolveSession renews without an absolute cap (important, ASVS 3.3.2)

Checks run
- npm test -- --run --project api: 214 passed
- npm audit --omit=dev --audit-level=high: 0 vulnerabilities
- grep -rn "sql.raw" apps/api/src: no hits

Verdict: needs changes
```

The example's file names, line numbers and test counts are illustrative. Report the real ones.
