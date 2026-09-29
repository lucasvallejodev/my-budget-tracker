# Monarch Money design

> Summary: Monarch's web app is a calm, warm-gray desktop layout with one orange action color, emoji categories and institution logos; CoinKeeper should borrow its grouped Accounts page with a per-group change, sparklines and an Assets and Liabilities summary, its Budget table with a colored Remaining pill, and its Cash Flow, Spending and Income report tabs.

Monarch is the owner's reference for a clean web layout, and among the owner's four favorites it is the only one whose web app is its most complete surface. Its Accounts page is the direct model for the grouped accounts, sparklines and summary bars the owner asked for. The features themselves are covered in the [Monarch Money feature study](../../apps/monarch-money.md); this page looks only at design and hierarchy.

## At a glance

|                  |                                                                                                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surfaces studied | web (help center screenshots and the marketing site); iOS marketing shots for comparison                                                                    |
| Tone             | Close to a modern bank: neutral and quiet, warmed up by a first-name greeting, an orange accent and category emoji                                          |
| Color            | Orange brand and primary action; green for gains and money left, red for losses and overspend; category-group colors only in charts and the Summary bars    |
| Type             | A neutral grotesque sans for UI (the marketing site loads ABC Oracle, with a serif only in marketing headings); amounts right-aligned in their own column   |
| Iconography      | Outline icons in navigation, one emoji per category, round institution logos for accounts and round merchant logos for transactions                         |
| Best idea for us | The Accounts page: one card per account group with a group total and 1-month change, a sparkline per account, and Assets versus Liabilities as stacked bars |

## Visual identity

The canvas is a warm light gray (approximately `#F2F2F0`) with white cards that have a soft shadow and a large radius (about 12 px). Borders are rare: cards separate by background contrast, rows by hairline dividers.

Color has four clear roles:

- **Brand and action**: orange (approximately `#F85A34`) fills the single primary button per page (**Add account**, **Add transaction**), the active tab underline, the Recurring count badge and the AI entry points. Secondary buttons are white with a gray outline.
- **Positive**: green (approximately `#3D9A5B` for text, `#E8F6E9` for tinted backgrounds) marks gains, income and money left.
- **Negative**: red (approximately `#D2563F`) marks overspend and losses, as text and as a tinted pill.
- **Data**: saturated category colors appear only inside charts and the Summary bars (investments cyan `#8BE0F6`, real estate purple `#8142BE`, cash green `#4E9472`, vehicles orange `#FE5A26`, loans yellow `#FABF30`, credit cards red `#DA6043`, all approximate).

Typography is one sans family at three or four sizes. Page titles are small (about 20 px, semibold), because the numbers carry the hierarchy: the net worth figure on Accounts and **Left to budget** on Budget are the largest text on their pages. Secondary text is a mid gray.

Iconography mixes three sources. Navigation uses thin outline icons. Categories use an emoji each, which users can change in Settings › Categories. Accounts and transactions show round logos of the bank or merchant; Settings › Merchants lets you rename a merchant and change how it displays, and an unknown merchant falls back to a gray circle with a building glyph.

On the formal-to-playful scale Monarch sits at about one third: a bank-like structure with small doses of warmth (greeting, emoji, orange).

## Navigation and layout

A left sidebar of about 280 px holds only navigation: **Dashboard**, **Accounts**, **Transactions**, **Cash Flow**, **Reports**, **Budget**, **Recurring** (with an orange count badge), **Goals**, **Investments**, **Forecasting** and **Advice**. The top row carries the logo and icon buttons for search, notifications, settings and collapsing the sidebar to an icon rail. The bottom holds **AI Assistant**, **Help & Support**, a referral link and the user menu.

Accounts do not appear in the sidebar at all. They live only on the Accounts page, which keeps the sidebar unambiguous: everything in it is a place.

Page headers follow one pattern: a plain title on the left, then on the right a row of white outline buttons (**Sort**, **Filters**, **Date**, **Edit rules**) and one orange filled button for the main action. Pages with sub-views put tabs next to the title (**Budget** and **Forecast**; **Cash Flow**, **Spending** and **Income**). Period navigation on Budget is arrows plus a **Today** button beside the month name.

## Home and overview

[![Monarch web dashboard with the sidebar, Weekly Recap, investments and spending cards](../../../assets/design/references/monarch-money-dashboard.jpg)](../../../assets/design/references/monarch-money-dashboard.jpg ':ignore')

_Dashboard, Monarch help center. What to notice: a two-column grid of equal cards with no single headline number, which is the weakness CoinKeeper already has._

The dashboard opens with a greeting and a **Customize** button. Below is a two-column grid of cards: Weekly Recap, investments with top movers, a spending line (this month against last month), recent transactions, budget, net worth, recurring, goals and more. The Customize dialog lists eleven widgets with drag handles and toggles, and web and mobile keep separate orders.

There is no "one number". Each card has its own small headline (**-$20.00 this month**, **$486,131 investments**), so the page reads as a feed rather than an answer. The Budget page and the Accounts page are where Monarch commits to a hero figure.

