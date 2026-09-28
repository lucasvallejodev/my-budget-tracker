# CSP and security headers

> Summary: how to review changes to CoinKeeper's page and API security headers: the enforced frame policy and the static report-only Content-Security-Policy in next.config.ts, the API's own `default-src 'none'` policy and the separate Swagger UI policy, why a nonce was rejected, the inline-script and inline-style traps, the steps to enforcement, and how the headers are tested.

## What exists

- Pages: `apps/web/next.config.ts` sends `SecurityHeaders` on `/:path*`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, an enforced `Content-Security-Policy: frame-ancestors 'none'`, and `Content-Security-Policy-Report-Only` built from `ReportOnlyPolicyDirectives`.
- The report-only policy: `default-src 'self'`; `script-src 'self' 'unsafe-inline'` (plus `'unsafe-eval'` when `isDevelopment`, through `DevelopmentScriptSources`); `style-src 'self' 'unsafe-inline'`; `img-src`, `font-src` and `connect-src 'self'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`. It has no `frame-ancestors` (browsers ignore it in report-only) and no `upgrade-insecure-requests` (local and default Compose run on plain HTTP).
- API: `apps/api/src/plugins/security.ts` registers `@fastify/helmet` with `ApiContentSecurityPolicy`: `default-src 'none'; frame-ancestors 'none'` with `useDefaults: false`, so a JSON response can load nothing and cannot be framed. Helmet's other defaults apply (HSTS, `nosniff`, frame options, cross-origin policies).
- API docs: Swagger UI at `/api/docs` (only when `config.docs`, off in production by default) gets its own policy through `staticCSP: DocsContentSecurityPolicy` in `apps/api/src/plugins/openapi.ts`: `default-src`, `script-src` and `style-src` `'self'`, `'self'` plus `data:` for images and fonts, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri` and `form-action 'self'`, and no `'unsafe-inline'`.
- API tests: `app.test.ts` › content security policy asserts the exact API policy and that the docs policy allows `script-src 'self'`, keeps `frame-ancestors 'none'` and has no `unsafe-inline`; `auth.test.ts` asserts the other helmet headers.
- `/api/*` responses reach the browser through the Next.js rewrite and keep the API's headers. Page documents carry only the Next.js headers.
- Tests: `e2e/content-security-policy.spec.ts` checks both page headers and fails when a main screen logs a "Content Security Policy" console message (owned by the e2e-playwright skill).
- Human docs: `docs/architecture/security-headers.md`, including the directive table and the steps to enforcement.

## The recorded decision

| Option                                 | Status                                                                                                                                                                                                                            |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Static policy in `next.config.ts`   | Chosen, shipped report-only first. Keeps static prerendering; blocks foreign script hosts, plugins, `<base>` injection and form hijacking. It does not stop an injected inline script, so React escaping stays the first defense. |
| B. Nonce per request in `src/proxy.ts` | Rejected: a nonce exists only in a response rendered for that request, so every page would lose static prerendering. Reopen only with a measured cost and a recorded decision.                                                    |
| C. Hashes or SRI for Next.js scripts   | Not used: experimental in Next.js. Check its status in the installed version before proposing it.                                                                                                                                 |

Do not report "no nonce" or "`'unsafe-inline'` in `script-src`" as a finding on its own; it is the decision. Report a change that weakens the policy (a new host, `'unsafe-eval'` outside development, dropping `object-src`, `base-uri` or `form-action`) or one that breaks it (a new third-party script, a remote image or font without a matching directive).

## Moving to enforcement

The steps are in `docs/architecture/security-headers.md` › Moving to enforcement: at least one release in report-only with every screen, dialog, picker and chart opened; then rename the header to `Content-Security-Policy`, add `frame-ancestors 'none'` to the directive list in place of the separate enforced header, and update `e2e/content-security-policy.spec.ts` and the docs page in the same change. A pull request that enforces the policy without those three is **important**.

## Traps

- **A hash or nonce disables `'unsafe-inline'`.** In CSP Level 3, a nonce or hash in a directive makes browsers ignore `'unsafe-inline'` in that directive. A `sha256-…` hash added to `script-src` for one inline script blocks the Next.js bootstrap scripts; a nonce in `style-src` breaks inline style attributes (group colors, Radix positioning, Recharts). For styles under a nonce policy, split into `style-src-elem 'self' 'nonce-…'` and `style-src-attr 'unsafe-inline'`.
- **Inline theme script.** When the react-client-patterns skill adds the theme boot script to `apps/web/src/app/layout.tsx` (`rendering-hydration-no-flicker`), `'unsafe-inline'` in the static policy already covers it. Do not add its hash, for the reason above.
- **Development differs.** `next dev` sends `'unsafe-eval'`; check headers on `npm run build && npm run start`, not on the development server.
- **Matcher scope.** `apps/web/src/proxy.ts` excludes `api/`, `_next/` and static files through its inline `matcher` literal, which must stay a literal. Headers set in `next.config.ts` reach every path; a policy moved into `proxy` would reach documents only.
- **`frame-ancestors` only works as an enforced header.** It is ignored in a `<meta>` tag and in report-only. Keep the enforced header, and keep `X-Frame-Options: DENY` for old browsers.
- **HSTS belongs at the TLS edge**, not in `next.config.ts`: browsers ignore HSTS over plain HTTP, and local development runs on plain HTTP. `container-hardening` sets it in the proxy.
- **Optional extras.** `Permissions-Policy` (camera, microphone, geolocation and payment off) and `Cross-Origin-Opener-Policy: same-origin` on pages are defense in depth: a **nit** when missing.
- **API CSP.** The JSON API sends `default-src 'none'; frame-ancestors 'none'`, and the docs routes have their own policy. A change that sets `contentSecurityPolicy: false`, turns `useDefaults` back on with looser directives, or adds `'unsafe-inline'` to the docs policy to make a Swagger UI upgrade work is **important**; fix the docs policy for the specific resource instead.

## How to check

- `npm run build && npm run start`, then `curl -sI http://localhost:3000/sign-in | grep -i content-security` shows both headers.
- `npx playwright test e2e/content-security-policy.spec.ts` (the e2e-playwright skill owns it). A new screen goes into its `ScreenPaths`.
- API headers stay asserted in `apps/api/src/routes/auth.test.ts` and `apps/api/src/app.test.ts` (`npx vitest run --project api src/app.test.ts`).
