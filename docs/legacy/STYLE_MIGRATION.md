# Fundex component and SCSS migration

Started: 2026-09-05. Reference: https://fundex.demos.tailgrids.com/

## Scope and decisions

- Use `src/components` (the existing directory; `src/compoents` in the request is treated as a typo).
- Reimplement the observed design in original React components and SCSS modules. Keep Radix for dialogs, popovers, selects, tabs, switches and accessible focus/keyboard handling.
- Preserve Clerk authentication, Prisma data access, React Query and existing creation workflows.
- Global SCSS is limited to reset, typography and theme tokens. Component styles are locally scoped modules.
- Reference-only features without project services are demonstrated with explicitly labeled sample data in `/test`, not presented as connected financial services.

## Reference inventory

All five linked pages and all seven Settings tabs were visited in the browser. Light and dark themes were inspected.

| Page                         | Observed blocks                                                                                                           | Planned implementation                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Shared                       | Sidebar, active links, upgrade panel, logout, search, theme toggle, notifications, account menu                           | Application shell, promotion panel, theme switch, Radix popover, Clerk account control                 |
| Dashboard `/`                | Heading, income/expense metrics, cash flow area chart, recent transactions, gradient balance, card carousel, budget donut | PageHeading, MetricCard, CashFlowChart, TransactionTable, BalanceCard, PaymentCards, DistributionChart |
| Transactions `/transactions` | Export buttons, search, date/category/type/status filters, status badges, row menu, pagination                            | TransactionExplorer, StatusBadge, Radix menu, Pagination, CSV export/print                             |
| Analytics `/analytics`       | Three metrics, cash flow, top expenses donut/legend, budget progress, target gauge                                        | MetricCard, CashFlowChart, DistributionChart, BudgetProgress, TargetCard                               |
| Budgets `/budgets`           | Four metrics, monthly donut, insight list, category cards, status/progress, edit/view/reset/delete actions                | BudgetOverview, BudgetInsights, CategoryBudget, budget editor                                          |
| Settings: Profile            | Photo, personal information, currency/language/timezone                                                                   | ProfileSettings, SettingsSection, Field                                                                |
| Settings: Cards & Accounts   | Card list, primary badge, linked accounts                                                                                 | PaymentCards, PaymentCardList, LinkedAccount                                                           |
| Settings: Security           | Password, 2FA, biometric rows, sessions, last login                                                                       | PreferenceRow, SessionList (Clerk manages real security)                                               |
| Settings: Notifications      | Four switches, delivery radio group                                                                                       | NotificationSettings                                                                                   |
| Settings: Data Management    | CSV/PDF export, reports, clear cache                                                                                      | DataSettings                                                                                           |
| Settings: App Preferences    | Dashboard/date/number formats and appearance                                                                              | AppPreferences                                                                                         |
| Settings: Legal & Support    | Help/privacy/terms/contact rows and version footer                                                                        | SupportLinks                                                                                           |

Reference observations: purple accent around #8b5cf6, 280px sidebar, 80px top bar, 24px content spacing, 16–20px panel corners, gray #f3f4f6 canvas, white panels, subtle borders, green/red/amber status pills. Dark theme uses near-black panels and navy canvas. Several reference buttons (including Add Budget) did not expose a new UI when clicked; do not invent additional discovered pages.

## Step 1 — Generate reusable components

- [x] Inspect project and reference navigation, pages and settings tabs.
- [x] Record design inventory and migration plan.
- [x] Add Sass and SCSS theme tokens.
- [x] Build original controls on Radix and semantic HTML.
- [x] Build every block in the inventory and a sample gallery.

## Step 2 — Implement throughout the project

- [x] Replace navigation, header, dashboard, transaction listing and accounts UI.
- [x] Replace creation dialogs, pickers, expense components and auth layouts.
- [x] Add analytics and settings surfaces; replace budget placeholder.
- [x] Preserve data loading, validation, mutations and authentication.
- [x] Verify responsive layout, dark mode, keyboard controls, loading/error/empty states.

## Step 3 — Remove old styling system

- [x] Remove `src/components/ui` after all consumers have migrated.
- [x] Remove Tailwind packages, animation helpers, merge helper, shadcn config and PostCSS config.
- [x] Audit source for old imports, utility strings and dynamically constructed utility colors.
- [x] Run type checks, lint, tests and production build; record limitations accurately.

## Verification and handoff log

The three styling migration steps are complete. The runtime limitations below remain outside this styling migration.

### What was delivered

