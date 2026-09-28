# Cleo

> Summary: Cleo, the US chat-first AI money coach with a roast or hype personality: its challenges, savings hacks and Autopilot plan, and why ledger-based spending challenges, a tone layer over deterministic insights and an essentials split are worth borrowing, without its cash-advance business.

## At a glance

|                     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type                | Conversational AI finance assistant + budgeting + savings + cash advances + credit building                                                                                                                                                                                                                                                                                                                                                                                                    |
| Platforms           | iOS, Android (mobile only; no desktop sign-up)                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Pricing (2026)      | Free (chat, budget, challenges, insights). Paid tiers are reported differently by source: third-party trackers (Jul 2026) list **Plus $5.99/month** (cash advances up to $250, credit score, Debt Reset), **Pro $8.99/month** (savings APY, AI memory, voice) and **Builder $14.99/month** (Cleo Card credit builder, advances up to $500). Some listings still show **Grow $2.99/month**. Express advance fees are $3.99–$14.99 per advance. The official pricing page could not be verified. |
| Regions / bank sync | US (Plaid) is the main market. It left the UK and Canada in early 2022 and has **relaunched in the UK** with a reduced feature set (chat, budget, roast, voice, Cleo Pro, early income, spending roadmap; no savings, Save Hacks, card or credit score). It can't connect non-UK foreign banks there.                                                                                                                                                                                          |
| Data entry          | Bank sync only; no manual entry (reviewers list this as a con)                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Best for            | Gen Z and young millennials who won't open a spreadsheet but will chat, and who respond to humour and gamification                                                                                                                                                                                                                                                                                                                                                                             |

Recent changes:

- **Cleo 3.0** (29 July 2025) added two-way voice, long-term memory (it recalls goals and stressors from past chats), proactive insights using OpenAI's o3 reasoning model, and an agentic architecture for multi-step tasks. At the time Cleo said it was on track for 1M+ paid subscribers and $250M+ ARR while profitable.
- **Autopilot** (5 February 2026, US waitlist) is a safe-to-spend plan: Onramp, Roadmap, Daily Plan and Actions. At launch the actions are recommendations; automatic execution is promised later.
- **FTC settlement** (27 March 2025): Cleo paid **$17M** over allegations that it misled users about cash-advance amounts (advertised $250/$500, some users got $20) and speed ("instant" and "today" claims backed by fees), and that it made cancelling hard. The order requires clear disclosures, express consent and simple cancellation.

## What makes it special

Cleo's bet is that the interface to money should be a conversation with a character, not a dashboard. Founder Barney Hussey-Yeo (a former data scientist) started Cleo in 2016 on the idea that the next generation would be "in conversation" with their money. The persona is described as bold, irreverent and purposeful: it talks like a friend, uses memes and GIFs, avoids jargon, and pushes back. The best-known expressions of this are **Roast mode**, which calls out overspending (for example eating out five times in a week), and **Hype mode**, which celebrates progress. Users reportedly say please and thank you to Cleo and ask it things like "is it okay that I spent that much this weekend?", which is engagement most finance apps never get.

The personality drives retention and paid conversion. The App Store rating is 4.7 from 264k+ ratings, and Cleo reported more than doubling ARR year over year in 2025. It also carries risk. Much of the revenue comes from subscriptions tied to **cash advances** and credit building for financially stretched users, and that is where the complaints and the FTC action concentrate: small advance amounts, paid express fees, and charges after uninstalling or asking to cancel. Reviewers also note that the AI sometimes misclassifies essential expenses, that Plus is poor value if you don't use advances, and that human support is hard to reach.

## Strongest feature

**The conversational coach with a personality (roast / hype).** Cleo's standout is not a single calculation. It is how insights are delivered: short, funny, personal messages drawn from your own transactions, which you can ask for ("roast me") or receive proactively. Challenges, Save Hacks and budgets all show up in the chat as well.

For our target user, a non-expert who struggles to look at their finances, tone and framing matter as much as numbers. The _content_ of a roast (top merchants, deltas against your average, frequency counts) is deterministic and can be computed from our ledger without an LLM. The LLM, if we ever add one, only phrases it. That split keeps it cheap, private and testable.

