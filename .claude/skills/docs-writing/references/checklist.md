# Documentation checklist

> Summary: the checks to run before finishing any documentation change (structure, wiring, facts, style), what each kind of code change must update (including security headers, CI workflows and the test guards), and the output format for a docs review.

## What a change must update

| You changed                                                  | Update                                                                                                                                                                           |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| behavior of a feature                                        | its page in `docs/features/`, and "How it works" if the mechanics changed                                                                                                        |
| an endpoint or a contract in `packages/shared/src/schema/`   | `docs/reference/rest-api.md`, the feature page                                                                                                                                   |
| schema or migrations                                         | `docs/architecture/data-model.md`, `docs/reference/migrations.md`, `agents/data-model.md`                                                                                        |
| a core rule (money, ledger, transfers, soft delete, scoping) | `docs/architecture/overview.md` (rule table), the feature page, `agents/architecture.md`                                                                                         |
| API plugins, config, env vars                                | `docs/architecture/api.md`, `docs/getting-started/setup.md`, `.env.example`, the `api` service's `environment:` list in `docker-compose.yml` (it has no `env_file`), `README.md` |
| security headers or CSP (`next.config.ts`, helmet options)   | `docs/architecture/security-headers.md`, `docs/architecture/api.md`                                                                                                              |
| conventions, lint or style rules                             | `docs/architecture/code-style.md`, `agents/conventions.md`, `README.md` if a command changed                                                                                     |
| components, styling, tokens                                  | `docs/architecture/components.md` (the `ui` catalog is checked by a test), `docs/architecture/frontend.md`, `agents/components.md`                                               |
| tests or test tooling                                        | `docs/architecture/testing.md` (coverage floors, authorization matrix, OpenAPI snapshot, end to end), `agents/conventions.md` › Tests                                            |
| scripts, Dockerfile, compose                                 | `docs/getting-started/commands.md`, `docs/getting-started/setup.md` › Running in Docker and › Backups and restore, `README.md`                                                   |
| `.github/workflows/*`, `.github/dependabot.yml`              | `docs/getting-started/setup.md` › SonarQube Cloud and › CI security checks, `docs/architecture/code-style.md`                                                                    |
| folders                                                      | `docs/getting-started/project-structure.md`, `README.md`, `agents/README.md` if agent docs moved                                                                                 |

`agents/docs-map.md` is the authoritative version of this table; if the change created a new code area, add its row there.

## Before you finish

Structure:

- [ ] Each touched page starts with `# Title` and a `> Summary:` line that matches its content after the edit.
- [ ] Each page is one type (see `page-types.md`); mixed content was moved and linked.
- [ ] New pages are in `docs/_sidebar.md`; new agent docs in `agents/README.md`; new code areas in `agents/docs-map.md`.
- [ ] New or changed screens have `<!-- screenshot: … (docs/assets/screenshots/<name>.png) -->` placeholders.
- [ ] Nothing in `docs/legacy/` changed; nothing links to `temp/`.

Facts:

- [ ] Every path, command, env var, route, helper and component named exists (Grep for each).
- [ ] Defaults and limits match the code (`config.ts`, `packages/shared/src/constants/`), not memory.
- [ ] Endpoints match the route files and Zod contracts, including status codes and soft-delete behavior.
- [ ] Money examples use minor units and a currency; no cross-currency sums.

Style (`style.md`):

- [ ] Active voice, "you" in docs, imperative in steps and agent docs.
- [ ] No filler words or AI tells; no emoji; no dates like "as of".
- [ ] Sentence-case headings; parallel lists; tagged code blocks under about 25 lines.
- [ ] Descriptive relative links; American spelling in new and edited prose; no em dashes in new text.

Tooling:

- [ ] `npx prettier --write <changed files>` and `npm run format:check` pass.
- [ ] If code changed too: `npm run lint && npm run typecheck && npm test -- --run && npm run build`.

## Review output format

When reviewing rather than writing, report one finding per line, grouped by file and ordered by impact (facts, then structure, then style):

```text
docs/features/budgets.md
  12  fact       says "PUT /api/v1/budgets/:id"; route is PUT /api/v1/budgets/:month/:categoryId/:currency
  3   structure  Summary line does not mention restoring a deleted budget
  27  style      "simply click" → "click"

3 findings: 1 fact, 1 structure, 1 style
```

End with "No findings" for a clean file rather than omitting it, so the reader knows it was checked.
