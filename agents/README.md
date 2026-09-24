# Agent documentation index

> Summary: index of the documents written for AI coding agents. Read the description, open only what you need.

Every file in this folder starts with a `> Summary:` line so `head -3 <file>` tells you what it contains. Keep that convention when adding files.

| File                               | Read it when                                                         | One-line description                                                                                                                                             |
| ---------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [architecture.md](architecture.md) | before touching anything server-side or changing data flow           | Condensed architecture: layers, request flow, services, invariants, where each rule lives.                                                                       |
| [data-model.md](data-model.md)     | before changing the schema or writing SQL                            | Compact table reference with columns, constraints and the `kind` semantics.                                                                                      |
| [components.md](components.md)     | before creating, moving or styling a component                       | Component folders and modules, placement and import rules, BEM class strings, cascade layers, breakpoints and SCSS mixins, and the lint rules that enforce them. |
| [conventions.md](conventions.md)   | before writing or reviewing code                                     | Code style: TypeScript, naming, server patterns, React and styling rules, money handling, testing expectations.                                                  |
| [workflows.md](workflows.md)       | when adding a feature, a table, an endpoint, a screen or a migration | Step-by-step checklists including the documentation updates each change requires.                                                                                |
| [docs-map.md](docs-map.md)         | when you changed behaviour and need to know which docs to update     | Map from code areas to the human docs (`docs/`), agent docs and README sections that describe them.                                                              |

Human-facing documentation is the Docsify site in `docs/` (start at `docs/README.md` and `docs/_sidebar.md`). Historical documents are in `docs/legacy/`. Temporary plans, scratch diagrams and intermediate outputs go in `temp/` (git-ignored except its README).
