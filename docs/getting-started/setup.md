# Setup

> Summary: prerequisites (Node 24 and Docker), environment variables, database start-up, migrations, running the API and the web app locally, creating the first account, resetting a password, running in Docker, and troubleshooting.

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
| `COOKIE_SECURE`, `SESSION_DAYS`, `AUTH_ATTEMPTS_PER_MINUTE`, `TRUST_PROXY`, `API_DOCS`, `LOG_LEVEL` | API            | Session cookie and rate-limit settings, OpenAPI page, logging. Defaults suit local development.                                                                       |
| `API_URL`                                                                                           | web            | Where Next.js forwards `/api/*` (`http://127.0.0.1:4000` by default). Read when the web app is built or started.                                                      |

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

This runs three services: `postgres`, `api` (applies pending migrations when it starts and is not published to the host) and `web` on port 3000, which forwards `/api/*` to the API over the Compose network.

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
| Pages load but every request fails with `500` or a proxy error | The API is not running or `API_URL` points elsewhere. Start it with `npm run dev:api`.                                                                                                               |
| Port 3000 or 4000 is busy                                      | Another server is running; stop it, or set `PORT` for the web app and `API_PORT` (with a matching `API_URL`) for the API.                                                                            |
