---
name: node-diagnostics
description: Diagnoses runtime problems in CoinKeeper's Node 24 code (apps/api, packages/shared, the Vitest suite) and decides when caching or streaming is allowed. Covers Vitest 5 runs that hang or never exit, flaky tests on PGlite, processes that do not stop, memory leaks and heap growth, CPU profiling with --cpu-prof and --heap-prof on the built API, load tests with autocannon, async patterns (Promise.all against the pg pool, transactions, AbortSignal), caching rules (never cache ledger balances, reports or budgets across requests) and streams for CSV import and export. Use when the user says tests hang, "did not exit", time out, pass alone but fail together, are flaky, the API is slow, uses too much memory or CPU, or asks whether to add a cache or a stream. Not for writing endpoints, timeouts or shutdown code (use fastify-api), slow SQL, indexes or EXPLAIN plans (use database-change), flaky Playwright specs (use e2e-playwright) or slow React screens (use react-client-patterns).
---

# Node diagnostics

Find the cause before changing code. Every workflow here ends with evidence: a handle that stays open, a test that fails on repeat, a profile that shows the hot function, a heap that grows. Advice written for `node --test`, `tap` or Jest does not apply as-is: the suite is Vitest 5 with projects (`api`, `web`, `shared`, `tooling`), the API tests run on PGlite, and the API runs as a tsup bundle (`apps/api/dist/server.js`) with source maps.

## Before you start

- Read `agents/conventions.md` › Tests and `docs/architecture/testing.md` for how the suites are built.
- For API code, `agents/architecture.md` › Core rules: the ledger is the truth, so "fix it with a cache" is usually the wrong answer.
- Keep scratch output (profiles, heap snapshots, logs, load-test results) under `temp/<task>/`; never commit it or link to it.

## Workflow

1. **Name the symptom** and pick the matching path:

   | Symptom                                                                            | Path                                                                                                                        |
   | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
   | `npm test -- --run` finishes the tests but the process never exits                 | [hanging-and-flaky-tests.md](references/hanging-and-flaky-tests.md) › Hanging runs                                          |
   | a test passes alone, fails in the full run, or fails now and then                  | [hanging-and-flaky-tests.md](references/hanging-and-flaky-tests.md) › Flaky tests                                           |
   | the dev API, a CLI (`migrate`, `user:reset-password`) or a container does not stop | [stuck-processes-and-leaks.md](references/stuck-processes-and-leaks.md) › Stuck processes                                   |
   | memory grows across requests or test files                                         | [stuck-processes-and-leaks.md](references/stuck-processes-and-leaks.md) › Memory leaks                                      |
   | an endpoint or helper is slow, CPU is high                                         | [profiling.md](references/profiling.md)                                                                                     |
   | "should this be parallel / cached / streamed?"                                     | [async-patterns.md](references/async-patterns.md), [caching.md](references/caching.md), [streams.md](references/streams.md) |

2. **Reproduce narrowly.** One project, one file, one test name: `npx vitest run --project api apps/api/src/routes/ledger.test.ts -t "<name>"`. For the API, reproduce against the built bundle (`npm run build -w @coinkeeper/api`), not `tsx watch`.
3. **Collect evidence** with the tool the reference names (hanging-process reporter, `--repeats`, `--cpu-prof`, heap snapshot, autocannon). Save it under `temp/<task>/`.
4. **Fix the cause in the scope that created it**: close what you open in the same `beforeAll`/`afterAll` pair, move work out of a hot loop, batch queries. Do not raise timeouts, add retries or add `--no-file-parallelism` to the config as the fix; those are diagnostic switches.
5. **Prove it**: repeat the narrow run (`--repeats`), then the full gate. A flaky test is fixed only when it survives repeated and shuffled runs.
6. **Record what changed** in the tests or docs if the cause was a pattern others will hit (see Keep the docs true).

## Hard rules

- Never cache balances, net worth, reports or budgets across requests, in memory or in a column. They are SQL over `transactions` (`agents/architecture.md` rules 2 and 8).
- Anything cached across requests that contains user data is keyed by `userId`, bounded, invalidated on write and tested for cross-user isolation. Default answer: do not cache in the API; TanStack Query already caches in the browser.
- Parallel queries each take a connection from the `pg` pool (`max` 10 in `apps/api/src/db/index.ts`); queries inside one `db.transaction` share one connection and must be awaited in sequence.
- A diagnostic dependency (`why-is-node-running`, `autocannon`) runs with `npx` for the investigation; it is added to `package.json` only by an explicit decision.
- Code you change still follows the house rules: named constants for timeouts and sizes, no comments, arrow functions, `ServiceError` for failures.

## References

| File                                                                    | Read it when                                                                           |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [hanging-and-flaky-tests.md](references/hanging-and-flaky-tests.md)     | Vitest hangs, times out, or a test is order- or time-dependent.                        |
| [stuck-processes-and-leaks.md](references/stuck-processes-and-leaks.md) | A Node process does not exit, or memory keeps growing.                                 |
| [profiling.md](references/profiling.md)                                 | Something is slow: CPU profiles, heap profiles, load tests.                            |
| [async-patterns.md](references/async-patterns.md)                       | Choosing between sequential and parallel awaits, bounding concurrency, canceling work. |
| [caching.md](references/caching.md)                                     | Someone proposes a cache or memoization in the API or `packages/shared`.               |
| [streams.md](references/streams.md)                                     | CSV import or export, or any payload that could outgrow memory.                        |
| [source.md](references/source.md)                                       | Checking where an idea came from and what was changed from upstream.                   |

## Verify

```bash
npx vitest run --project api --repeats 20 <file>
npm run lint && npm run typecheck && npm test -- --run && npm run build
```

For performance work, also compare the before and after numbers from the same profiling or load-test command and report both.

## Keep the docs true

If the fix changes how tests are written (a new teardown helper, a fixture, a Vitest option in `vitest.config.mts` or `apps/api/vitest.config.mts`), update `docs/architecture/testing.md` and `agents/conventions.md` › Tests; `agents/docs-map.md` lists the rest. A performance change that alters behavior (pagination, limits) updates the feature page and `docs/reference/rest-api.md`.
