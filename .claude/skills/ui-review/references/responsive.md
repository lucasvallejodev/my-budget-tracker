> Summary: how to review a screen's responsive behavior in CoinKeeper: the mobile-first breakpoints and mixins, the viewports to check, WCAG reflow, resize and text spacing, touch target sizes, hover-only affordances, and tables, charts and dialogs on phones.

# Responsive review

## Rules the code must follow

- Base styles are the phone layout; wider layouts are added with `@include media-up(<name>) { … }` from `apps/web/src/styles/abstracts/_breakpoints.scss`. `media-down` and `media-between` exist for rare exceptions. Raw `min-width` / `max-width` / `width` media queries are rejected by Stylelint in components, so flag any that slipped in through a `ui` override or a new stylesheet.
- Breakpoints: `phone-landscape` 481 px, `tablet` 601 px, `tablet-landscape` 769 px, `laptop` 1025 px, `desktop` 1281 px, `wide` 1441 px.
- Layout comes from `ui` primitives (`Page`, `Stack`, `Cluster`, `Grid`, `Columns`, `Panel`) and the mixins (`flex-row`, `flex-column`, `flex-between`); spacing from `space()`, radii from `radius()`. Measuring the window in JavaScript to lay things out is a finding (and a re-render cost, see `rerender-derived-state` in the react-client-patterns skill).
- Colors in any responsive override still come from tokens.

## Viewports to check

| Viewport   | Why                                                                                                                   |
| ---------- | --------------------------------------------------------------------------------------------------------------------- |
| 375 × 812  | Typical phone, base styles.                                                                                           |
| 320 wide   | **1.4.10 Reflow**: content works without horizontal scrolling (except data tables and charts).                        |
| 768 × 1024 | Tablet portrait, just below `tablet-landscape`.                                                                       |
| 1440 × 900 | Desktop; checks that wide layouts do not stretch lines past a readable width.                                         |
| 200 % zoom | **1.4.4 Resize Text**: at 1280 px and 200 % zoom the layout is about 640 CSS px wide; nothing is clipped or overlaps. |

Use the browser tools' `resize_window` for the sizes and reset to desktop afterwards. A statically reviewed screen lists these under "Not verified".

## Findings to look for

- **1.4.10 Reflow.** Fixed widths (`width: 480px`, `min-width` on panels, `floating-panel($width)` without a max) that force sideways scrolling at 320 px. Data tables may scroll horizontally inside their own container; the page must not.
- **1.4.12 Text Spacing.** Fixed `height` on text containers clips text when users increase line or letter spacing; use `min-height`.
- **2.5.8 Target Size (Minimum).** Pointer targets are at least 24 × 24 CSS px or have enough spacing. Current sizes: `text-field` min-height 44 px, `Button` default min-height 42 px, `button--sm` 32 px, `button--icon` 42 px wide. Flag custom controls below 24 px (bare checkboxes and radios not wrapped in their label, small icon links, chart legend toggles). Primary actions on phones should reach 44 px.
- **Hover-only affordances.** Actions or details that appear only on `:hover` (row actions, tooltips) must also appear on `:focus-within` and be usable on touch.
- **Long content.** Account, payee and category names, memos and large amounts (`1 234 567,89 KWD`) at 320 px: truncate with the `truncate` mixin and `min-width: 0` on the flex child, or wrap; never overflow the panel.
- **Tables on phones.** `ui/table` scrolls horizontally inside its own focusable region (the `Table` wrapper), so the page does not; alternatively rows collapse into stacked rows. The amount column stays visible and right-aligned.
- **Charts.** Wrapped in `chart-frame`; axis labels readable at 375 px (fewer ticks rather than overlapping ones); the legend with values stays below the chart on phones.
- **Dialogs and popovers.** On phones they fit the viewport width, scroll their content, keep the footer buttons reachable when the on-screen keyboard is open, and use `overscroll-behavior: contain` so scrolling the dialog does not scroll the page.
- **Fixed elements.** Anything fixed to the bottom (toasts, action bars) respects `env(safe-area-inset-bottom)` and does not cover the focused field (2.4.11).
- **Zoom.** Never add `maximum-scale` or `user-scalable=no` to the viewport; the app relies on Next's default viewport.
- **Print.** Screens with a "Print / PDF" action (`transaction-explorer`) use the `--print-*` tokens; check the printed table is legible if the change touched it.
