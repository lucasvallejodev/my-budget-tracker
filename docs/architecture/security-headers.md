# Security headers

> Summary: the HTTP security headers CoinKeeper sends on pages and API responses, the Content Security Policy that runs in report-only mode, why it is static instead of nonce-based, and how to move it to enforcement.

Two layers set headers. Next.js adds them to every page it serves (`apps/web/next.config.ts`), and `@fastify/helmet` adds them to every API response (`apps/api/src/plugins/security.ts`). API responses reach the browser through the Next.js `/api/*` rewrite with the API's own headers, so each layer covers only its own responses.

## Page headers

`next.config.ts` sends these on `/:path*`:

| Header                                | Value                             | Effect                                                                     |
| ------------------------------------- | --------------------------------- | -------------------------------------------------------------------------- |
| `X-Frame-Options`                     | `DENY`                            | Old browsers refuse to show the app inside a frame (clickjacking).         |
| `Content-Security-Policy`             | `frame-ancestors 'none'`          | Enforced. Modern browsers refuse to show the app inside a frame.           |
| `Content-Security-Policy-Report-Only` | the policy below                  | Not enforced. The browser reports what the policy would block.             |
| `X-Content-Type-Options`              | `nosniff`                         | The browser uses the declared content type and never guesses one.          |
| `Referrer-Policy`                     | `strict-origin-when-cross-origin` | Other sites see only the origin of a link, never the path or query string. |

## The report-only policy

The report-only policy is the full Content Security Policy the app will enforce. Each directive and the reason for its value:

| Directive     | Value                                                        | Why                                                                                                                                            |
| ------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `default-src` | `'self'`                                                     | Anything not listed below loads only from the app's own origin.                                                                                |
| `script-src`  | `'self' 'unsafe-inline'`, plus `'unsafe-eval'` in `next dev` | Next.js ships inline bootstrap scripts with every page. React needs `eval` in development only, for its debugging stacks.                      |
| `style-src`   | `'self' 'unsafe-inline'`                                     | Compiled SCSS comes from the app, and some screens set inline style attributes: category group colors, Radix popover positioning and Recharts. |
| `img-src`     | `'self'`                                                     | Icons are inline SVG and the app loads no remote images.                                                                                       |
| `font-src`    | `'self'`                                                     | `next/font` downloads Inter at build time and serves it from the app.                                                                          |
| `connect-src` | `'self'`                                                     | The client calls only `/api/v1/…` on its own origin.                                                                                           |
| `object-src`  | `'none'`                                                     | No plugins or embedded objects.                                                                                                                |
| `base-uri`    | `'self'`                                                     | An injected `<base>` tag cannot redirect relative URLs to another site.                                                                        |
| `form-action` | `'self'`                                                     | An injected form cannot post data to another site.                                                                                             |

`frame-ancestors` is not part of the report-only policy because browsers ignore it there. It stays in the enforced header.

`upgrade-insecure-requests` is left out on purpose. Local development and the default Compose setup serve plain HTTP, where the directive would rewrite same-origin requests to HTTPS and break them. Add it at the TLS edge instead.

### Why static and not a nonce

Next.js can give each response a fresh nonce and allow only scripts that carry it, which is stronger than `'unsafe-inline'`. It has a cost: a nonce exists only in a response rendered for that request, so every page would lose static prerendering and render on each request. The static policy keeps prerendering and still blocks scripts from other hosts, plugins, `<base>` injection and form hijacking. It does not block an injected inline script, so escaping user input in React stays the first defense.

Do not add a `sha256-…` hash to `script-src` for a single inline script: when a directive contains a hash or a nonce, browsers ignore its `'unsafe-inline'`, which would block the Next.js bootstrap scripts.

### Checking for violations

The browser logs every report-only violation to its console as a message containing "Content Security Policy". No report endpoint collects them yet. `e2e/content-security-policy.spec.ts` checks the headers and fails when any main screen logs a violation ([Testing › End to end](testing.md#end-to-end)). To check by hand, run the production build and read the headers:

```bash
npm run build && npm run start
curl -sI http://localhost:3000/sign-in
```

The development server sends the same policy with `'unsafe-eval'` added to `script-src`.

### Moving to enforcement

1. Keep the policy in report-only mode for at least one release, and open every screen, including dialogs, pickers and charts, with the browser console open.
2. When nothing is reported, rename the header to `Content-Security-Policy` in `next.config.ts` and add `frame-ancestors 'none'` to the directive list, replacing the separate enforced header.
3. Update the end-to-end test to expect the enforced policy, and update this page.

## API headers

`@fastify/helmet` runs with its defaults except the Content Security Policy, which is replaced by `default-src 'none'; frame-ancestors 'none'`: the API answers JSON, so a response rendered as a page may load nothing and may not be framed. The Swagger UI at `/api/docs` (when `API_DOCS` is on) sends its own policy instead (`staticCSP` in `apps/api/src/plugins/openapi.ts`): scripts, styles, fonts and images from its own origin only, `data:` for fonts and images, no framing. Swagger UI tries to add one inline style, which that policy blocks without visible effect. `apps/api/src/app.test.ts` asserts both policies. Helmet's defaults include `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` and the cross-origin resource and opener policies. `apps/api/src/routes/auth.test.ts` asserts part of this set.

`Strict-Transport-Security` only takes effect over HTTPS, so the reverse proxy that terminates TLS in production should set it for pages too. See [API service › Who can reach the API](api.md#who-can-reach-the-api-and-what-stops-them) for the rest of the API's access layers.