## Accounts

[![Monarch Accounts page with net worth chart, Cash group with sparklines and the Summary panel](../../../assets/design/references/monarch-money-accounts.jpg)](../../../assets/design/references/monarch-money-accounts.jpg ':ignore')

_Accounts, Monarch help center. What to notice: each group has its own total and 1-month change, every row has a sparkline, and the right-hand Summary splits Assets and Liabilities into stacked bars._

The page reads top to bottom as net worth, then groups, then accounts:

1. **Net worth card**: the total in large type, then the change with an arrow and percentage in green followed by the gray label **1 month change**. Two selects on the right choose the chart (**Performance**) and the period (**1 month**). A single-color area chart (teal line, pale blue fill) shows the trend.
2. **Group cards**: one collapsible card per group (Cash, Credit Cards, Investments, Real Estate, Vehicles, Loans). The header shows a chevron, the group name, the group's own 1-month change in green or red, and the group total on the right.
3. **Account rows**: a 40 px round institution logo, the account name, a gray second line with the subtype (**Checking**, **Roth IRA**, **Brokerage (Taxable)**) and the owner, a gray sparkline, and on the right the balance above a gray "updated" time.
4. **Summary card** on the right: a **Totals** or **Percent** toggle, then **Assets** with its total and one stacked bar split by group color, a legend with a colored dot, name and amount per group, and the same for **Liabilities**. A **Download CSV** link closes it.

Account types are told apart by grouping and by the subtype text, not by color or icon: rows inside every group look the same. Credit cards are a group under Liabilities; the edit dialog adds APR, credit limit and planned payment, but the list row shows only the balance. Sparklines are always gray, so they show shape without claiming good or bad. The **Sort** menu offers custom order or amount, and rows can be dragged.

## Transactions and categorizing

[![Monarch Transactions page with date bands, merchant logos, category emoji and account logos](../../../assets/design/references/monarch-money-transactions.jpg)](../../../assets/design/references/monarch-money-transactions.jpg ':ignore')

_Transactions in multi-select mode, Monarch help center. What to notice: four aligned columns (merchant, category, account, amount) on one line per transaction, grouped under gray date bands that carry the day's total._

Row anatomy, left to right: a checkbox in edit mode, a small round merchant logo and the merchant name, the category emoji and name, the account logo and name, the amount right-aligned, and a chevron that opens a detail panel. Income shows in green with a plus sign; spending stays in the default ink with no minus sign, which keeps the list calm. Each date band is a light gray strip with the date on the left and the day's total on the right. Every row fits on one line.

Categories are three levels: a fixed type (Income, Expenses, Transfers), editable groups and categories, each category with a name and an emoji. On web you change a category from the transaction row or its detail panel; the help center documents editing and bulk editing but I could not capture the category dropdown itself.

Review is a flag rather than a separate inbox. Any transaction can be marked **Needs review**, automatically for new or uncategorized transactions or by a rule. On web you filter to needs-review transactions and tick a checkmark per row; on mobile an orange dashboard banner starts a swipe flow (right to mark reviewed, left to skip).

## Budgets

[![Monarch Budget page with Budget, Actual and Remaining columns and the Left to budget panel](../../../assets/design/references/monarch-money-budget.jpg)](../../../assets/design/references/monarch-money-budget.jpg ':ignore')

_Budget, Monarch marketing site. What to notice: the three figures sit in three labeled columns, and only Remaining gets color, as a pill._

The Budget page is a table with fixed columns **Budget**, **Actual** and **Remaining**, grouped into Income and Expenses and, inside Expenses, Fixed, Flexible and Non-Monthly. The three numbers are distinguished by treatment, not only by position:

- **Budget** sits in a white input box, because it is the number you edit.
- **Actual** is plain text.
- **Remaining** is the only colored value: a green pill when money is left, a red pill when the category is over, a gray pill at zero.

A thin progress bar runs under each row across the number columns: green while under, red when over. In the help-center version a small vertical tick sits at the same position on every bar, which appears to mark how far through the month you are. Group rows repeat the three columns in bold. Unbudgeted categories fold behind **Show 13 unbudgeted**.

The right panel holds the hero: **Left to budget** in large green type on a pale green box, then tabs **Summary**, **Income** and **Expenses** with one bar per bucket, the spent amount bold on the left and the remaining amount green on the right. In the marketing screenshot the Flexible bucket, close to its limit, shows a yellow bar segment and an amber remaining figure.

## Reports and analytics

[![Monarch Reports with Cash Flow, Spending and Income tabs, KPI tiles and a Sankey chart](../../../assets/design/references/monarch-money-reports.jpg)](../../../assets/design/references/monarch-money-reports.jpg ':ignore')

_Reports, Cash Flow tab with the Sankey chart, Monarch help center. What to notice: three tabs next to the page title, four KPI tiles above one large chart, and every control in the header._

