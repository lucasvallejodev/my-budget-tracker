# Commands

> Summary: every npm script, what it does and when to use it.

All commands run from the repository root. The repository is an npm workspaces monorepo; root scripts delegate to the workspaces (`npm run db:migrate` runs Drizzle Kit in `apps/api`). To run a script of one workspace directly: `npm run <script> -w @coinkeeper/api` or `-w @coinkeeper/web`.

## Development and operation

| Command                                  | What it does                                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                            | Starts the API and the web app together with `concurrently` (output prefixed `api` and `web`; if one fails, both stop).                     |
| `npm run dev:api`                        | Starts only the Fastify API with `tsx watch` on http://127.0.0.1:4000 (Swagger UI at `/api/docs`).                                          |
| `npm run dev:web`                        | Starts only Next.js with Turbopack on http://localhost:3000; it forwards `/api/*` to `API_URL`.                                             |
| `npm run user:reset-password -- <email>` | Sets a new password for a user (prompts for it, or reads `NEW_PASSWORD`) and signs them out everywhere.                                     |
| `npm run build`                          | Production build of every workspace that has a build script: `next build` for the web app, `tsup` for the API (`apps/api/dist/`).           |
| `npm start`                              | Serves the web app's production build (`next start`). The API's build runs with `npm run start -w @coinkeeper/api` (`node dist/server.js`). |
| `npm run docs`                           | Serves this documentation with Docsify on http://localhost:3010.                                                                            |

## Quality

| Command                                   | What it does                                                                                                                                                                                                                                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`                            | ESLint (Next.js, type-aware TypeScript, SonarJS, blank-line and layout rules, Prettier) plus Stylelint for SCSS (colour tokens, BEM naming, one block per stylesheet, cascade layers, breakpoint mixins). Errors fail; complexity warnings are reported. See [Code style](../architecture/code-style.md). |
| `npm run lint:fix`                        | Same, applying every automatic fix (formatting, blank lines, object layout, arrow functions). Run it after editing.                                                                                                                                                                                       |
| `npm run lint:dupes`                      | Duplicated-code report with jscpd; fails above 3 % duplicated lines.                                                                                                                                                                                                                                      |
| `npm run knip`                            | Unused files, exports, types and dependencies. Advisory.                                                                                                                                                                                                                                                  |
| `npm run format` / `npm run format:check` | Prettier over the whole repository.                                                                                                                                                                                                                                                                       |
| `npm test -- --run`                       | Vitest once (unit, component and PGlite database tests). Without `--run` it watches.                                                                                                                                                                                                                      |
| `npm run test:coverage`                   | Same, writing `coverage/lcov.info` (read by SonarQube Cloud in CI).                                                                                                                                                                                                                                       |
| `npm run test:e2e`                        | Playwright end-to-end tests in `e2e/` in Chromium. Starts the API and the web app itself (or reuses running ones) against `DATABASE_URL`, which must be migrated; each test signs up its own throwaway user. See [Testing › End to end](../architecture/testing.md#end-to-end). |
| `npm run typecheck`                       | Type check without building: the root files (`e2e/`, configs) and then every workspace (`tsc --noEmit` in each).                                                                                                                                                                                          |

## Database

The database commands run in the API workspace, which owns the schema. See [Database migrations](../reference/migrations.md).

| Command               | What it does                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run db:up`       | Starts the PostgreSQL container.                                                                                                     |
| `npm run db:down`     | Stops Compose services. The data volume is kept.                                                                                     |
| `npm run db:generate` | Generates a new SQL migration in `apps/api/drizzle/` from changes in `apps/api/src/db/schema.ts`. Review the SQL before applying it. |
| `npm run db:migrate`  | Applies pending migrations in `apps/api/drizzle/` to `DATABASE_URL`.                                                                 |
| `npm run db:check`    | Read-only comparison of the live schema against all migrations applied to an in-memory PostgreSQL.                                   |
| `npm run db:studio`   | Opens Drizzle Studio to browse the database.                                                                                         |

## Docker

| Command                                      | What it does                                                                                                |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `docker compose --profile app up -d --build` | Builds and runs the `api` and `web` containers next to PostgreSQL; the web app is on http://localhost:3000. |
| `docker compose down`                        | Stops everything; the database volume survives.                                                             |

## Typical loops

Change the schema:

```bash
# edit apps/api/src/db/schema.ts
npm run db:generate      # review apps/api/drizzle/000N_*.sql
npm run db:migrate
npm test -- --run        # PGlite tests apply every migration from scratch
```

Before committing:

```bash
npm run lint && npm run typecheck && npm test -- --run && npm run build
```
