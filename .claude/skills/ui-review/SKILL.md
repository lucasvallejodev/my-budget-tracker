---
name: ui-review
description: Reviews a CoinKeeper screen or component in apps/web for interface quality, accessibility against WCAG 2.2 AA (labels, fieldset and legend, aria-live status messages, focus management and visibility, color never the only signal, reduced motion, 200 % zoom and 320 px reflow, 24 px touch targets, contrast on white and on the canvas) and responsive behavior under our SCSS rules (mobile-first media-up mixins, the SCSS theme, BEM), plus money shown only through formatMoney or Amount. Reports findings as path:line grouped by severity, with a fix for each. Use when asked to review a UI, audit accessibility or a11y, check WCAG, keyboard or screen reader support, check a screen on mobile or tablet, or before merging a new screen or ui component. Not for automated axe or Playwright checks (use e2e-playwright), render speed or data fetching (use react-client-patterns), docs prose (use docs-writing), or security (use api-security-review).
---

# UI review

Review what the user names (a screen, a component folder, a diff) and report problems a user would hit: things they cannot reach, read, understand or undo, and layouts that break on their device. Findings are evidence-based (`path:line`), ranked by severity, and each comes with a fix written in our vocabulary (BEM, `ui` components, theme variables and functions, mixins), never in Tailwind or generic CSS-in-JS terms. Do not fetch remote guidelines; the rules are in `references/`.

## Before you start

- [agents/components.md](../../../agents/components.md): BEM, cascade layers, breakpoints and mixins, focus rules.
- [agents/conventions.md](../../../agents/conventions.md) › Client patterns (accessible names, `QueryContent`), Styling, Money.
- `apps/web/src/styles/theme/` (one light theme: colours, type, radii, borders, shadows), `apps/web/src/styles/abstracts/`, `apps/web/src/app/globals.scss` (focus ring, reduced-motion rule).

## Workflow

1. **Scope.** Read the named `.tsx` files, their `.scss`, and the props of every `ui` component they render (`apps/web/src/components/ui/index.ts`), because semantics often live there (`Field` renders a `<label>`, `QueryContent` renders `role="status"`, Radix gives `Dialog` its focus trap). If the user gave no target, ask for one.
2. **Static pass.** Walk [checklist.md](references/checklist.md) section by section, then [responsive.md](references/responsive.md). Record each problem with the line that causes it.
3. **Runtime pass (when the app can run).** `npm run dev`, sign up a throwaway account as `CLAUDE.md` › Known constraints describes, then with the browser tools: 375×812, 768×1024, 1440×900 and a 320 px wide viewport (reflow); Tab and Shift+Tab through every control, Enter and Escape in dialogs and menus. Reset the viewport to desktop afterwards. If you cannot run it, say which checks stay unverified.
4. **Report** in the format below. Do not change code unless the user asks; when they do, follow the house rules and run the gate.

## Severity

| Severity | Meaning                                                                         | Examples                                                                                                |
| -------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Blocker  | A user cannot complete the task (keyboard, screen reader, phone).               | `div` with `onClick`, keyboard trap, unlabeled input, content cut off at 320 px, focus lost in a dialog |
| Serious  | Fails a WCAG 2.2 AA criterion but a workaround exists, or money can be misread. | contrast below 4.5:1, color as the only signal, error not announced, amount not via `formatMoney`       |
| Moderate | Degrades use or breaks a house rule with user impact.                           | motion ignoring `prefers-reduced-motion`, target under 24 px, raw width media query, no empty state     |
| Minor    | Polish and copy.                                                                | Title Case heading, `...` instead of `…`, vague button label, missing `tabular-nums` in a money column  |

## Output format

```text
## Blocker
apps/web/src/components/finance/x/x.tsx:42 - 2.1.1 Keyboard - row opens the dialog on div click only → render a Button or a link

## Serious
apps/web/src/components/finance/x/x.scss:18 - 1.4.3 Contrast - var(--color-text-faint) on var(--color-surface) is 2.58:1 → use var(--color-text-muted)

## Moderate
…

## Minor
…

## Not verified
- 320 px reflow and focus order: app not run
```

- One line per finding, always in this exact shape: `path:line - <WCAG number and name, or house rule> - problem → fix`. No sub-bullets, no multi-line findings: if a finding needs code, put the line first and the code block right after it, and if one problem spans several places, write one line per place. A finding without a `path:line`, a criterion or the `→ fix` part is not finished.
- Omit empty severity sections; write "No findings" when nothing is wrong.
- Group repeated problems (same cause, many lines) into one finding with all line numbers.
- End with "Not verified" for anything that needs a rendered page you did not see.

## References

| File                                      | Read it when                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| [checklist.md](references/checklist.md)   | Every review: semantics, forms, focus, live regions, color, motion, copy, money.  |
| [responsive.md](references/responsive.md) | Layout, breakpoints, zoom and reflow, touch targets, tables and charts on phones. |
| [source.md](references/source.md)         | You need the origin of a rule.                                                    |

## Verify

A review changes nothing. If the user asks for fixes, apply them under `agents/components.md` and run:

```bash
npm run lint:fix
npm run lint && npm run typecheck && npm test -- --run && npm run build
```

Component tests query by role and label, so an accessibility fix usually needs a test that finds the control by its new name. Automated axe checks live in `e2e/accessibility.spec.ts` (see the e2e-playwright skill); a clean axe run does not replace this review.

## Keep the docs true

A fix that adds or changes a `ui` component updates the catalog in `docs/architecture/components.md`; a new mixin or token updates the same page. Find other affected pages with [agents/docs-map.md](../../../agents/docs-map.md).
