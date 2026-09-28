---
name: docs-writing
description: Writes, updates and reviews CoinKeeper's prose documentation, meaning the Docsify site in docs/, the agent docs in agents/, README.md, skill files and pull request text. It picks the right page type (Diátaxis mapped onto docs/getting-started, features, architecture and reference), applies the house structure (a "> Summary:" line on every page, a docs/_sidebar.md entry for new pages, agents/docs-map.md to find what a code change affects, screenshot placeholders, docs/legacy frozen, never linking temp/) and the house writing style (active voice, no filler words, sentence-case headings, tagged code blocks, named links, no AI tells). Use when the user asks to document a feature or change, update or review the docs, write a README or agent doc section, fix the tone of a page, or when a code change needs its documentation updated. Not for the PR template itself (use pr-description), code comments or TSDoc (see agents/conventions.md), or diagrams (use the diagram-design plugin).
---

# Docs writing

Documentation in this repository changes in the same change as the code (`CLAUDE.md` rule 3). This skill decides which pages a change touches, what kind of page each one is, and how the text should read. Facts come from the code and the diff, not from memory: open the file you describe.

## Before you start

- `agents/docs-map.md`: which human docs, agent docs and README sections describe the code you changed.
- `agents/workflows.md` › the checklist for your kind of change (feature, endpoint, screen, documentation-only).
- The page you will edit, top to bottom, and one sibling page of the same type for tone and structure.

## Workflow

1. **List the pages.** From the changed paths, collect every row of `agents/docs-map.md` that matches, and name those rows in your answer (Grep finds extra mentions, but the map is the source of which pages own the topic). Add a new page only for a new feature, command family or concept; otherwise extend the existing page.
2. **Pick the page type** with [references/page-types.md](references/page-types.md). One page, one type. If a paragraph belongs to another type, move it to that page and link to it.
3. **Write or edit** following the page-type template and [references/style.md](references/style.md). Keep the first line after the title a `> Summary:` line that still matches the page after your edit.
4. **Place placeholders** for screenshots of any new or changed screen: `<!-- screenshot: what to capture (docs/assets/screenshots/<name>.png) -->`. Never invent image files.
5. **Wire it up**: new page → `docs/_sidebar.md` entry in the right section; new code area → a row in `agents/docs-map.md`; new agent doc → a row in `agents/README.md`; changed commands, folders or setup → `README.md`.
6. **Agent docs** (`agents/*.md`) get the condensed rule, not the story: what to do, where, which helper; link the human page for the why.
7. **Review your own text** with the checklist in [references/checklist.md](references/checklist.md), then verify.

## House rules that are easy to miss

- Every page in `docs/` and `agents/` starts with `# Title` and then `> Summary: …` (one sentence, lower case after the colon, what the page covers). Keep it accurate; tools read it with `head -3`.
- `docs/legacy/` is frozen history: never edit a file there; add a new file if history must be recorded.
- Never link to `temp/` from a tracked file, and never put plans, scratch notes or reports in `docs/` or `agents/`.
- Links are relative repository paths (`../reference/rest-api.md`, `dashboard.md`), with descriptive link text.
- Code identifiers, paths, commands, env vars and HTTP routes go in backticks and must exist: check with Grep before naming them.
- Money examples use minor units and a currency (`amountMinor: -1250` with `EUR`), never floats, and never add different currencies.
- Diagrams: Mermaid fences render in the Docsify site; editorial SVGs come from the `diagram-design` plugin into `docs/assets/diagrams/`.
- No emoji, no dates like "as of …", no AI attribution in docs or PR text.

## References

| File                                      | Read it when                                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [page-types.md](references/page-types.md) | Deciding what kind of page you are writing and which template and folder it uses.                  |
| [style.md](references/style.md)           | Writing or reviewing sentences: voice, banned words, headings, lists, code blocks, links, numbers. |
| [checklist.md](references/checklist.md)   | Before you finish: structure, wiring, facts and style checks, and the review output format.        |
| [source.md](references/source.md)         | Checking where an idea came from and what was changed from upstream.                               |

## Reviewing instead of writing

When asked to review a page, do not rewrite it silently. Report findings as `path:line  rule  suggested text`, grouped by file, highest impact first (wrong facts, then structure, then style), and end with the count per category. Apply the fixes only when asked.

## Verify

```bash
npx prettier --write <changed .md files>
npm run format:check
```

- Run Prettier on the files you changed, not on the whole tree, so nothing in `docs/legacy/` is rewritten.
- Grep your changed files for `temp/` and for placeholder text you meant to replace.
- Open every relative link you added (the target file must exist) and every code path you named.
- If code changed in the same task, also run `npm run lint && npm run typecheck && npm test -- --run && npm run build`.
- To see the rendered site, `npm run docs` serves it on port 3010.

## Keep the docs true

This skill is how that rule is applied. If nothing in the docs is affected by a change, say so explicitly in the final message, naming the `agents/docs-map.md` rows you checked.