Reports is one page with three tabs that work the same way: **Cash Flow**, **Spending** and **Income**. Under the tabs, KPI tiles give the totals (income in green, expenses in red, net income in ink, savings rate). One large chart follows, with a chart-type selector (Sankey and Trend bars on Cash Flow; Pie, Breakdown, Trend bars and Treemap on Spending and Income) and a group-by select (category, group or merchant). **Date**, **Filters**, saved **Reports** and **Save** sit in the page header. Below the chart, **Breakdown** ranks categories as horizontal bars and **Transactions** lists the rows behind the view. Clicking any bar, slice or block filters the page to those transactions. A separate **Cash Flow** page in the sidebar gives the month-by-month view.

## What CoinKeeper could borrow

| Pattern                                                                                                                                     | Where in CoinKeeper                              | Why it helps                                                                                                                     | Effort |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Group cards by account type with a group total and 1-month change, one row per account with a sparkline                                     | Accounts page (`accounts-overview`)              | Answers "what do I have, by kind" and "is it growing" at a glance; fixes the bland list where cash, savings and cards look alike | M      |
| Summary panel with Assets and Liabilities as stacked bars and a legend, one panel per currency                                              | Accounts page, right column                      | Shows the balance sheet shape without adding currencies together                                                                 | M      |
| Budget table with fixed Budget, Actual and Remaining columns; Budget editable in a box, Remaining as the only colored pill; one bar per row | Budgets page (`budget-overview`, `budget-card`)  | Makes the figures look different by role, which is the owner's main Budgets complaint                                            | M      |
| A single hero on each page (net worth on Accounts, left to budget on Budgets) in the largest type, with its change next to it               | Accounts, Budgets, Dashboard                     | Tells the user where to look first                                                                                               | S      |
| One-line transaction rows with aligned payee, category, account and amount columns, and date bands carrying the day's total                 | Transactions (`transaction-table`), review inbox | Denser and easier to scan than stacked rows                                                                                      | S      |
| Page header: title, outline secondary buttons, one filled primary action; tabs beside the title for sub-views                               | Every page header                                | One predictable place for actions; primary action stands out                                                                     | S      |
| Reports as three tabs (Cash flow, Spending, Income) with KPI tiles, a chart-type selector, and click-through to the filtered transactions   | Analytics page                                   | Replaces one long page with gaps by three focused views                                                                          | M      |
| Sidebar with navigation only, collapsible to an icon rail, with a count badge on the review entry                                           | Shell (`application-shell`)                      | Removes the confusion between places and accounts                                                                                | S      |

## What not to copy

- **A dashboard of equal cards with no hero**: Monarch's customizable grid repeats CoinKeeper's current problem; the fix is one headline, not a widget picker.
- **The "updated 2 months ago" line under balances**: it describes bank sync. For manual and CSV accounts, the date of the last transaction or import is the useful fact.
- **One currency symbol for everything**: Monarch shows every amount with `$`. Every CoinKeeper total, sparkline and summary bar must stay per currency.
- **Orange for brand, primary action and AI highlights at once**: it works for Monarch, but CoinKeeper should keep its accent for actions only, so color keeps meaning.
- **Emoji as the only category mark**: emoji render differently on Windows, macOS and Android and cannot take the group color. CoinKeeper's Lucide icon on a group-colored tint is more consistent.

## Sources

- [Monarch Help: Edit Accounts](https://help.monarch.com/hc/en-us/articles/360058636951-Edit-Accounts) (Accounts page screenshots, account options)
- [Monarch Help: Getting Started with Monarch](https://help.monarch.com/hc/en-us/articles/360048393272-Getting-Started-with-Monarch) (dashboard screenshot)
- [Monarch Help: Customizing Your Dashboard](https://help.monarch.com/hc/en-us/articles/360058127551-Customizing-Your-Dashboard)
- [Monarch Help: Hiding or Unhiding Transactions](https://help.monarch.com/hc/en-us/articles/4405041904916-Hiding-or-Unhiding-Transactions) (transactions screenshot)
- [Monarch Help: Editing Transactions](https://help.monarch.com/hc/en-us/articles/360048393532-Editing-Transactions)
- [Monarch Help: Reviewing Transactions](https://help.monarch.com/hc/en-us/articles/5528707082516-Reviewing-Transactions)
- [Monarch Help: Default Categories](https://help.monarch.com/hc/en-us/articles/360048883851-Default-Categories)
- [Monarch Help: Using Flex Budgeting](https://help.monarch.com/hc/en-us/articles/32125337244052-Using-Flex-Budgeting) (budget rows with the pace tick)
- [Monarch Help: Using Reports](https://help.monarch.com/hc/en-us/articles/21846787088916-Using-Reports) (reports screenshot, chart types)
- [Monarch Help: Investments in Monarch](https://help.monarch.com/hc/en-us/articles/41855507661076-Investments-in-Monarch)
- [Monarch: Budgeting feature page](https://www.monarch.com/features/budgeting) (budget screenshot)
- [Monarch: Tracking feature page](https://www.monarch.com/features/tracking)
- [Monarch: home page](https://www.monarch.com/) (fonts loaded by the site)