## Feature deep dive

### Chat ("Ask Cleo") with Roast and Hype modes

- **What it does**: A chat interface where you ask about your money ("how much did I spend on takeaways?", "can I afford X?") and get answers in Cleo's voice. "Roast me" returns a blunt, meme-heavy critique; "hype me" returns encouragement.
- **How it works**:
  - Built on transaction data from linked accounts.
  - Since Cleo 3.0, OpenAI o3 powers reasoning over recent transactions and proactive insights, memory summarises past chats, and an agentic layer selects tools for multi-step tasks.
  - Voice mode offers real-time conversation and voice trivia.
  - The UK help center lists limits: it can't give card numbers, lock the app or do taxes.
  - Specific prompt and tone rules are unpublished.
- **Why it helps**: It lowers the barrier to engaging with money, and humour makes criticism acceptable. Usefulness: **Medium–High** (high for engagement; the value depends on accurate underlying numbers).

### Budget (spend limit)

- **What it does**: Shows how much you can spend this pay cycle or month after bills.
- **How it works**:
  - **Spend limit = income − bills and subscriptions ("any committed payment")**.
  - Two period types: a **paycheck budget** (resets each payday; for regular or multiple incomes) and a **monthly budget** (resets on the 1st; for irregular or no income).
  - Categories are split into **Essential spending** and **Other spending** and can be reclassified under "edit categories".
  - Optional category limits can be set.
  - Bills are auto-detected, and "Review bills" lets you add missing ones.
- **Why it helps**: It is the same safe-to-spend idea as PocketGuard and Emma. The essential/other split is a useful two-bucket simplification for non-experts. Usefulness: **High**.

### Autopilot (2026)

- **What it does**: A plan that calculates how much you can safely spend each day, updating when bills go out, pay arrives or spending shifts, and keeping goals in mind.
- **How it works**:
  - Four parts: **Onramp** (financial analysis), **Roadmap** (goal planning), **Daily Plan** (guidance) and **Actions** (advisory at launch). Planned actions include moving money to savings, overdraft prevention and merchant spending limits.
  - It is US-only via a waitlist under the Plan tab.
  - Planned 2026 goal types: emergency fund, paying down debt, saving for a purchase.
- **Why it helps**: It is a daily number plus a roadmap, which fits our target user's goals directly. Usefulness: **High** (as a computed plan; the automated money movement is not applicable).

### Challenges

- **What it does**: You pick a category or merchant to cut back on (for example coffee shops), set a period and spend limit, and Cleo tracks it with daily updates in chat.
- **How it works**:
  - Suggested challenges are based on your **average spending over the last 12 weeks** for that category or merchant.
  - **Predicted savings** = a percentage of that 12-week spend (the exact percentage is unpublished).
  - You can accept a suggested challenge or create your own under Save.
  - Free on every tier.
  - What happens on failure is undocumented.
- **Why it helps**: It gives a concrete, time-boxed goal against a specific leak. Gamified and motivating. Usefulness: **High**.

### Save Hacks (automatic saving rules)

- **What it does**: Automatic transfers into Cleo savings.
- **How it works**: Five hacks, each toggled independently:
  1. **Roundups**: round purchases to the next dollar and save the difference.
  2. **Smart Save**: a weekly amount chosen from spending patterns.
  3. **Swear Jar**: pick merchants and a "fine" per purchase (for example $2 each time you buy pizza). The fines are collected weekly.
  4. **Set and Forget**: a fixed weekly amount.
  5. **Payday Saver**: a portion of each paycheck, with advance notice and the option to skip.

  Most transfers are weekly; Payday Saver runs after payday. Cleo's help center quotes an illustrative average of about $145/month across all hacks. Help-center and review sources disagree on which tier is required.

