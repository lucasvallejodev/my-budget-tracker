---
name: pr-description
description: Write the title and description of a pull request for the current branch in CoinKeeper's house format (Changelog with ADDED/REMOVED/MODIFIED lines, TL;DR, breaking changes, review focus, real check results, out of scope, and a collapsible preview of screens and endpoints). Use when the user asks for a PR title, PR description, pull request text, or to open a PR.
---

# Pull request description

Produce a title and a body for the pull request of the current branch, following `template.md`. Everything you write must be true for this branch: read the commits and the diff, run the checks, and never tick a box you did not see pass.

## 1. Gather the facts

1. Find the base branch: the one the user names, otherwise `main`. Run `git fetch origin <base>` if a remote exists (ignore failures offline).
2. Read what the branch changes:
   - `git log --oneline <base>..HEAD` (commit subjects and bodies: `git log <base>..HEAD --format='%s%n%b'`)
   - `git diff --stat <base>...HEAD` and, for areas you need to understand, `git diff <base>...HEAD -- <path>`
   - `git status --short`: if there are uncommitted changes, tell the user they are not part of the PR.
3. Read the docs the branch touched (`docs/`, `agents/`, `README.md`) for the motivation in the authors' own words, and `docs/reference/rest-api.md` when endpoints changed.
4. Note, for the optional sections:
   - **Breaking changes:** renamed or removed env vars, new required env vars, migrations that need a reset or a manual step, removed endpoints or changed response shapes, changed commands, new prerequisites (Node version, services).
   - **Risky areas:** authentication, sessions, cookies, origin/CORS, permissions and ownership checks, money parsing and rounding, migrations, deletes, anything touching many users' data.
   - **UI changes:** new or changed screens (`apps/web/src/components/**`, `apps/web/src/app/**`).
   - **API changes:** new or changed routes (`apps/api/src/routes/**`, `packages/shared/src/schema/**`).

## 2. Run the checks

Run the project gate from the repository root, one command at a time so you can report each result:

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run build
npm run test:e2e
```

- Record the real numbers: lint errors and warnings, the Vitest `Tests  N passed (N)` line, the e2e `N passed` line.
- `test:e2e` needs a migrated database in `DATABASE_URL` (see `docs/architecture/testing.md` › End to end). If it cannot run, leave the box unticked and say why after it.
- A failing check stays `- [ ]` with the failure in one short clause. Do not hide failures and do not re-run until green without telling the user.
- If the user says to skip the checks, list them unticked with "not run".

## 3. Write the title

`<type>(<scope>): <summary>`, like the repository's commits.

- `type`: `feat`, `fix`, `refactor`, `perf`, `build`, `ci`, `docs`, `test` or `chore`: the most important change in the branch wins.
- `scope`: optional; the main area (`api`, `web`, `shared`, `auth`, `ledger`, …). Omit it when the branch spans everything.
- `summary`: imperative, lower case after the colon, no final period, at most 72 characters for the whole title. Say what the PR achieves, not how (`replace Clerk with self-hosted sessions`, not `add sessions.ts`).

## 4. Fill the template

Copy `template.md` and fill it section by section. Delete every section marked optional that has nothing true to say, together with its heading. Do not leave placeholders or "N/A".

- **Changelog:** one line per feature or module, never per file. Start each line with `ADDED:`, `REMOVED:` or `MODIFIED:` and give the motivation in the same line (`MODIFIED: deletes of financial data are now soft so nothing is lost and anything can be restored`). Group by importance, most important first; 3–10 lines for most PRs.
- **Description:** the TL;DR in 2–4 sentences a reviewer can read in 20 seconds: what changes for users and for developers, and why.
- **Additional Information** (optional): the longer story only when the TL;DR cannot carry it: decisions and their trade-offs, how pieces fit together, links to the docs pages that explain more (relative repository paths).
- **⚠️ Breaking changes and required actions** (optional): unticked checkboxes, each an action someone pulling the branch must take, with the exact command or variable name.
- **What to review closely** (optional): risky files or areas, highest risk first, each with one clause on what could go wrong there. Link paths as `path/to/file.ts`.
- **Checks:** the five gate boxes with the real results from step 2 (`- [x] 402 tests`, `- [x] lint (0 errors, 21 warnings)`).
- **Out of scope** (optional): things a reviewer might expect that this PR deliberately does not do, and known follow-ups.
- **Preview** (optional, only for UI or API changes): see below.

Style: plain, precise English; no marketing words; no emoji except the ⚠️ in the heading; no file-by-file walkthroughs outside "What to review closely". Do not add any AI attribution, "Generated with" line or co-author trailer (see `CLAUDE.md` › Commits).

## 5. Preview section

Everything in Preview goes inside `<details>` blocks so the PR page stays short.

**Screens.** For each new or changed screen, capture it at three viewports with the browser tools, using a local run (`npm run dev`, a throwaway account from the sign-up page as `CLAUDE.md` › Known constraints describes):

- phone `375×812`, tablet `768×1024`, desktop `1440×900` (`resize_window`, then `screenshot`); reset to desktop when done.
- Save the images to `temp/pr/<branch>/` (`<screen>-<viewport>.png`). GitHub only shows images that are uploaded to it, so in the body put one `<details>` per screen with a line per viewport, `<!-- drag temp/pr/<branch>/<screen>-phone.png here -->`, and tell the user which files to drag into the PR editor. Never link to `temp/` paths as if they were published.
- If the app cannot be run, keep the `<details>` with a one-line description of the change instead of images and say so.

**Endpoints.** For each added or changed endpoint, one collapsed block in the format of `endpoint-preview.md` (method and path in the summary; parameters, body, responses and status codes inside). Take the shapes from `packages/shared/src/schema/` and `docs/reference/rest-api.md`; mark changed endpoints with `MODIFIED` and describe what changed. With more than about 10 endpoints, group them by resource in an outer `<details>` per resource.

## 6. Deliver

1. Write the result to `temp/pr/<branch>.md` (title on the first line as `# <title>`, then a blank line, then the body).
2. Show the user the title and the full body in a fenced `markdown` block, then list: checks that failed or did not run, screenshots to drag in, and anything you were unsure about.
3. Only if the user asks to open the PR: push is required first (ask before pushing if they did not say so), then `gh pr create --base <base> --title "<title>" --body-file <file without the title line>`. Never pass `--fill`. Report the PR URL.