- `src/components/primitives`: original SCSS controls, Radix dialog/popover/select/tabs/switch wrappers, accessible form labels/errors, searchable entity picker, and an independently styled date picker.
- `src/components/finance`: headings, panels, metrics, balance cards, payment carousel and card list, charts, progress indicators, budgets, transaction filters/table/pagination/export, and all seven settings sections.
- `src/components/shell`: responsive navigation, mobile drawer, top bar, account control, theme toggle and shared shell styles.
- `src/styles/tokens.scss` and `src/app/globals.scss`: light/dark theme tokens, typography and reset. All component styling uses `.module.scss`.
- `/test`: reviewable component gallery covering Dashboard, Transactions, Analytics, Budgets and Settings with clearly labeled sample data.
- Existing routes, creation dialogs, account/payee/category pickers, expense components and authentication layout now use the replacement system.
- Removed the 45 shadcn UI source files, the shadcn mobile hook, `components.json`, old global CSS, Tailwind/PostCSS configuration, Tailwind packages, merge/variance helpers and unused shadcn-only widget dependencies. Radix remains installed. Generic PostCSS remains a dependency; it is not a Tailwind integration.

### Related integration corrections

- Picker values now follow form state, so cancel/reset clears the visible selection. Newly created accounts select by ID.
- Select labels and validation messages attach to the actual trigger; custom pickers forward accessibility attributes. Incidental buttons do not submit forms.
- Account detail lookup is scoped to the authenticated owner and excludes deleted accounts.
- The transaction read endpoint no longer truncates results to 20, so analytics, search and CSV export can use all returned history. A future large-data implementation should add server pagination and aggregate endpoints.
- Migrated the existing ESLint config to the installed Next.js flat configuration and accepted platform-native line endings to avoid unrelated CRLF-only failures.
- Declared the already-used React Query runtime package directly for production installs.

### Validation

- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm test -- --run`: 20 tests passed (16 existing date tests and 4 new interaction tests).
- `npm run build`: passed, including all application routes and SCSS compilation.
- Source/package audit: no Tailwind imports, directives, utility strings, shadcn imports or `components/ui` consumers remain.
- Browser: inspected authenticated gallery in light/dark themes; verified card carousel, settings tabs, notification controls, mobile drawer and page widths at a 390px viewport (375px content area with scrollbar, with no horizontal page overflow).
- Browser: opened the real transaction form, selected a category, cancelled/reopened to verify reset, opened the calendar, and dismissed it with Escape. No financial records were created during checks.
- Browser testing found a CSS ordering issue on the mobile-only menu button; fixed with a scoped modifier selector. Reset the temporary viewport after testing.

### Known service limitations

- The existing Prisma runtime reports **“Accelerate is not enabled or it is improperly configured.”** Account and transaction API calls fail in this environment. Loading/error states were verified; successful database reads/writes could not be verified. Database credentials/configuration were not changed.
- Budgets are a clearly labeled in-memory planner preview. Payment-card management, notification delivery, session samples and regional preferences are preview components because the project has no corresponding services. They do not claim to persist changes or perform banking operations.
- Real profile and security management continue through Clerk. The app-wide appearance setting is functional and persists in browser storage.
- PDF export uses the browser print/save-to-PDF flow; CSV export downloads the filtered rows. A dedicated PDF report renderer was not added.
- The build still emits the existing Next.js middleware-convention deprecation warning; this does not prevent compilation.

### Guide for future changes

1. Review `/test` while signed in to compare component states without relying on the database.
2. Change shared colors in `src/styles/tokens.scss`; change block layouts in their adjacent SCSS modules.
3. Compose finance blocks with actual data through props; keep sample fixtures in `sample-data.ts`.
4. Follow `DRIZZLE_MIGRATION.md` to start local PostgreSQL and apply migrations before validating real account/transaction submissions.
5. Add budget/preference/card services separately, then replace preview state with those integrations.
6. Run lint, tests and the production build after extending the component system.

### Follow-up: modal handoff and calendar (2026-09-05)

- [x] Hide parent dialogs while a nested dialog is open, preserving their form state.
- [x] Close account/payee picker popovers before opening creation dialogs; restore focus to the picker when dismissed.
- [x] Keep nested select and popover menus above their owning dialog.
- [x] Replace native From/To date inputs with the shared Radix popover and SCSS calendar, including Clear, Today, and minimum-date restrictions.
- [x] Verify draft preservation, focus restoration, picker dismissal, date filtering, and Escape dismissal: 5 interaction tests passed. TypeScript, lint, and production build passed.
- These follow-up checks were automated; authenticated browser creation/submission was not repeated.