- **Why it helps**: Commitment devices work, and the Swear Jar in particular turns a bad habit into savings. Real money movement needs a bank partner, but the _rules_ can be applied as suggested transfers in a ledger. Usefulness: **Medium** (for us: rules that suggest or record transfers between the user's own accounts).

### Money IQ and Debt Reset

- **What it does**: **Money IQ** is a weekly quiz (5 questions, 15 seconds each, one-hour window on Thursdays) with cash prizes up to $4K. **Debt Reset** collects debts into one dashboard, prioritises payments and builds a payoff plan (student loans excluded for now; built with the Method API).
- **Why it helps**: Money IQ is engagement and marketing. Debt Reset depends on US debt data aggregation, although the planning logic is universal. Usefulness: **Low** (Money IQ) and **Medium** (debt plan logic; see pocketguard.md).

### Cash advances, Cleo Card, credit score

- **What it does**: Advances of $20–$250 (up to $500 on Builder; up to $100 for first-timers), repaid in 3–14 days. Free standard transfer in 3–4 days, or a same-day fee. There is also a secured credit-builder card and credit score tracking.
- **Why it helps**: It helps some users avoid overdraft fees, but it is lending-adjacent, US-specific, and at the centre of the FTC case. Usefulness: **Low** (and against our principles).

## Fit for CoinKeeper

| Feature                                              | Usefulness for our user | Model changes?                                           | API / services                               | UI changes                                         | Effort (S/M/L) | Priority (Now/Next/Later/Skip) |
| ---------------------------------------------------- | ----------------------- | -------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------- | -------------- | ------------------------------ |
| Spending challenges (category/payee, period, limit)  | High                    | `challenges` table                                       | Challenge service (progress from ledger)     | Challenges screen, dashboard card, suggestion list | M              | Next                           |
| Personality layer: roast/hype recap (template-based) | Medium–High             | `user_settings.coach_tone` enum                          | Insight facts generator + tone templates     | Weekly recap card with tone toggle                 | S–M            | Next                           |
| Essential vs other spending split                    | High                    | `category_groups.is_essential` or `categories.essential` | Reports group by flag                        | Donut / budget header split                        | S              | Now                            |
| Swear jar and savings rules as suggested transfers   | Medium                  | `savings_rules` table                                    | Rule evaluator producing suggested transfers | Rules screen; review inbox suggestions             | M              | Later                          |
| Daily safe-to-spend plan (Autopilot-like)            | High                    | See pocketguard.md                                       | Same                                         | Same                                               | M              | Next (with Leftover)           |
| LLM chat over the ledger                             | Medium                  | `chat_threads`, `chat_messages` (soft delete)            | LLM gateway with read-only tools, opt-in     | Chat panel                                         | L              | Later                          |
| Voice, memory                                        | Low                     | —                                                        | —                                            | —                                                  | L              | Skip (for now)                 |
| Money IQ quiz with prizes                            | Low                     | —                                                        | —                                            | —                                                  | —              | Skip                           |
| Cash advances, credit builder, credit score          | Low                     | —                                                        | —                                            | —                                                  | —              | Skip                           |

### Spending challenges

- **What is it for, and how useful is it?** It turns "stop wasting money" into a concrete, short, winnable game: "Spend at most 40 on coffee in the next 4 weeks (you usually spend 75)". It targets exactly the leaks our user wants to plug and works on manual or CSV data. Usefulness: **High**.
- **Should we modify the models?** Yes. Add a `challenges` table:
  - Core columns: `id`, `user_id`, `name`, `scope_kind` enum `category | category_group | payee`, `category_id` / `category_group_id` / `payee_id` (exactly one set, enforced by a check constraint), `currency`, `start_date`, `end_date`.
  - Targets: `limit_amount_minor` (spend cap for the period, positive), `baseline_amount_minor` (snapshot of the typical spend for a same-length period, stored for display honesty), `target_count` (optional, for "at most N visits").
  - Lifecycle: `status` enum `active | completed | failed | abandoned` (derived at read time for active ones; persisted when closed), `closed_at`, `created_at`, `deleted_at`.
  - Progress is **always** computed from the ledger: Σ spending in scope between the dates, following the usual rules (`kind='standard'`, not excluded, not deleted, `counts_in_spending` accounts).
- **Should we improve the UI?** Yes:
  - A **Challenges** screen with active challenges as progress bars (spent vs limit, days left, "on pace" marker), suggested challenges, and history (won/lost, amount saved vs baseline).
  - A dashboard card showing the active challenge.
  - An end-of-challenge result card (hype or roast copy).
- **How to implement it**:
  1. Suggestion query: for each category and payee, compute the average spend per 28 days over the last 12 weeks (`Σ spend / 3`) and the visit count. Rank by amount in discretionary groups (exclude categories linked to recurring bills). Propose a limit of 70–80% of baseline, rounded to a friendly amount in the currency's minor units, so predicted saving = baseline − limit.
  2. CRUD routes and a progress endpoint.
  3. A pure status helper in `packages/shared/src/lib/challenges.ts`: `failed` as soon as spent > limit; `completed` when today > end_date and spent ≤ limit; pace = spent / (limit × elapsed_fraction).
  4. UI.

  Risks and open questions:
  - Payee normalisation (the same café under several names).
  - Refunds inside the window (net them).
  - Whether to allow multi-currency scopes. No: one currency per challenge.

### Personality layer: roast/hype recap without an LLM

- **What is it for, and how useful is it?** It makes insights memorable and sets the emotional tone the user prefers. Some want tough love, others encouragement. Usefulness: **Medium–High** for engagement and habit-forming; zero cost and no privacy exposure when template-based.
- **Should we modify the models?** Add `user_settings.coach_tone` enum `neutral | hype | roast` (default `neutral`). Optionally add `insight_deliveries` to avoid repeating the same line.
- **Should we improve the UI?** Add a weekly **Recap** card or page (see also the recap in emma.md) with 3–5 facts and a tone toggle. Roast copy must never shame essentials: only discretionary groups can be roasted.
- **How to implement it**:
  1. A facts generator (SQL): top 3 discretionary payees this week vs their 12-week weekly average; visit counts ("5 food deliveries"); biggest category increase in percent; budget statuses (Exceeded / Near limit); streaks (weeks under budget); savings rate this month vs last.
  2. Each fact is a typed object `{ type, subject, amount_minor, currency, delta_pct, count }`.
  3. Pick a template per `(fact type, tone)` from a localisable catalogue in `apps/web`. Numbers go through `formatMoney`.
  4. Tests assert which facts fire.
  5. Later, an optional opt-in LLM can rephrase the same facts, but it never computes numbers.

  Risks: tone misfires for users in financial distress. Default to neutral, never roast when income < spending for 2+ months, and always give an easy off switch.

### Swear-jar and savings rules (as suggested transfers)

- **What is it for, and how useful is it?** A commitment device: every time you buy from a "guilty" payee or category, you set aside X for a goal. Round-ups and set-and-forget work the same way. Usefulness: **Medium**. It works best once savings goals exist.
- **Should we modify the models?** Add `savings_rules`:
  - `id`, `user_id`, `name`, `kind` enum `swear_jar | round_up | fixed_weekly | percent_of_income`.
  - `payee_id` / `category_id` (swear jar), `amount_minor` (fine or fixed amount), `round_to_minor` (for example 100 = round to 1.00), `percent_bps`.
  - `source_account_id`, `destination_account_id` (or `goal_id`), `currency`, `active`, `deleted_at`.

  The output is **suggested transfers**: weekly, the evaluator computes the owed amount from ledger rows in the last week and creates a pending paired transfer (`kind='transfer'`, both legs, `status='pending'`, `needs_review=true`) that the user confirms after moving the money in their real bank. Nothing is ever moved automatically. The ledger stays the truth, and transfers never count as spending.

- **Should we improve the UI?** Add a rules screen under Goals and suggested transfers in the review inbox ("Swear jar: 3 × pizza = 6.00 → Holiday fund. Confirm?").
- **How to implement it**: A pure evaluator in `packages/shared`, a weekly on-read materialisation (like the recurring templates in emma.md), idempotent by `(rule_id, week_start)`.
  - Open question: per-currency rules only.

## What not to copy

- **Cash advances and express fees**: lending to stretched users; the source of the $17M FTC settlement; US-regulated.
- **Advertising maximum amounts few users receive**: deceptive by the FTC's account.
- **Hard cancellation (including "pay off advances before cancelling")**: a dark pattern named in the FTC complaint.
- **Credit-builder card and credit score tracking**: US bureau-specific.
- **Money IQ with cash prizes**: lottery-like engagement that doesn't improve financial control.
- **Mandatory bank linking with no manual entry**: our base is manual + CSV.
- **Sending full transaction history to a third-party LLM by default**: a privacy risk. Any AI must be opt-in, minimal in the data it sees, and read-only.
- **Roasting essentials or struggling users**: humour that shames can backfire. Tone must be opt-in and limited to discretionary spend.
- **Letting the LLM compute numbers**: models misclassify (reviewers note essential expenses flagged wrongly). Numbers must come from SQL.

## Sources

- [Cleo Help: How do Save Hacks work?](https://web.meetcleo.com/faqs/en/articles/9966197-how-do-save-hacks-work)
- [Cleo Help: What's a Challenge?](https://web.meetcleo.com/faqs/en/articles/11496861-what-s-a-challenge)
- [Cleo Help: UK Budget FAQs](https://web.meetcleo.com/faqs/en/articles/12982777-uk-budget-faqs)
- [Cleo Help: What is Autopilot?](https://web.meetcleo.com/faqs/en/articles/13727802-what-is-autopilot)
- [Cleo Help: What's available for Cleo customers in the UK?](https://web.meetcleo.com/faqs/en/articles/12992410-what-s-available-for-cleo-customers-in-the-uk)
- [Cleo Help: What can't Cleo do? (UK)](https://web.meetcleo.com/faqs/en/articles/12641377-what-can-t-cleo-do-uk)
- [Cleo Help Center home (collections)](https://web.meetcleo.com/faqs/en/)
- [Cleo Help: Money IQ](https://web.meetcleo.com/faqs/en/articles/11778095-money-iq)
- [Cleo Help: How does Debt Reset help?](https://web.meetcleo.com/faqs/en/articles/11813796-how-does-debt-reset-help-with-debt-payments-interest-clearing-debt)
- [Cleo blog: The money app that roasts you](https://web.meetcleo.com/blog/the-money-app-that-roasts-you)
- [Cleo blog: Introducing Cleo 3.0](https://web.meetcleo.com/blog/Introducing-cleo-3-0)
- [Business Wire: Cleo becomes the first AI money coach that speaks, thinks and remembers (Jul 2025)](https://www.businesswire.com/news/home/20250729690058/en/Cleo-Becomes-the-First-AI-Money-Coach-That-Speaks-Thinks-and-Remembers)
- [PR Newswire: Cleo launches Autopilot (Feb 2026)](https://www.prnewswire.com/news-releases/cleo-launches-autopilot-automating-your-money-moves-302679691.html)
- [FTC: FTC v. Cleo AI, Inc.](https://www.ftc.gov/legal-library/browse/cases-proceedings/cleo-ai-inc-ftc-v)
- [National Law Review: Cleo AI agrees to $17M FTC settlement](https://natlawreview.com/article/cleo-ai-agrees-17-million-settlement-ftc)
- [FinanceBuzz: Cleo app review 2026](https://financebuzz.com/cleo-review)
- [FinCompareLab: Cleo pricing 2026](https://www.fincomparelab.com/guides/cleo-pricing/)
- [CleoApps.com (independent): Cleo pricing overview](https://cleoapps.com/pricing.html)
- [App Store (US): Cleo AI – Cash Advance & Budget](https://apps.apple.com/us/app/cleo-ai-cash-advance-budget/id1447274646)
- [GV: Meet Cleo, the AI finance app that captivated Gen Z](https://www.gventures.co/post/meet-cleo-the-ai-finance-app-that-captivated-gen-z)
- [Money To The Masses: Cleo announces temporary UK exit](https://moneytothemasses.com/news/cleo-budgeting-app-announces-temporary-uk-exit)
