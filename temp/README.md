# temp/

> Summary: scratch space. Everything here except this file is git-ignored and can be deleted at any time.

Put here anything that is useful while working but is not part of the product or its documentation:

- plans and task breakdowns for a feature before it is implemented;
- diagrams or sketches made to explain an idea (HTML, SVG, PNG, Mermaid);
- intermediate outputs: exported data, generated reports, screenshots before they are placed in `docs/assets/screenshots/`;
- notes from an investigation.

Rules:

- Never reference files in `temp/` from `docs/`, `agents/`, `README.md` or the source tree; move what needs to last into the right place first.
- Prefer one subfolder per task (for example `temp/2026-09-import-wizard/`) so it can be removed as a unit.
- Do not store secrets or real financial exports here; the folder is ignored by git, not encrypted.
