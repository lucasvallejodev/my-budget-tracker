# Setup

> Summary: prerequisites, environment variables, database start-up, migrations and running the app locally or in Docker.

## Prerequisites

| Tool                | Version           | Why                                                         |
| ------------------- | ----------------- | ----------------------------------------------------------- |
| Node.js             | 22 or newer       | runtime for Next.js and the scripts                         |
| npm                 | comes with Node   | package manager (`package-lock.json` is committed)          |
| Docker Desktop      | any recent        | runs PostgreSQL 17 locally through `docker-compose.yml`     |
| A Clerk application | free tier is fine | authentication; you need a publishable key and a secret key |

## 1. Install dependencies

```bash
npm ci
```

## 2. Configure the environment

Copy the example file and fill it in:

```bash
cp .env.example .env
```

| Variable                                                                                    | Purpose                                                                                                                                                               |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                                              | Direct PostgreSQL URL. For the local Compose database: `postgresql://budget_tracker:<password>@localhost:5432/budget_tracker`. Proxy or Accelerate URLs are rejected. |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`                        | Used by Docker Compose to initialise the database. `POSTGRES_PASSWORD` must match the password inside `DATABASE_URL` and be URL-safe.                                 |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`                                     | Clerk keys from your Clerk dashboard.                                                                                                                                 |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `…_FALLBACK_REDIRECT_URL` | Clerk routes; the defaults in the example work with the app's `(auth)` pages.                                                                                         |

`.env` is git-ignored. Changing the database password in `.env` does not change it inside an already initialised Docker volume; recreate the volume or change the password in PostgreSQL.

## 3. Start PostgreSQL

```bash
npm run db:up
```

This starts the `postgres` service from `docker-compose.yml` (PostgreSQL 17, bound to `127.0.0.1:5432`, data in the `budget-postgres-data` named volume) and waits for its health check.

## 4. Apply the schema

```bash
npm run db:migrate
```

Drizzle applies every SQL migration in `apps/web/drizzle/` that has not run yet and records it in `drizzle.__drizzle_migrations`. The second migration also seeds the `currencies` table. To confirm the live schema matches the migrations without changing anything:

```bash
npm run db:check
```

## 5. Run the app

```bash
npm run dev
```

Open http://localhost:3000. You are redirected to Clerk's sign-in page; after signing in, the first request creates your settings row and seeds the default category taxonomy (see [Categories](../features/categories.md)).

<!-- screenshot: Clerk sign-in page as rendered inside the app shell (docs/assets/screenshots/setup-sign-in.png) -->

## 6. Verify the installation

```bash
npm run lint
npm test -- --run
npm run build
```

The database tests run against an in-memory PostgreSQL (PGlite); they never touch the configured database.

## Running in Docker

After the database has been migrated from the host:

```bash
docker compose --profile app up -d --build
```

The `budget-tracker` container connects to the `postgres` service over the Compose network. Public Clerk configuration is supplied at build time, the secret key at runtime. The container waits for the database health check but does not run migrations.

## SonarQube Cloud (optional, CI only)

The `SonarQube Cloud` workflow (`.github/workflows/sonar.yml`) uploads duplication, complexity, coverage and code-smell results to [sonarcloud.io](https://sonarcloud.io) on every push to `master` and every pull request. It is free for public repositories. Nothing runs locally; the workflow only needs one secret.

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

| Symptom                                              | Cause and fix                                                                                                          |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL is required` or `must use postgres://` | The variable is missing or points at a proxy. Use the direct connection string.                                        |
| `db:check` reports a schema difference               | Migrations have not been applied, or the database was created by an older version. Run `npm run db:migrate`.           |
| Sign-in loops or shows a Clerk error                 | Keys in `.env` do not belong to the same Clerk application, or the sign-in URLs differ from `/sign-in` and `/sign-up`. |
| Port 3000 is busy                                    | Another dev server is running; stop it or set `PORT`.                                                                  |
