# Commands

> Summary: every npm script, what it does and when to use it.

All commands run from the repository root.

## Development

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts Next.js with Turbopack on http://localhost:3000 with hot reload. |
| `npm run build` | Production build. Also the most complete type and route check. |
| `npm start` | Serves the production build. |
| `npm run docs` | Serves this documentation with Docsify on http://localhost:3010. |

## Quality

| Command | What it does |
| --- | --- |
| `npm run lint` | ESLint (Next.js, type-aware TypeScript, SonarJS, blank-line and layout rules, Prettier) plus Stylelint for SCSS. Errors fail; complexity warnings are reported. See [Code style](../architecture/code-style.md). |
| `npm run lint:fix` | Same, applying every automatic fix (formatting, blank lines, object layout, arrow functions). Run it after editing. |
| `npm run lint:dupes` | Duplicated-code report with jscpd; fails above 3 % duplicated lines. |
| `npm run knip` | Unused files, exports, types and dependencies. Advisory. |
| `npm run format` / `npm run format:check` | Prettier over the whole repository. |
| `npm test -- --run` | Vitest once (unit, component and PGlite database tests). Without `--run` it watches. |
| `npm run test:coverage` | Same, writing `coverage/lcov.info` (read by SonarQube Cloud in CI). |
| `npm run test:e2e` | Playwright end-to-end tests in `e2e/` (requires a running app and a signed-in session; the sample spec only visits playwright.dev). |
| `npx tsc --noEmit` | Type check without building. |

## Database

| Command | What it does |
| --- | --- |
| `npm run db:up` | Starts the PostgreSQL container. |
| `npm run db:down` | Stops Compose services. The data volume is kept. |
| `npm run db:generate` | Generates a new SQL migration in `drizzle/` from changes in `src/db/schema.ts`. Review the SQL before applying it. |
| `npm run db:migrate` | Applies pending migrations to `DATABASE_URL`. |
| `npm run db:check` | Read-only comparison of the live schema against all migrations applied to an in-memory PostgreSQL. |
| `npm run db:studio` | Opens Drizzle Studio to browse the database. |

## Docker

| Command | What it does |
| --- | --- |
| `docker compose --profile app up -d --build` | Builds and runs the app container next to PostgreSQL. |
| `docker compose down` | Stops everything; the database volume survives. |

## Typical loops

Change the schema:

```bash
# edit src/db/schema.ts
npm run db:generate      # review drizzle/000N_*.sql
npm run db:migrate
npm test -- --run        # PGlite tests apply every migration from scratch
```

Before committing:

```bash
npm run lint && npx tsc --noEmit && npm test -- --run && npm run build
```
