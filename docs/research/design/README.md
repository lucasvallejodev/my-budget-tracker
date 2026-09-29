# Design research

> Summary: index of the UI and UX research: why CoinKeeper's interface is being redesigned, how the research was done, the pages to read in order (current UI review, visual direction, UI proposal with wireframes, finance UI patterns, design comparison), the 14 app design studies with their screenshots, and how to reuse the wireframes and keep the research current.

After roadmap phase 1 the product owner found the interface hard to read: a dashboard that shows everything at once, a category picker that makes review rows tall, an Analytics page with gaps, budget figures that look alike, accounts that all look the same, and a sidebar that mixes navigation with balances. This section studies how other finance apps present the same information and proposes a new interface for CoinKeeper, with wireframes of every main screen.

The [feature research](../README.md) decided what CoinKeeper should do; this section decides how it should look and read.

## Read in this order

| Page                                      | What it gives you                                                                                                                                                           |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Current UI review](current-ui-review.md) | The interface as built, screen by screen, with screenshots, the owner's eight issues and 15 findings ranked by severity                                                     |
| [Visual direction](visual-direction.md)   | Three directions compared on the same screen (private bank, modern bank, expressive), the recommendation, and the design language: colors, tokens, type, icons, logos, tone |
| [UI proposal](ui-proposal.md)             | The redesign: how each issue is solved, navigation, a wireframe with numbered callouts for every screen, components, data needs, a five-phase plan and open decisions       |
| [Finance UI patterns](ui-patterns.md)     | The evidence: color and contrast, money typography, dashboard hierarchy, budget figures, the category combobox, merchant logos, emoji, account types, navigation, density   |
| [Design comparison](comparison.md)        | The app studies side by side, screen by screen, with reference screenshots, CoinKeeper today next to the proposal, and what CoinKeeper takes from each app                  |

## How the research was done

- **Current state.** Every screen of the [demo account](../../getting-started/demo-account.md) was captured at 1440 px and 390 px wide, and the components behind each screen were read to separate design problems from data problems.
- **Other apps.** Fourteen apps were studied for design only (their features are covered by the [feature studies](../README.md#app-studies)): the owner's three references and Copilot, two online banks, four budgeting tools with strong web apps, and four consumer apps with a lighter, more expressive tone. Each study follows the same structure and embeds three to five screenshots of real product screens taken from the vendors' own sites, help centers and app store pages.
- **Patterns.** Accessibility standards, design systems and usability research were read for each recurring question, and contrast ratios and font features were measured rather than assumed.
- **Wireframes.** The proposed screens were built as static HTML pages with the demo account's data and exported to PNG.

## App design studies

Every study has the same sections: at a glance, visual identity, navigation and layout, home, accounts, transactions and categorizing, budgets, reports, what CoinKeeper could borrow, what not to copy, and sources.

### The owner's references and a close peer

| App                                                   | What the study covers                                                                                           |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| [Monarch Money](apps/monarch-money.md)                | Grouped accounts with change and sparklines, the assets and liabilities summary, reports tabs, emoji categories |
| [Rocket Money](apps/rocket-money.md)                  | Merchant logos in recurring payments and transactions, a friendly but clean dashboard                           |
| [Wallet by BudgetBakers](apps/wallet-budgetbakers.md) | A simple bank-style home, account cards, category lists with colored circles, statistics                        |
| [Copilot Money](apps/copilot-money.md)                | A polished visual style, the To review flow, budgets colored by pace                                            |

### Online banks

| App                        | What the study covers                                                             |
| -------------------------- | --------------------------------------------------------------------------------- |
| [Wise](apps/wise.md)       | Multi-currency balances, the activity list, the Wise design system                |
| [Mercury](apps/mercury.md) | A refined web dashboard, cash flow and insights charts, a dense transaction table |

### Budgeting tools on the web

| App                                          | What the study covers                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------ |
| [YNAB](apps/ynab.md)                         | The budget table with colored availability pills, accounts in the sidebar, reports   |
| [Lunch Money](apps/lunch-money.md)           | Overview, transactions table, category picker, multi-currency, trends                |
| [Quicken Simplifi](apps/quicken-simplifi.md) | Modular dashboard cards, the spending plan, projected balances                       |
| [Actual Budget](apps/actual-budget.md)       | Self-hosted and open source: sidebar accounts, category autocomplete, report widgets |

### Consumer apps with a lighter tone

| App                                    | What the study covers                                                                  |
| -------------------------------------- | -------------------------------------------------------------------------------------- |
| [Emma](apps/emma.md)                   | Merchant logos, category emoji, budgets and subscriptions                              |
| [Spendee](apps/spendee.md)             | Colorful category icons, wallet cards, budgets and overview charts                     |
| [PocketGuard](apps/pocketguard.md)     | The Leftover hero number with pace in words, budgets, bills with date tiles            |
| [Toshl Finance](apps/toshl-finance.md) | Playful marketing around a plain app: word-only categories, budgets with today markers |

## Files

| Path                               | Content                                                                                                                                                                                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/research/design/wireframes/` | The wireframe pages (`home.html`, `transactions.html`, `review.html`, four `analytics-*.html`, `budgets.html`, `accounts.html`, `home-mobile.html`, `directions.html`) and their shared `wireframes.css` and `wireframes.js` |
| `docs/assets/design/wireframes/`   | The wireframes exported to PNG                                                                                                                                                                                               |
| `docs/assets/design/current/`      | Screenshots of the current interface                                                                                                                                                                                         |
| `docs/assets/design/references/`   | Screenshots from the app studies (`<app>-<screen>.jpg`) and the pattern examples (`pattern-<name>.jpg`)                                                                                                                      |

The wireframes load Inter from Google Fonts, Lucide icons from unpkg and two brand glyphs from the Simple Icons CDN, so they need a network connection to render. Add `?clean` to a wireframe's address to hide the numbered callouts.

## Keeping the research current

The studies describe the apps as their vendors presented them in September 2026, and the screenshots show those vendors' products, which remain their property; they are kept here only to compare designs. When a phase of the [UI proposal](ui-proposal.md) ships, update the proposal's plan and the feature pages in `docs/features/`, not the app studies. Replace a wireframe PNG when its HTML changes, so the two never disagree.
