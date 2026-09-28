# Setup

> Summary: prerequisites (Node 24 and Docker), environment variables, database start-up, migrations, running the API and the web app locally, creating the first account, resetting a password, running in Docker (one-shot migrations, secure cookies, TLS termination behind a reverse proxy), and troubleshooting.

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

| Variable                                                                                            | Used by        | Purpose                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                                                      | API            | Direct PostgreSQL URL. For the local Compose database: `postgresql://budget_tracker:<password>@localhost:5432/budget_tracker`. Proxy or Accelerate URLs are rejected. |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`                                | Docker Compose | Initialise the database. `POSTGRES_PASSWORD` must match the password inside `DATABASE_URL` and be URL-safe.                                                           |
| `API_HOST`, `API_PORT`                                                                              | API            | Where Fastify listens (`127.0.0.1:4000` by default).                                                                                                                  |
| `ALLOWED_ORIGINS`, `CORS_ORIGINS`                                                                   | API            | Origins allowed to send writes (the web app's URL, `http://localhost:3000` locally) and to read responses cross-origin (empty).                                       |
| `COOKIE_SECURE`, `SESSION_DAYS`, `AUTH_ATTEMPTS_PER_MINUTE`, `TRUST_PROXY`, `API_DOCS`, `LOG_LEVEL` | API            | Session cookie and rate-limit settings, OpenAPI page, logging. Defaults suit local development. `TRUST_PROXY` stays `false` unless a reverse proxy is in front.       |
| `API_URL`                                                                                           | web            | Where Next.js forwards `/api/*` (`http://127.0.0.1:4000` by default). Read when the web app is built or started.                                                      |
| `WEB_BIND_ADDRESS`                                                                                  | Docker Compose | Host address the `web` container is published on: `127.0.0.1` by default, so only this machine (or a reverse proxy on it) can open the app.                          |

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

| Service | Image target | What it does |
| --- | --- | --- |
| `postgres` | `postgres:17-alpine` | The database, bound to `127.0.0.1:5432` on the host. |
| `migrate` | `--target api` | A one-shot container: runs `node dist/cli/migrate.js` (applies pending migrations with Drizzle's migrator) once PostgreSQL is healthy, then exits. It is not restarted. |
| `api` | `--target api` | The Fastify server on port 4000 inside the Compose network, started only after `migrate` exits successfully (`service_completed_successfully`); restarting it does not migrate again. It is **not** published to the host; its health check calls `/api/v1/health`. |
| `web` | `--target web` | The Next.js standalone server, published on `127.0.0.1:3000` (http://localhost:3000). It is built with `API_URL=http://api:4000`, so `/api/*` is forwarded to the API container. It starts once the API is healthy. |

Both images run `tini` as PID 1 and start `node` directly, so `docker compose stop` delivers `SIGTERM` to Node and the API shuts down gracefully (see [API service › Start and shutdown](../architecture/api.md#start-and-shutdown)). Without Compose, run the migrations with the same image before starting it: `docker run --rm -e DATABASE_URL=… <api image> node dist/cli/migrate.js`.

The API reads `ALLOWED_ORIGINS`, `CORS_ORIGINS`, `COOKIE_SECURE`, `SESSION_DAYS`, `AUTH_ATTEMPTS_PER_MINUTE`, `TRUST_PROXY` and `LOG_LEVEL` from `.env`. Stop the app containers with `docker compose --profile app down`; the database volume survives.

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

## SonarQube Cloud (optional, CI only)

The `SonarQube Cloud` workflow (`.github/workflows/sonar.yml`) uploads duplication, complexity, coverage and code-smell results to [sonarcloud.io](https://sonarcloud.io) on every push to `main` and every pull request. It is free for public repositories. Nothing runs locally; the workflow only needs one secret.

1. Sign in to SonarQube Cloud with GitHub and import the repository (**+** > _Analyze new project_). Choose the organization that matches `sonar.organization` and confirm the project key shown matches `sonar.projectKey` in `sonar-project.properties`; edit the file if SonarQube generated different keys.
2. In the project, pick **Administration > Analysis Method** and switch **Automatic Analysis** off. The workflow does CI-based analysis, and SonarQube refuses to run both.
3. Create a token: your avatar > **My Account > Security**, type _Project Analysis Token_ (or _Global_), copy the value once.
4. In GitHub, open the repository **Settings > Secrets and variables > Actions** and add a repository secret named `SONAR_TOKEN` with that value.
5. Push or open a pull request. The workflow runs `npm run test:coverage` and the scan; the results and the quality gate appear on the SonarQube project page and as a check on the pull request.

Pull requests from forks skip the scan because they cannot read the secret.

## Serving this documentation

```bash
npm run docs
```

This serves the `docs/` folder with Docsify at http://localhost:3010. The site is static: any HTTP server pointed at `docs/` works, and GitHub Pages can serve it directly (the `.nojekyll` file is already there).

## Troubleshooting

| Symptom                                                        | Cause and fix                                                                                                                                                                                        |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL is required` or `must use postgres://`           | The variable is missing or points at a proxy. Use the direct connection string.                                                                                                                      |
| `npm run db:migrate` fails with `relation "…" already exists`  | The database was created with the old web-app migrations. [Reset it](../reference/migrations.md#resetting-a-database-created-with-the-old-history) and migrate again.                                |
| `db:check` reports a schema difference                         | Migrations have not been applied, or the database was created by an older version. Run `npm run db:migrate`.                                                                                         |
| The browser keeps returning to the sign-in page                | A stale session cookie from an older run: the page guard sees a cookie, the API rejects it with `401` and the client sends you to sign in. Clear the cookies for `localhost:3000` and sign in again. |
| Writes fail with `403 ORIGIN_NOT_ALLOWED`                      | The URL you open the app at is not in `ALLOWED_ORIGINS`. Add it and restart the API.                                                                                                                 |
| In Docker, sign-in succeeds but the next page asks to sign in again | The session cookie is `Secure` and the page was opened over plain HTTP at an address other than `localhost`. Serve it over HTTPS ([TLS termination](#serving-it-on-a-network-tls-termination)), or set `COOKIE_SECURE=false` for a local trial. |
| The API refuses to start: `TRUST_PROXY must be false or …`     | An old `.env` still has `TRUST_PROXY=true`. Set `false`, or list your reverse proxy's addresses ([Behind a reverse proxy](../architecture/api.md#behind-a-reverse-proxy)).                          |
| Sign-in answers `429` for everyone at once                     | Without a trusted reverse proxy every request reaches the API from the web app, so the limit is shared. Add a reverse proxy and set `TRUST_PROXY`, or raise `AUTH_ATTEMPTS_PER_MINUTE`.               |
| Pages load but every request fails with `500` or a proxy error | The API is not running or `API_URL` points elsewhere. Start it with `npm run dev:api`.                                                                                                               |
| Port 3000 or 4000 is busy                                      | Another server is running; stop it, or set `PORT` for the web app and `API_PORT` (with a matching `API_URL`) for the API.                                                                            |
