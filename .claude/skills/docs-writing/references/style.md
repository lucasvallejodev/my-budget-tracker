# Writing style

> Summary: the sentence-level rules for CoinKeeper's docs, agent docs, README, skills and PR text: voice, words to cut, AI tells, headings, lists, code blocks, links, numbers and units, spelling and punctuation.

## Voice

- Active voice, present tense: "The service rejects a zero amount", not "A zero amount will be rejected by the service".
- Address the reader as "you" in `docs/`; write steps and agent docs in the imperative ("Run", "Add", "Open").
- Say what happens, then why, in that order. One idea per sentence; split sentences that need two commas and a semicolon.
- State rules as rules: "must" and "never" when the code enforces it, "can" for options. Do not hedge with "should probably", "may want to", "it is recommended that".
- No rhetorical questions, no exclamation marks, no jokes in reference or architecture pages.

## Words to cut or replace

| Instead of                                                | Write                                     |
| --------------------------------------------------------- | ----------------------------------------- |
| simply, just, easy, easily, obviously, of course, clearly | (delete; the reader decides what is easy) |
| very, really, quite, basically, actually                  | (delete, or use a precise word)           |
| in order to                                               | to                                        |
| utilize, leverage                                         | use                                       |
| a number of, various                                      | the number, or "several"                  |
| please note that, it is important to note                 | (delete; state the fact)                  |
| allows you to                                             | lets you, or name the action              |
| etc.                                                      | the full list, or "such as" with examples |

## AI tells to remove

Agent-written text drifts into patterns readers notice. Remove:

- filler adjectives: robust, seamless, powerful, comprehensive, crucial, cutting-edge, delightful;
- "delve", "dive into", "navigate the complexities", "in today's …", "whether you are X or Y";
- "Let's …", "In this guide we will …", "In summary …", "Overall …" and closing paragraphs that repeat the page;
- "It is worth noting", "Not only … but also", three-item lists written for rhythm rather than content;
- bold scattered over ordinary phrases; headings with a colon and a subtitle;
- emoji, and claims about the author ("As an AI …").

## Headings

- Sentence case: "How it works", "Step by step", "Adding an endpoint". Proper nouns and code keep their case (`TanStack Query`, `ServiceError`).
- One `#` title per page; do not skip levels; no punctuation at the end.
- Descriptive, so the sidebar (`subMaxLevel: 3` in `docs/index.html`) reads as a table of contents: "Soft deletes", not "Notes".

## Lists and tables

- Introduce a list with a sentence ending in a colon.
- Items are parallel (all verbs, or all nouns). Fragments take no final period; full sentences do.
- Numbered lists only for sequences the reader follows in order; bullets otherwise.
- Tables for anything with two or more attributes per entry (commands, variables, endpoints, files). Header row in sentence case; an empty cell says "none" (older tables such as `agents/docs-map.md` use `—`; keep them consistent until a row is edited).

## Code blocks

- Always tag the language: `bash`, `ts`, `tsx`, `json`, `scss`, `sql`, `markdown`.
- Keep a block under about 25 lines; the sentence before it says what it shows.
- Commands are copy-pasteable from the repository root, without a `$` prompt; placeholders use angle brackets (`<email>`, `<token>`).
- TypeScript snippets follow the house code style (single quotes, semicolons, `type`, arrow functions, named constants, no comments) so they can be pasted into the codebase; a deliberately wrong example is labeled as such in the sentence before it.
- Inline code for identifiers, paths, env vars, routes and literal values (`DELETE /api/v1/budgets/:id`, `SESSION_DAYS`).

## Links

- Link text says where it goes: a link to `docs/architecture/api.md` reads "see API service › Errors", never "click here" or a bare path as text.
- Relative repository paths for everything inside the repository; the `›` character separates a page from a section, as existing pages do.
- Bare URLs only for local addresses the reader types (`http://localhost:3000`).
- Never link to `temp/` or to files outside the repository that the reader cannot open.

## Numbers, units and money

- Numerals with a space before the unit: `64 KB`, `200 ms`, `30 s`, `19 MiB`, `2 MB`.
- Ranges with "to" in prose ("12 to 128 characters"); an en dash is acceptable in tables.
- Money in prose is formatted with its currency ("12.50 EUR" or "−12.50 €"); in code it is minor units (`amountMinor: -1250`). Never show a float amount and never add two currencies.
- Percentages without a space (`80%`), matching existing pages.

## Spelling and punctuation

- American English in new and edited text (`color`, `behavior`, `organized`, `catalog`, `canceled`, `defense`). Older pages use British spelling: convert the sentences you edit, and do not respell whole pages as a side effect of an unrelated change. Identifiers, paths and UI labels keep the spelling the code uses (`normaliseEmail`, `aria-label="Colour"`).
- The ellipsis character `…`, not three dots.
- No em dashes (`—`) in new text, neither as sentence punctuation nor in tables. Use a colon, a semicolon, parentheses or a new sentence; write "none" in an empty table cell. Existing em dashes stay until you edit that sentence or row.
- Straight quotes in Markdown source.
- Do not hard-wrap paragraphs: one paragraph per line. Prettier keeps prose as written (no `proseWrap` setting in `.prettierrc.js`).
- UI labels in bold exactly as the screen shows them (`**Copy last month**`).
