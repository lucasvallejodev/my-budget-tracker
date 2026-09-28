# Profiling and load testing

> Summary: how to measure a slow CoinKeeper endpoint or helper: run the built API with --cpu-prof or --heap-prof, drive it with autocannon under a signed-in session, profile a Vitest file, micro-benchmark a shared helper, and read the results against the hot spots this codebase is known for.

## Rules of the measurement

- Measure the built bundle (`apps/api/dist/server.js`), not `tsx watch`: the transpiler and watcher distort profiles.
- Use the same data, the same request and the same load for before and after; report both numbers (requests per second, p50, p99, CPU time of the hot function).
- Keep profiles and results in `temp/<task>/`.
- Slow SQL (sequential scans, missing indexes, N+1 queries) shows up as time waiting, not as JavaScript CPU. If the profile is mostly idle while the request is slow, switch to the database-change skill and `EXPLAIN (ANALYZE, BUFFERS)`.

## CPU profile of the API

```bash
npm run build -w @coinkeeper/api
cd apps/api
node --cpu-prof --cpu-prof-dir=../../temp/<task>/profiles --enable-source-maps dist/server.js
```

Drive load (below), then stop the server with Ctrl+C: the signal handler exits through `process.exit`, and Node writes the `.cpuprofile` on exit. Open it in Chrome DevTools (Performance panel, "Load profile") and read the bottom-up view; source maps map frames back to `src/`.

For a heap allocation profile use `--heap-prof --heap-prof-dir=…` the same way (see `stuck-processes-and-leaks.md` for leak hunting).

## Load with autocannon

`autocannon` runs through `npx`; it is not a dependency.

1. Sign up a throwaway account against the running API (`POST /api/v1/auth/sign-up`, header `Origin: http://localhost:3000`, password 12 to 128 characters) and copy the session cookie from the response. Never use real credentials.
2. Seed enough data for the scenario through the API (accounts, a CSV import) so lists and reports do real work.
3. Run a fixed load, for example 10 connections for 20 seconds against a read endpoint:

```bash
npx autocannon -c 10 -d 20 -H "cookie=ck_session=<token>" http://127.0.0.1:4000/api/v1/transactions?limit=2000
```

Check `npx autocannon --help` for the header syntax of the installed version. Writes also need `-H "origin=http://localhost:3000"` (the origin check rejects writes without an allowed origin) and a body.

- Do not load-test sign-in or sign-up without raising `AUTH_ATTEMPTS_PER_MINUTE` in your local `.env`: the per-route rate limit answers `429` after 10 attempts per minute and you will measure the limiter. Failed sign-ins also hit the per-account throttle (`SIGN_IN_FAILURES_PER_ACCOUNT`, 10 per 15 minutes), so load-test with correct passwords.
- A `503 UNAVAILABLE` under load means a request ran past `HANDLER_TIMEOUT_MS` (20 s by default) or its query past the pool's `statement_timeout`; count them in the results instead of raising the timeout.
- The API listens on `127.0.0.1:4000` in development; the web app's rewrite adds a hop, so load the API directly unless the proxy is what you are measuring.

## Profile a test or a helper

- A slow Vitest file: `npx vitest run --project api --no-file-parallelism --execArgv=--cpu-prof --execArgv=--cpu-prof-dir=temp/<task>/profiles <file>` writes one profile per worker.
- A pure helper in `packages/shared/src/lib/` (money, CSV, dates): write a throw-away `*.bench.ts` under `temp/<task>/` or next to the helper without committing it, and run `npx vitest bench --project shared <file>`. Committing benchmarks is a separate decision (they are not part of the gate).

## Known hot spots

| Where                                                                 | Why it is expensive                                                                                                                | What to measure first                                                              |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| response serialization of large lists                                 | the Zod `serializerCompiler` parses every response before `JSON.stringify`; transaction pages go up to `MAX_PAGE_SIZE` (2000) rows | time in Zod frames for `GET /transactions?limit=2000`; compare with a smaller page |
| sign-in and sign-up                                                   | argon2id with 19 MiB per hash in `@node-rs/argon2` (native threads, so it looks like idle time in a JS profile)                    | latency and CPU usage of the process under a burst, not the JS profile             |
| dashboard (`routes/reports.ts`)                                       | seven queries in parallel per request, each on its own pool connection (`max` 10)                                                  | p99 with 5 to 10 concurrent dashboard loads; pool wait shows as idle               |
| CSV import preview and commit (`modules/import/`)                     | up to 2 000 000 characters parsed in memory by `parseCsv`; the commit is one transaction with chunked set-based writes             | time in `parseCsv` and matching versus time waiting on the transaction             |
| budgets and converted totals (`modules/budgets/`, `modules/reports/`) | now one grouped spending query (`categorySpending`) and one rate lookup (`fx.getRates`) per request, whatever the currency count   | number of queries per request (log them) to confirm no per-currency loop came back |

## Event loop health

For a quick check without a profiler, `monitorEventLoopDelay()` from `node:perf_hooks` gives the event loop delay histogram; a p99 above a few tens of milliseconds under load means synchronous work is blocking other requests. Anything CPU-bound that cannot be made cheaper (large CSV parsing) is a candidate for a worker thread only after measurement and an explicit decision.
