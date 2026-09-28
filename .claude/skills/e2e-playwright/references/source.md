# Sources

> Summary: upstream material this skill was built from, its license, and what was changed.

| Upstream file                                                                              | License    | Used for                                                                                                                    |
| ------------------------------------------------------------------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| [mindrally/skills](https://github.com/mindrally/skills) `playwright/SKILL.md`              | Apache-2.0 | Locator priority, web-first assertions, no hard-coded timeouts, `waitForResponse`, trace on first retry, independent tests. |
| [mindrally/skills](https://github.com/mindrally/skills) `playwright-cursor-rules/SKILL.md` | Apache-2.0 | Parallel-safe tests without shared state, `devices` descriptors for extra projects, no inline code comments.                |

The Apache-2.0 material was modified: only the ideas above were kept and rewritten for CoinKeeper. Removed or reversed upstream advice: signing in with fixed credentials (`user@example.com` / `password123`) through the UI, a three-browser plus iPhone project matrix by default, `testDir: './tests'`, JSDoc on helpers and Arrange/Act/Assert comments. The journeys, the throwaway-user and API-seeding fixtures, the auth rate limit, the origin header, money and date assertions, the widget table, the mobile and axe setup, the built-image run and the flaky-test policy were written for this repository.
