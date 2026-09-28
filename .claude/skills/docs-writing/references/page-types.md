# Page types

> Summary: the four Diátaxis page types mapped onto CoinKeeper's docs folders, a template for each (feature page, architecture page, reference page, getting-started page), and how agent docs, README sections, skill files and PR text differ.

## Decide the type

| The reader…                               | Type        | Folder in `docs/`                                         | Title pattern                                |
| ----------------------------------------- | ----------- | --------------------------------------------------------- | -------------------------------------------- |
| is new and wants to get something running | tutorial    | `getting-started/` (setup)                                | a goal: "Setup"                              |
| has a task to finish                      | how-to      | `getting-started/` (commands), `features/` "Step by step" | the task or the feature name                 |
| needs to look up a fact                   | reference   | `reference/`                                              | the thing: "REST API", "Database migrations" |
| wants to understand why it works this way | explanation | `architecture/`, `features/` "How it works"               | the concept: "Money and currencies"          |

Feature pages are the one deliberate mix: a short "what it is" explanation, a numbered how-to ("Step by step"), then an explanation of the mechanics ("How it works"). Keep those three parts separate inside the page, and push anything longer (full endpoint tables, schema details) to `reference/` or `architecture/` with a link.

Warning signs that a page mixes types: a reference table in the middle of steps, a paragraph of design rationale inside a numbered step, instructions inside an architecture explanation. Move the part to the page of its type and link to it.

## Templates

Every page starts with the title and the Summary line:

```markdown
# Budgets

> Summary: monthly spending limits per category and currency, compared with what the ledger recorded; deleting a limit and bringing it back.
```

### Feature page (`docs/features/<name>.md`)

1. `## What <it> is`: two to four sentences in user terms, linking the related features.
2. `## Step by step`: a numbered list of what the user does, with UI labels in bold (`**Copy last month**`), one action per step, and a screenshot placeholder after the list.
3. Optional task sections (`## Re-importing`, `## Supported formats`) for secondary tasks.
4. `## How it works`: bullets that name the table, service, endpoints and rules (`apps/api/src/modules/budgets/service.ts`, `DELETE /api/v1/budgets/:id`), with soft delete and restore behavior spelled out.

Add the page to the Features section of `docs/_sidebar.md`, in the order the sidebar already uses.

### Architecture page (`docs/architecture/<concept>.md`)

Context → the concept → how the code applies it → trade-offs and rejected alternatives → links to reference pages. Headings name concepts ("Soft deletes", "Errors", "Configuration"). Code blocks show the real shape of a type or a call, taken from the source. This is also where "Adding an endpoint" style checklists for developers live, because they explain the conventions they apply.

### Reference page (`docs/reference/<thing>.md`)

One repeatable format per entry, usually a table: name, parameters, body, response, status codes, notes. No narrative beyond a short introduction and a Conventions section. Sort entries the way readers look for them (by resource, then by verb). The REST API page must agree with the Zod contracts in `packages/shared/src/schema/` and the routes in `apps/api/src/routes/`.

### Getting-started page (`docs/getting-started/<task>.md`)

Prerequisites table, then numbered steps with a command per step and the expected result ("Then open http://localhost:3000 and create an account"). Every command is copy-pasteable from the repository root. Troubleshooting goes at the end as symptom → fix pairs.

## Other prose in the repository

| Where                    | How it differs                                                                                                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents/*.md`            | Condensed rules for agents: imperative, one fact per bullet, paths and helper names, no story. Link the human page for the why. Keep them consistent with `docs/`; `agents/README.md` indexes them.  |
| `README.md`              | Repository layout, setup, commands, pointers to the docs. Update it when folders, setup steps or commands change; keep the long explanations in `docs/`.                                             |
| `.claude/skills/<name>/` | Frontmatter `name` and a third-person `description` (what it does, when to use it, when a sibling skill applies instead); imperative body; references one level deep, each with a `> Summary:` line. |
| PR descriptions          | Structure comes from the `pr-description` skill and its `template.md`; this skill only governs the sentences (voice, concision, no filler, no AI attribution).                                       |
| code comments and TSDoc  | Not prose documentation: comments are banned and TSDoc in `lib/` folders follows `agents/conventions.md` › Documentation comments.                                                                   |
