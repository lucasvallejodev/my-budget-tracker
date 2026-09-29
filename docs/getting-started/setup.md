# Setup

> Summary: prerequisites (Node 24 and Docker), environment variables, database start-up, migrations, running the API and the web app locally, creating the first account, resetting a password, running in Docker (one-shot migrations, runtime restrictions, secure cookies, TLS termination behind a reverse proxy, backups and restore), the CI security checks, and troubleshooting.

## Prerequisites

| Tool           | Version                        | Why                                                               |
| -------------- | ------------------------------ | ----------------------------------------------------------------- |
| Node.js        | 24 (npm 11 wrote the lockfile) | runtime for the API, Next.js and the scripts                      |
| npm            | comes with Node                | package manager and workspaces (`package-lock.json` is committed) |
| Docker Desktop | any recent                     | runs PostgreSQL 17 locally through `docker-compose.yml`           |

No external accounts are needed: sign-up, sign-in and sessions are handled by the API itself.

## 1. Install dependencies

```bash
npm ci
```

This installs the three workspaces (`apps/api`, `apps/web`, `packages/shared`) from the repository root.

## 2. Configure the environment

Copy the example file and fill it in:

```bash
cp .env.example .env
```

The API, Drizzle Kit and Next.js all read this root `.env`.

| Variable                                                                                                                                                                          | Used by        | Purpose                                                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                                                                                                                                    | API            | Direct PostgreSQL URL. For the local Compose database: `postgresql://budget_tracker:<password>@localhost:5432/budget_tracker`. Proxy or Accelerate URLs are rejected.                                 |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`                                                                                                              | Docker Compose | Initialise the database. `POSTGRES_PASSWORD` must match the password inside `DATABASE_URL` and be URL-safe.                                                                                           |
| `API_HOST`, `API_PORT`                                                                                                                                                            | API            | Where Fastify listens (`127.0.0.1:4000` by default).                                                                                                                                                  |
| `ALLOWED_ORIGINS`, `CORS_ORIGINS`                                                                                                                                                 | API            | Origins allowed to send writes (the web app's URL, `http://localhost:3000` locally) and to read responses cross-origin (empty).                                                                       |
| `COOKIE_SECURE`, `SESSION_DAYS`, `SESSION_MAX_AGE_DAYS`, `AUTH_ATTEMPTS_PER_MINUTE`, `SIGN_IN_FAILURES_PER_ACCOUNT`, `TRUST_PROXY`, `HANDLER_TIMEOUT_MS`, `API_DOCS`, `LOG_LEVEL` | API            | Session cookie, session lifetime and rate-limit settings, request time limit, OpenAPI page, logging. Defaults suit local development. `TRUST_PROXY` stays `false` unless a reverse proxy is in front. |
| `API_URL`                                                                                                                                                                         | web            | Where Next.js forwards `/api/*` (`http://127.0.0.1:4000` by default). Read when the web app is built or started.                                                                                      |
| `WEB_BIND_ADDRESS`                                                                                                                                                                | Docker Compose | Host address the `web` container is published on: `127.0.0.1` by default, so only this machine (or a reverse proxy on it) can open the app.                                                           |
| `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD`                                                                                                                                           | `db:seed:demo` | Credentials of the local [demo account](demo-account.md). The password is yours to choose (12 to 128 characters) and is never committed; the email defaults to `test@test.com`.                       |
| `BACKUP_DIR`, `BACKUP_RETENTION_DAYS`, `BACKUP_UID`, `BACKUP_GID`                                                                                                                 | Docker Compose | The `backup` service: host directory for dumps (`./backups`), days to keep them (14), and the host user and group that own them (`1000`). See [Backups and restore](#backups-and-restore).            |

Every API variable and its default is described in [API service › Configuration](../architecture/api.md#configuration). `.env` is git-ignored. Changing the database password in `.env` does not change it inside an already initialised Docker volume; recreate the volume or change the password in PostgreSQL.

## 3. Start PostgreSQL

```bash
npm run db:up
```

This starts the `postgres` service from `docker-compose.yml` (PostgreSQL 17, bound to `127.0.0.1:5432`, data in the `budget-postgres-data` named volume) and waits for its health check.

## 4. Apply the schema

```bash
npm run db:migrate
```

Drizzle applies every SQL migration in `apps/api/drizzle/` that has not run yet and records it in `drizzle.__drizzle_migrations`. The first migration also seeds the `currencies` table. To confirm the live schema matches the migrations without changing anything:

```bash
npm run db:check
```

If this database was created with the old web-app migrations, reset it first: see [Database migrations › Resetting](../reference/migrations.md#resetting-a-database-created-with-the-old-history).

## 5. Run the app

```bash
npm run dev
```

This starts the API (http://127.0.0.1:4000, `tsx watch`) and the web app (http://localhost:3000, `next dev`) together; `npm run dev:api` and `npm run dev:web` start one of them. Outside production the API serves its OpenAPI page at http://127.0.0.1:4000/api/docs.

Open http://localhost:3000. Without a session you are sent to the sign-in page; follow **Create one** under the form, enter your name, email and a password of 12 to 128 characters. Sign-up creates your settings and seeds the default category taxonomy (see [Categories](../features/categories.md)), then signs you in. More in [Account and security](../features/account-and-security.md).

<!-- screenshot: the sign-in page with the CoinKeeper logo and the link to create an account (docs/assets/screenshots/setup-sign-in.png) -->

A script or an agent can create an account without the browser:

```bash
curl -i -X POST http://127.0.0.1:4000/api/v1/auth/sign-up \
  -H 'Content-Type: application/json' -H 'Origin: http://localhost:3000' \
  -d '{"email":"me@example.com","password":"a long local password","name":"Me"}'
```

The response sets the session cookie; send it back on later requests.

## 6. Reset a forgotten password

There is no email reset yet. Whoever runs the server sets a new password from the command line:

```bash
npm run user:reset-password -- me@example.com
```

It asks for the new password (or reads `NEW_PASSWORD` from the environment) and signs the user out everywhere.

## 7. Verify the installation

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run build
```

The database tests run against an in-memory PostgreSQL (PGlite); they never touch the configured database.

## Running in Docker

```bash
docker compose --profile app up -d --build
```

This runs four services from one multi-stage `Dockerfile`:

| Service    | Image target                            | What it does                                                                                                                                                                                                                                                                                                                        |
| ---------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `postgres` | `postgres:17-alpine` (pinned by digest) | The database, bound to `127.0.0.1:5432` on the host.                                                                                                                                                                                                                                                                                |
| `migrate`  | `--target api`                          | A one-shot container: runs `node dist/cli/migrate.js` (applies pending migrations with Drizzle's migrator) once PostgreSQL is healthy, then exits. It is not restarted.                                                                                                                                                             |
| `api`      | `--target api`                          | The Fastify server on port 4000 inside the Compose network, started only after `migrate` exits successfully (`service_completed_successfully`); restarting it does not migrate again. It is **not** published to the host; its Docker health check calls liveness, `/api/v1/health/live`, so a database outage does not restart it. |
| `web`      | `--target web`                          | The Next.js standalone server, published on `127.0.0.1:3000` (http://localhost:3000). It is built with `API_URL=http://api:4000`, so `/api/*` is forwarded to the API container. It starts once the API is healthy. Its Docker health check loads `/sign-in`.                                                                       |
| `backup`   | `postgres:17-alpine`                    | Only under the `backup` profile, never started by `up`: a one-shot `pg_dump` (see [Backups and restore](#backups-and-restore)).                                                                                                                                                                                                     |

Both images run `tini` as PID 1 and start `node` directly, so `docker compose stop` delivers `SIGTERM` to Node and the API shuts down gracefully (see [API service › Start and shutdown](../architecture/api.md#start-and-shutdown)). Without Compose, run the migrations with the same image before starting it: `docker run --rm -e DATABASE_URL=… <api image> node dist/cli/migrate.js`.

The API reads `ALLOWED_ORIGINS`, `CORS_ORIGINS`, `COOKIE_SECURE`, `SESSION_DAYS`, `SESSION_MAX_AGE_DAYS`, `AUTH_ATTEMPTS_PER_MINUTE`, `SIGN_IN_FAILURES_PER_ACCOUNT`, `HANDLER_TIMEOUT_MS`, `TRUST_PROXY` and `LOG_LEVEL` from `.env`; an empty value keeps the API's default. Stop the app containers with `docker compose --profile app down`; the database volume survives.

### Runtime restrictions

Every container shares the `x-hardening` block in `docker-compose.yml`:

| Setting                           | Effect                                                                                                                                                                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `read_only: true`                 | The root filesystem is read-only. Writable space is a `tmpfs` at `/tmp` (64 MB), plus `/app/apps/web/.next/cache` for `web` (owned by uid 1001) and `/var/run/postgresql` for `postgres`. The database files live on the `budget-postgres-data` volume. |
| `cap_drop: [ALL]`                 | No Linux capabilities. `postgres` adds back only `CHOWN`, `DAC_OVERRIDE`, `FOWNER`, `SETGID` and `SETUID`, which its entrypoint needs to fix data-directory ownership and switch to the `postgres` user.                                                |
| `no-new-privileges:true`          | No process can gain privileges through a setuid binary.                                                                                                                                                                                                 |
| `mem_limit`, `pids_limit`, `cpus` | `api` 512 MB (each argon2id hash holds 19 MiB while it runs), `web` 512 MB, `postgres` 1 GB with `shm_size: 256m`, `migrate` and `backup` 256 MB; process limits from 64 to 512; one CPU each for `api` and `web`.                                      |
| `restart`                         | `unless-stopped` for `postgres`, `api` and `web`; `'no'` for the one-shot `migrate` and `backup`.                                                                                                                                                       |

The API and web images run as uid 1001, and their runtime stages remove npm, npx, corepack and yarn, which nothing runs there. Base images are pinned by tag and digest (`node:24-alpine@sha256:…` in the `Dockerfile`, `postgres:17-alpine@sha256:…` in Compose); Dependabot proposes digest updates weekly. If a container logs `EROFS` or `EACCES`, a new code path writes outside those mounts: add a `tmpfs` for that path rather than dropping `read_only`.

### Cookies and HTTPS

The containers run with `NODE_ENV=production`, and `COOKIE_SECURE` defaults to `true` in Compose: the session cookie is `__Host-ck_session` with `Secure`, so browsers send it only over HTTPS. Browsers treat `http://localhost` as a secure context, so current Chrome and Firefox normally keep the cookie when you open http://localhost:3000 on the same machine. To try the stack over plain HTTP anywhere else (or if your browser drops the cookie on localhost), set `COOKIE_SECURE=false` in `.env`; never do that for a server other people use.

### Serving it on a network (TLS termination)

The web container listens only on the loopback interface. To serve CoinKeeper to other devices, put a reverse proxy on the same host that terminates TLS and forwards to `127.0.0.1:3000`, rather than publishing port 3000 itself. With [Caddy](https://caddyserver.com), which obtains certificates automatically and replaces `X-Forwarded-For` with the real client address:

```caddyfile
budget.example.com {
  reverse_proxy 127.0.0.1:3000
}
```

With nginx, forward to `http://127.0.0.1:3000` from a `listen 443 ssl` server and set `proxy_set_header Host $host;`, `proxy_set_header X-Forwarded-Proto $scheme;` and `proxy_set_header X-Forwarded-For $remote_addr;`. Then, in `.env`:

- `ALLOWED_ORIGINS=https://budget.example.com` (the public URL; writes from any other origin get `403`);
- leave `COOKIE_SECURE` unset (secure);
- `TRUST_PROXY` set to the Compose network's subnet or `uniquelocal`, so the sign-in rate limit counts each client separately; see [API service › Behind a reverse proxy](../architecture/api.md#behind-a-reverse-proxy). Only do this when port 3000 is not reachable except through the proxy.

If the reverse proxy runs in a container on the Compose network instead, point it at `web:3000` and keep `WEB_BIND_ADDRESS` at its default. Set `WEB_BIND_ADDRESS=0.0.0.0` only when something else in front of the host (a firewall, a load balancer that terminates TLS) guarantees clients cannot reach port 3000 over plain HTTP.

### Backups and restore

A named volume is not a backup. The `backup` service (profile `backup`) runs `pg_dump --format=custom` against the `postgres` service, checks the archive with `pg_restore --list`, writes it to `BACKUP_DIR` as `<database>-<UTC timestamp>.dump`, and deletes archives older than `BACKUP_RETENTION_DAYS`. It reads the database password from `.env` like the other services; nothing secret is written to disk except the dump itself. `BACKUP_DIR` (`./backups` by default) is git-ignored and excluded from the Docker build context.

```bash
mkdir -p backups                                   # create it yourself, or Docker creates it owned by root
docker compose --profile backup run --rm backup    # prints "Wrote /backups/budget_tracker-20260928T151756Z.dump"
```

On Linux, set `BACKUP_UID` and `BACKUP_GID` in `.env` to the output of `id -u` and `id -g` so the dumps belong to you. Docker Desktop on Windows and macOS does not need them. Run the command from cron or Task Scheduler (for example daily at 03:00), copy `BACKUP_DIR` off the host, and take a manual backup before any migration that drops or rewrites data.

**Restore drill.** Restore the latest archive into a scratch database and check it against the migrations. Do this after setting up backups and then regularly, so you know the archives work:

```bash
docker compose --profile backup run --rm --entrypoint createdb backup budget_tracker_restore
docker compose --profile backup run --rm --entrypoint pg_restore backup \
  --dbname=budget_tracker_restore --no-owner --exit-on-error /backups/budget_tracker-20260928T151756Z.dump
DATABASE_URL=postgresql://budget_tracker:<password>@localhost:5432/budget_tracker_restore npm run db:check
docker compose --profile backup run --rm --entrypoint dropdb backup budget_tracker_restore
```

`db:check` must print `Connection and schema verified`. In PowerShell, set the variable first with `$env:DATABASE_URL = "…"`.

**Restoring for real.** Stop the app so nothing writes during the restore, replace the contents of the live database in one transaction, then start the app again:

```bash
docker compose --profile app stop web api
docker compose --profile backup run --rm --entrypoint pg_restore backup \
  --dbname=budget_tracker --clean --if-exists --no-owner --single-transaction --exit-on-error \
  /backups/budget_tracker-20260928T151756Z.dump
docker compose --profile app up -d --wait
```

`--single-transaction` rolls everything back if one statement fails, so the database is either the old one or the restored one. The `Docker images` workflow runs the backup and the restore drill on every pull request.

## SonarQube Cloud (optional, CI only)

The `SonarQube Cloud` workflow (`.github/workflows/sonar.yml`) uploads duplication, complexity, coverage and code-smell results to [sonarcloud.io](https://sonarcloud.io) on every push to `main` and every pull request. It is free for public repositories. Nothing runs locally; the workflow only needs one secret.

1. Sign in to SonarQube Cloud with GitHub and import the repository (**+** > _Analyze new project_). Choose the organization that matches `sonar.organization` and confirm the project key shown matches `sonar.projectKey` in `sonar-project.properties`; edit the file if SonarQube generated different keys.
2. In the project, pick **Administration > Analysis Method** and switch **Automatic Analysis** off. The workflow does CI-based analysis, and SonarQube refuses to run both.
3. Create a token: your avatar > **My Account > Security**, type _Project Analysis Token_ (or _Global_), copy the value once.
4. In GitHub, open the repository **Settings > Secrets and variables > Actions** and add a repository secret named `SONAR_TOKEN` with that value.
5. Push or open a pull request. The workflow runs `npm run test:coverage` and the scan; the results and the quality gate appear on the SonarQube project page and as a check on the pull request.

Pull requests from forks skip the scan because they cannot read the secret.

## CI security checks

Every push to `main` and every pull request also runs these workflows:

| Workflow         | What it checks                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `quality.yml`    | Before lint and tests: `npm audit --omit=dev --audit-level=high` (a known high or critical advisory in a production dependency fails the build) and `npm audit signatures`.                                                                                                                                                                                                                                                                                                     |
| `playwright.yml` | After `db:migrate`: `npm run db:check`, so a migration that leaves the schema different from what the migrations describe fails before the browser tests.                                                                                                                                                                                                                                                                                                                       |
| `codeql.yml`     | CodeQL `security-extended` queries for JavaScript and TypeScript (taint tracking that Sonar and ESLint do not do). Also weekly.                                                                                                                                                                                                                                                                                                                                                 |
| `secrets.yml`    | gitleaks over the full git history, with findings redacted in the log. Also weekly. If it finds a real secret, rotate it; removing it from history is not enough.                                                                                                                                                                                                                                                                                                               |
| `docker.yml`     | hadolint on the `Dockerfile`; builds the `api` and `web` targets, uploads an SPDX SBOM for each (`sbom-api.spdx.json`, `sbom-web.spdx.json`) and fails on a high or critical vulnerability that has a fix (Grype), except the reviewed exceptions in `.grype.yaml` (see [Image scan exceptions](#image-scan-exceptions)); starts the Compose stack and waits for every health check, runs the backup and restore drill, and checks that the API exits with code 0 on `SIGTERM`. |

Every workflow starts from `permissions: contents: read` (only CodeQL adds `security-events: write`), checks out without persisting the token, and pins every action to a full commit SHA with the version in a trailing comment. Images used in CI are pinned by digest. Dependabot (`.github/dependabot.yml`) proposes updates weekly for npm, the pinned actions, the `Dockerfile` base image and the Compose images; the gitleaks image in `secrets.yml` is bumped by hand.

### Image scan exceptions

The image scan fails the build on a **high** or **critical** vulnerability only when a fixed version exists: a flaw nobody can fix yet cannot block a merge, and lower severities are listed in the job summary and the `grype-api` / `grype-web` artifacts. Most failures go away with a base-image or dependency update (Dependabot proposes them weekly). When a finding cannot be fixed yet and does not affect CoinKeeper, for example a vulnerable function the app never calls, record a reviewed exception instead of weakening the check: When the scan step itself fails (for example GitHub cannot serve the Grype download), the job runs it once more; a real finding fails both attempts, so the retry never lets one through.

1. Read the advisory and check whether the vulnerable package or code path is reachable in that image.
2. Add an entry to `.grype.yaml` at the repository root:

   ```yaml
   ignore:
     - vulnerability: CVE-2026-12345
       package:
         name: busybox
       reason: busybox wget is not used; the images make no outbound requests with it
       expires: 2026-12-31
   ```

3. Keep `expires` short (weeks, not years), so the exception is reviewed again. The **Check the scan exceptions** step fails the build when an entry has no `reason`, no `expires`, or an `expires` date in the past; renew it only after checking the advisory again, otherwise remove it.
4. Mention the exception in the pull request so a reviewer sees it.

Never lower `severity-cutoff` or turn off `fail-build` in `docker.yml` to get a green build.

Three repository settings complete this, and only the repository owner can change them: turn on secret scanning with push protection (**Settings > Code security**), set **Settings > Actions > General > Workflow permissions** to read-only, and require the checks above on `main` with branch protection. On a private repository, CodeQL needs GitHub Advanced Security.

## Serving this documentation

```bash
npm run docs
```

This serves the `docs/` folder with Docsify at http://localhost:3010. The site is static: any HTTP server pointed at `docs/` works, and GitHub Pages can serve it directly (the `.nojekyll` file is already there).

## Troubleshooting

| Symptom                                                                                  | Cause and fix                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL is required` or `must use postgres://`                                     | The variable is missing or points at a proxy. Use the direct connection string.                                                                                                                                                                                                                                                                            |
| `npm run db:migrate` fails with `relation "…" already exists`                            | The database was created with the old web-app migrations. [Reset it](../reference/migrations.md#resetting-a-database-created-with-the-old-history) and migrate again.                                                                                                                                                                                      |
| `db:check` reports a schema difference                                                   | Migrations have not been applied, or the database was created by an older version. Run `npm run db:migrate`.                                                                                                                                                                                                                                               |
| The browser keeps returning to the sign-in page                                          | A stale session cookie from an older run: the page guard sees a cookie, the API rejects it with `401` and the client sends you to sign in. Clear the cookies for `localhost:3000` and sign in again.                                                                                                                                                       |
| Writes fail with `403 ORIGIN_NOT_ALLOWED`                                                | The URL you open the app at is not in `ALLOWED_ORIGINS`. Add it and restart the API.                                                                                                                                                                                                                                                                       |
| In Docker, sign-in succeeds but the next page asks to sign in again                      | The session cookie is `Secure` and the page was opened over plain HTTP at an address other than `localhost`. Serve it over HTTPS ([TLS termination](#serving-it-on-a-network-tls-termination)), or set `COOKIE_SECURE=false` for a local trial.                                                                                                            |
| The API refuses to start: `TRUST_PROXY must be false or …`                               | An old `.env` still has `TRUST_PROXY=true`. Set `false`, or list your reverse proxy's addresses ([Behind a reverse proxy](../architecture/api.md#behind-a-reverse-proxy)).                                                                                                                                                                                 |
| Sign-in answers `429` for everyone at once                                               | Without a trusted reverse proxy every request reaches the API from the web app, so the limit is shared. Add a reverse proxy and set `TRUST_PROXY`, or raise `AUTH_ATTEMPTS_PER_MINUTE`.                                                                                                                                                                    |
| Sign-in for one email takes a few seconds, or answers `429` "try again in a few seconds" | That email had more than `SIGN_IN_FAILURES_PER_ACCOUNT` (5) wrong passwords recently, so attempts are spaced up to 5 seconds apart; `429` means many attempts are queued at once. Try again after a few seconds; the count is forgotten 15 minutes after the last failure or when the API restarts.                                                        |
| You are asked to sign in again although you use the app daily                            | The session reached `SESSION_MAX_AGE_DAYS` (90 by default) since you signed in. This is intended; raise the value if you want longer sessions.                                                                                                                                                                                                             |
| Pages load but every request fails with `500` or a proxy error                           | The API is not running or `API_URL` points elsewhere. Start it with `npm run dev:api`.                                                                                                                                                                                                                                                                     |
| Port 3000 or 4000 is busy                                                                | Another server is running; stop it, or set `PORT` for the web app and `API_PORT` (with a matching `API_URL`) for the API. When port 3000 is taken, Next.js starts on 3001 instead and sign-in fails with `403 ORIGIN_NOT_ALLOWED`, because only `http://localhost:3000` is allowed by default: free port 3000 or add the new address to `ALLOWED_ORIGINS`. |
| A container logs `EROFS: read-only file system` or `EACCES`                              | It writes outside its `tmpfs` mounts. Add a `tmpfs` entry for that path in `docker-compose.yml` ([Runtime restrictions](#runtime-restrictions)); do not remove `read_only`.                                                                                                                                                                                |
| `docker compose --profile backup run --rm backup` fails with `Permission denied`         | `BACKUP_DIR` does not belong to `BACKUP_UID`:`BACKUP_GID`, often because Docker created it as root. Run `mkdir -p backups` yourself, or `sudo chown "$(id -u):$(id -g)" backups`, and set both variables in `.env`.                                                                                                                                        |
