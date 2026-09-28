# Configuration

> Summary: how the API reads its environment (one Zod schema in config.ts with cross-field checks, a typed AppConfig on app.config), the variables in use and their defaults, the steps to add a variable (compose passes each one explicitly), and the rules for NODE_ENV, defaults and secrets.

## Where configuration lives

- `apps/api/src/config.ts`: `environmentSchema` (Zod) validates the raw environment; `loadConfig(environment = process.env)` returns a typed `AppConfig`. Empty strings count as unset (`withoutEmptyValues`).
- `apps/api/src/environment.ts`: `openRuntime()` loads the repository-root `.env` with `dotenv` (development), calls `loadConfig()`, opens the database and refuses to start without `DATABASE_URL`.
- `buildApp` decorates the instance with it: code reads `app.config.<name>` (or `request.server.config`), never `process.env`. Tests pass values through `createTestApp({ NAME: 'value' })`, which calls `loadConfig` with test defaults.
- Variables in use: `ALLOWED_ORIGINS`, `API_DOCS`, `API_HOST`, `API_PORT`, `AUTH_ATTEMPTS_PER_MINUTE`, `COOKIE_SECURE`, `CORS_ORIGINS`, `DATABASE_URL`, `HANDLER_TIMEOUT_MS`, `LOG_LEVEL`, `NODE_ENV`, `SESSION_DAYS`, `SESSION_MAX_AGE_DAYS`, `SIGN_IN_FAILURES_PER_ACCOUNT`, `TRUST_PROXY`. The web app reads `API_URL` at build time (`apps/web/next.config.ts`), not the API.
- `environmentSchema` is wrapped in `checkedEnvironmentSchema` for rules that span variables (`SESSION_MAX_AGE_DAYS >= SESSION_DAYS`, message in `SESSION_MAX_AGE_ERROR`). Put a new cross-field rule there, with its own named message and `path`.

| Variable                       | Default                  | Parsed as                                                                                                                                                           |
| ------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HANDLER_TIMEOUT_MS`           | `20000` (1000 to 120000) | Fastify `handlerTimeout`; also derives `connectionTimeout` in `app.ts` and the pool's `statement_timeout` (`statementTimeoutFor` in `db/index.ts`)                  |
| `SESSION_DAYS`                 | `30` (1 to 365)          | sliding session lifetime                                                                                                                                            |
| `SESSION_MAX_AGE_DAYS`         | `90` (1 to 365)          | absolute cap from the session's `created_at`; must be at least `SESSION_DAYS`                                                                                       |
| `SIGN_IN_FAILURES_PER_ACCOUNT` | `5` (1 to 100)           | wrong passwords per account before attempts are slowed, 1 s growing to 5 s apart; never a lock (`auth/sign-in-throttle.ts`)                                         |
| `TRUST_PROXY`                  | `false`                  | `false` or a comma list of addresses, CIDR ranges or `loopback`, `linklocal`, `uniquelocal` (`isProxyAddress`); `true` and hop counts fail with `TRUST_PROXY_ERROR` |

## Adding a variable

1. Add it to `environmentSchema` in `config.ts`, sorted, with a default expressed as a named constant (`DEFAULT_…`) and bounds (`.int().positive()`, `.max(MAX_…)`). Use `z.coerce.number()` for numbers, `z.stringbool()` for flags, `commaList` for lists, `z.enum(…Values)` for choices.
2. Add the camelCase field to `AppConfig` and map it in `loadConfig`. Derive values there (for example `sessionCookieName` from `cookieSecure`), not at the call site.
3. Test the default and an override in `apps/api/src/config.test.ts` (it calls `loadConfig` with a plain object).
4. Add it to `.env.example` and to the table in `docs/architecture/api.md` › Configuration; `docs/getting-started/setup.md` and `README.md` when setup changes. `docker-compose.yml` has no `env_file`: the `api` service lists each variable under `environment:` (`NAME: ${NAME:-}`), so a variable missing there never reaches the container. An empty value counts as unset and falls back to the default in `config.ts`.

## Rules

- **One explicit variable per behavior.** `NODE_ENV` may pick a default and nothing else, and only inside `loadConfig`: `cookieSecure = COOKIE_SECURE ?? production`, `docs = API_DOCS ?? !production`. Do not write `if (process.env.NODE_ENV === 'production')` anywhere in the code.
- **Fail at start, not at first use.** A value the API cannot run without is validated in the schema or checked in `openRuntime` with a clear message.
- **Secrets stay in the environment.** No config files per environment, no secrets in the repository. If file-based secrets are added (`…_FILE` variables for Docker secrets), read them in `environment.ts` and hand the value to `loadConfig`.
- **Names describe the effect**, with a unit suffix for durations and sizes (`SESSION_DAYS`, `…_MS`, `…_BYTES`).
- **Security defaults are safe.** A new flag that weakens security (for example trusting more proxies or allowing more origins) defaults to the strict value, as `TRUST_PROXY` (`false`) and `COOKIE_SECURE` (secure in production) do. Reject a dangerous value at start with a message that says why (`TRUST_PROXY_ERROR`) instead of accepting it quietly, and test the rejection in `config.test.ts`.
