# Stuck processes and memory leaks

> Summary: how to find what keeps a CoinKeeper Node process alive (API, CLIs, container) and how to prove and locate a memory leak with Node 24's built-in tools, including the Windows caveats for signal-based tools.

## Stuck processes

A Node process exits when nothing keeps the event loop alive. Something that should exit and does not has an open handle: a server socket, a keep-alive connection, a `pg` pool, a PGlite client, a timer, a readline prompt, a child process.

| Process                        | What must close                                          | Where it closes                                                                                                                                         |
| ------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API (`apps/api/src/server.ts`) | Fastify server, the hourly purge interval, the `pg` pool | signal handler: `clearInterval`, then `shutDown` (`shutdown.ts`): `app.close()`, then the pool, within `SHUTDOWN_TIMEOUT_MS` (8 s), then `process.exit` |
| `node dist/cli/migrate.js`     | the pool                                                 | `finally { await close(); }` in `cli/migrate.ts`                                                                                                        |
| `npm run user:reset-password`  | the readline prompt, the pool                            | `finally` blocks in `cli/reset-password.ts`                                                                                                             |
| API tests                      | Fastify instance, PGlite                                 | `await context.close()` in `afterAll`                                                                                                                   |
| API container                  | the Node process must receive `SIGTERM`                  | `tini` is PID 1 and runs `node dist/server.js` directly (`Dockerfile`); a `CMD` under `sh -c` would never deliver it                                    |

Steps:

1. Find the open resources. In any Node 24 process, `process.getActiveResourcesInfo()` returns the resource types keeping it alive (`TCPServerWrap`, `TCPSocketWrap`, `Timeout`, `FSReqCallback`, …). Log it temporarily just before the point where the process should exit; remove the log afterwards.
2. For tests, prefer Vitest's `--reporter=hanging-process` (see `hanging-and-flaky-tests.md`).
3. `why-is-node-running` (via `npx`, not a dependency) prints stacks of the code that created each handle. It is triggered with `SIGUSR1`, which Windows does not have; on Windows use step 1 or the inspector.
4. With the inspector (`node --inspect …`, then `chrome://inspect`), pause the idle process and look at the async stack of the remaining handles.
5. Close the resource where it was created. A missing `await` on `app.close()` or `pool.end()` looks exactly like a leak.

Because `shutDown` has a deadline, the API no longer hangs on stop: when something blocks `app.close()` or the pool, it logs `Shutdown failed` ("Shutdown did not finish within 8000 ms") and exits `1`. Treat that line as the symptom and find the handle with the steps above; do not raise the deadline. Graceful shutdown itself (the deadline, exit codes, and the missing fatal-event handling) belongs to the fastify-api skill (`references/production.md` › Graceful shutdown).

## Memory leaks

Prove growth before hunting it. A heap that rises during a load test and falls back after garbage collection is not a leak; a heap whose floor rises after every round is.

### Run the API so it can be inspected

```bash
npm run build -w @coinkeeper/api
cd apps/api
node --inspect --enable-source-maps dist/server.js
```

Run from `apps/api`: `environment.ts` resolves the repository `.env` relative to the working directory. Sign up a throwaway account (`POST /api/v1/auth/sign-up` with `Origin: http://localhost:3000`) and keep the cookie for load.

### Find what grows

1. Open `chrome://inspect` → the Node target → Memory.
2. Take a heap snapshot, run a fixed load (for example 2 000 requests with autocannon, see `profiling.md`), force garbage collection from the panel, take a second snapshot; repeat once more.
3. Compare snapshots 2 and 3 with "Objects allocated between snapshots" and sort by retained size. Follow the retainer chain to the module, closure or listener that holds the objects.
4. Without the inspector: `node --heap-prof dist/server.js` writes a sampling heap profile (`.heapprofile`) on exit; `--heapsnapshot-near-heap-limit=2` writes snapshots when the heap approaches its limit. Save them under `temp/<task>/` and open them in the same DevTools panel.
5. In tests, `npx vitest run --project api --logHeapUsage` shows the heap after each test; growth across files usually means a PGlite or Fastify instance was not closed.

### Likely sources in this codebase

| Source                                                                            | Check                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| module-level `Map`, array or object that grows per request or per user            | Known safe ones: the memoized reference hash in `auth/passwords.ts` (constant size) and the `Intl.NumberFormat` cache in `packages/shared/src/lib/money.ts` (one entry per locale, currency and sign option). Anything new is bounded or removed.                                                                           |
| the per-account sign-in throttle                                                  | `createSignInThrottle` keeps a `Map` of failure windows per normalized email, capped at `MAX_TRACKED_ACCOUNTS` (10 000) and evicting expired windows first; it grows with distinct failing emails, not requests.                                                                                                            |
| listeners added per request (`process.on`, `emitter.on` inside a handler or hook) | Listeners belong at startup; per-request work uses `request.signal` or `onRequestAbort`.                                                                                                                                                                                                                                    |
| timers created per request and never cleared                                      | Every `setTimeout` in a request path is cleared in `finally` or tied to `request.signal`.                                                                                                                                                                                                                                   |
| large strings kept alive by closures                                              | CSV import bodies are up to `FieldLengths.importCsv` characters (2 000 000) plus JSON overhead; do not store them on long-lived objects.                                                                                                                                                                                    |
| unbounded in-process caches                                                       | See `caching.md`: bounded, keyed, invalidated, or not at all.                                                                                                                                                                                                                                                               |
| the `@fastify/rate-limit` in-memory store                                         | Bounded by the plugin; grows with distinct client IPs. `TRUST_PROXY` defaults to `false` and rejects `true`, so the key is the connection address unless a listed proxy forwards another; a config that trusts too wide a range makes it attacker-controlled. Report that to api-security-review rather than tuning memory. |

### After the fix

Repeat the same snapshot and load sequence and report the before and after floor. Keep the snapshots out of Git.
