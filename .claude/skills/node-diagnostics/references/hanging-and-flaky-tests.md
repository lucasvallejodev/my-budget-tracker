# Hanging and flaky Vitest runs

> Summary: how to find what keeps a Vitest 5 run alive and how to pin down order-, time- and data-dependent tests in CoinKeeper's projects (api on PGlite, web on jsdom, shared, tooling), with the exact commands and the usual causes in this repository.

## Command kit

| Goal                                    | Command                                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| one project                             | `npx vitest run --project api`                                                  |
| one file, one test                      | `npx vitest run --project api apps/api/src/routes/ledger.test.ts -t "restores"` |
| list open handles when it will not exit | `npx vitest run --project api --reporter=hanging-process`                       |
| report async resources a file leaks     | `npx vitest run --project api --detectAsyncLeaks <file>`                        |
| repeat to expose flakiness              | `npx vitest run --project api --repeats 30 <file>`                              |
| random order, replayable                | `npx vitest run --sequence.shuffle --sequence.seed 1234`                        |
| remove file parallelism (diagnosis)     | `npx vitest run --no-file-parallelism` or `--maxWorkers 1`                      |
| fail fast                               | `--bail 1`                                                                      |
| heap per test                           | `--logHeapUsage`                                                                |
| debugger                                | `npx vitest run --project api --inspect-brk --no-file-parallelism <file>`       |

`npm test` is `vitest` (watch mode); always add `--run` (or use `npx vitest run`) when diagnosing. Defaults to remember: `testTimeout` 5000 ms, `hookTimeout` 10000 ms, `teardownTimeout` 10000 ms, pool `forks`, files isolated and run in parallel.

`--retry`, `--no-file-parallelism` and bigger timeouts are diagnostic switches. Do not commit them to `vitest.config.mts` or `apps/api/vitest.config.mts` as the fix.

## Hanging runs

Symptom: every test passes, then the run prints a close timeout or waits until CI kills it.

1. Isolate the project, then the file (`--project api`, then one path). If only the full run hangs, bisect the file list.
2. Run with `--reporter=hanging-process` and read which handle is open (a socket, a timer, a child process, a file handle) and which file created it. `--detectAsyncLeaks` points at the test file that leaked.
3. Fix the teardown in the same scope that created the resource, then repeat the file 20 to 30 times.

Usual causes here:

| Cause                                                                                                 | Fix                                                                                                 |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `createTestApp()` without `await context.close()` in `afterAll`                                       | `close()` closes Fastify and the PGlite client; keep the `beforeAll` / `afterAll` pair together.    |
| `createTestDatabase()` in a service test without `await database.close()`                             | Same: every PGlite instance is closed in the file that opened it.                                   |
| a file that calls `buildApp` itself (as `app.test.ts` and `plugins/logging.test.ts` do)               | Close both in `afterAll`: `await app.close()` and `await database.close()`.                         |
| a new `setInterval` / `setTimeout` inside code under test (for example a purge moved into `buildApp`) | Clear it in an `onClose` hook, or keep timers in `server.ts` where tests never start them.          |
| `vi.useFakeTimers()` without `vi.useRealTimers()`                                                     | Restore in `afterEach`; fake only what you need (`vi.useFakeTimers({ toFake: ['Date'] })`).         |
| an unawaited promise that finishes after the test (fire-and-forget `.catch`)                          | Await it, or return it from the helper; `@typescript-eslint/no-floating-promises` flags most cases. |
| a server started with `app.listen()` in a test                                                        | Use `app.inject` (our helpers do); `listen` is only for manual runs.                                |

## Timeouts that are not hangs

- The first PGlite start and the migrations take seconds. Existing files pass `30000` to `beforeAll` (`routes/catalog.test.ts`, `modules/services.test.ts`); a new file that creates PGlite does the same.
- `signUp()` hashes a password with argon2id (19 MiB) for each user in `beforeEach`. Two users per test is fine; a loop that signs up dozens of users will hit `testTimeout`. Create extra data through services (`insertUser` in service tests) instead.
- A single test that needs more time gets a per-test timeout argument with a named reason in its title, not a global increase.

## Flaky tests

Reproduce first: `--repeats 30` on the file, then `--sequence.shuffle` with a fixed `--sequence.seed` so a failing order can be replayed.

| Pattern                             | Where it bites in CoinKeeper                                                                                                                                                                                             | Fix                                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Time**: the code reads the clock  | reports default `month` to `toIsoMonth(new Date())` (`routes/reports.ts`); accounts default `openingDate` to today; soft delete and sessions stamp `new Date()`                                                          | Pass explicit dates and months in tests, or `vi.useFakeTimers({ toFake: ['Date'] })` with `vi.setSystemTime`; test month and year boundaries on purpose. |
| **Order within a list**             | rows with the same date, or sorted by random UUIDs                                                                                                                                                                       | Assert with `toEqual(expect.arrayContaining(…))` or sort in the test; if the API order matters, add a tiebreak in the service.                           |
| **State shared between tests**      | a variable filled in one `it` and read in another; data created in `beforeAll` and mutated by tests                                                                                                                      | Build per-test data in `beforeEach` after `context.database.reset()`; never depend on another test having run.                                           |
| **Truncate does not reach a table** | `reset()` runs `TRUNCATE users CASCADE`; a table without a foreign key to `users` survives between tests                                                                                                                 | Give per-user tables their `user_id` foreign key (they have it today); a new global table needs its own cleanup.                                         |
| **In-memory limits survive reset**  | the per-account sign-in throttle (`auth/sign-in-throttle.ts`) and the `@fastify/rate-limit` counters live in the app instance, not the database, so failed sign-ins in one test count against the same email in the next | Use a unique email per test that fails sign-ins on purpose, or build a separate app for that test; do not rely on `reset()` to clear them.               |
| **Async UI**                        | component tests reading before a query or mutation settles                                                                                                                                                               | `await screen.findBy…`, `vi.waitFor`, `expect.poll`; never sleep. Details belong to react-client-patterns.                                               |
| **Resource contention**             | CPU-heavy files (argon2, PGlite) running in parallel on a small CI runner                                                                                                                                                | Confirm with `--maxWorkers 1`; then reduce the work (fewer sign-ups) rather than serialising the suite.                                                  |

What PGlite cannot tell you: it is one in-process connection, so races between concurrent transactions, `FOR UPDATE` contention and advisory-lock behavior never show up. A test that "proves" a concurrency fix on PGlite proves nothing; say so and test against PostgreSQL 17 (database-change covers that).

## Definition of done

1. The cause is named (handle, shared state, clock, order, contention).
2. The fix is in the scope that created the problem.
3. The file passes `--repeats 30` and a shuffled full run of its project.
4. The full gate passes: `npm run lint && npm run typecheck && npm test -- --run && npm run build`.
