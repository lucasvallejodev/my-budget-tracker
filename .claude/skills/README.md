# Project skills

> Summary: index of the Claude Code skills that live in this repository, one line each, with when to use them.

Each skill is a folder with a `SKILL.md` (frontmatter `name` and `description`, then the instructions) and the files it references. Claude Code loads them automatically for this project; invoke one with `/<name>` or let it trigger from its description. Keep this table in sync when a skill is added, renamed or removed.

| Skill                                       | Use it when                                                                                                   | Files                                                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [`pr-description`](pr-description/SKILL.md) | Writing the title and description of a pull request for the current branch (optionally opening it with `gh`). | `SKILL.md` (steps and rules), `template.md` (the body to fill), `endpoint-preview.md` (accordion format for API changes) |
