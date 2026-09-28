---
name: react-client-patterns
description: Performance, data-fetching and composition rules for CoinKeeper's client-only Next.js 16 / React 19 web app (apps/web) with TanStack Query 5, written for our component folders, BEM styling and house conventions. Use when writing, reviewing or refactoring components, hooks, screens, query hooks or mutations in apps/web; when a screen is slow, re-renders too much, flashes on load or ships a heavy bundle; when adding a query, an optimistic update or cache invalidation; or when designing a component API (boolean props, variants, compound parts, context). Not for API endpoints or services (use fastify-api), Playwright tests (use e2e-playwright), hanging Vitest runs or Node profiling (use node-diagnostics), accessibility or responsive reviews (use ui-review), or docs prose (use docs-writing).
---

# React client patterns

CoinKeeper's web app is a client: pages render one `'use client'` screen, reads go through TanStack Query hooks, writes through `@/api/mutations`, styles are BEM in SCSS. Generic React and Next.js advice assumes Server Components, Server Actions, SWR and Tailwind; most of it does not apply here, and some of it (dropping barrels) would break our lint rules. This skill keeps the rules that do apply, rewritten to our conventions, ordered by impact.

## Before you start

- [agents/conventions.md](../../../agents/conventions.md) › Client patterns, Naming, Styling, Tests.
- [agents/components.md](../../../agents/components.md) before creating, moving or styling a component.
- [agents/architecture.md](../../../agents/architecture.md) › Layers and flow for the read/write path.

Facts that change the usual advice:

- No server data fetching, Server Actions, route handlers, `React.cache` or `after()` in `apps/web`. Rules about them are out of scope.
- Reads: hooks in `apps/web/src/components/finance/use-finance-data.ts` with `QueryKeys`. Writes: `apps/web/src/api/mutations.ts`, then `useEntityMutation` or `useRefreshFinance()`. No SWR, no `fetch` in components.
- Project barrels (`@/components/ui`, module barrels) are mandatory. Do not "optimize" them away.
- Check `apps/web/next.config.ts` for `reactCompiler`. Without it, manual memoization still matters; with it, drop the rules marked "compiler" below.
- Client components are still prerendered, so hydration rules apply.

## Workflow

1. Classify the change: new or changed query, write or mutation, slow screen, bundle weight, component API.
2. Find the rules in the tables below and open only the reference files they point to.
3. Write the code to the rule and to the house style (no comments, named constants, `type`, BEM class strings, full names).
4. When reviewing, report each finding as `path:line - rule-id - fix`, highest impact first. Say "no findings" for a clean file.
5. Run the gate (see Verify). Add or update the component or hook test for every rule you apply.

## Rules by impact

### Critical: correctness and data

| Rule                               | One line                                                                                       | Reference                                       |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `client-query-hooks`               | Every read is a hook with a `QueryKeys` key; no `fetch` or server state in `useState`/effects. | [data-fetching.md](references/data-fetching.md) |
| `rendering-conditional-render`     | `{amountMinor && …}` renders `0`; compare explicitly or use a ternary.                         | [rendering.md](references/rendering.md)         |
| `js-tosorted-immutable`            | Never `.sort()`/`.reverse()` props or query data; the cache object is shared.                  | [javascript.md](references/javascript.md)       |
| `rerender-no-inline-components`    | Define components at module scope, never inside another component.                             | [rerender.md](references/rerender.md)           |
| `rerender-derived-state-no-effect` | Derive values during render; no `setState` in an effect to mirror props.                       | [rerender.md](references/rerender.md)           |
| `rerender-functional-setstate`     | Update from previous state with the updater form; avoids stale closures.                       | [rerender.md](references/rerender.md)           |

### High: waterfalls, bundle, hydration, component API

| Rule                                   | One line                                                                                    | Reference                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `async-parallel`                       | Run independent requests with `Promise.all` or separate queries.                            | [waterfalls.md](references/waterfalls.md)       |
| `async-defer-await`                    | Await only in the branch that needs the value; do not block UI on refetches.                | [waterfalls.md](references/waterfalls.md)       |
| `async-dependencies`                   | Chain dependent promises, then one `Promise.all`; no `better-all`.                          | [waterfalls.md](references/waterfalls.md)       |
| `async-cheap-condition-before-await`   | Check the cheap synchronous guard before awaiting anything.                                 | [waterfalls.md](references/waterfalls.md)       |
| `bundle-dynamic-imports`               | `next/dynamic` for heavy client-only parts (recharts charts, import wizard).                | [bundle.md](references/bundle.md)               |
| `bundle-barrel-imports`                | Keep project barrels; third-party barrels are handled by Next; icons via the registry.      | [bundle.md](references/bundle.md)               |
| `bundle-conditional`                   | Load a large module from the event that activates the feature.                              | [bundle.md](references/bundle.md)               |
| `bundle-preload`                       | Start the dynamic import on hover or focus of the control that opens it.                    | [bundle.md](references/bundle.md)               |
| `bundle-analyzable-paths`              | Dynamic imports go through an explicit map of `() => import('…')`.                          | [bundle.md](references/bundle.md)               |
| `rendering-hydration-no-flicker`       | Apply stored preferences (theme) before paint, not in an effect.                            | [rendering.md](references/rendering.md)         |
| `rendering-hydration-suppress-warning` | Client-only values go through `useHydrated()`; suppress warnings only for real differences. | [rendering.md](references/rendering.md)         |
| `rerender-use-deferred-value`          | Defer expensive filtering/charts behind typed input with `useDeferredValue`.                | [rerender.md](references/rerender.md)           |
| `rerender-move-effect-to-event`        | Run a user action's side effects in its handler, not state + effect.                        | [rerender.md](references/rerender.md)           |
| `client-localstorage-schema`           | Guard storage with `try`/`catch`, version keys, store only preferences, never tokens.       | [data-fetching.md](references/data-fetching.md) |
| `architecture-avoid-boolean-props`     | Behavior flags become composition; looks stay a `variant` prop with `…ClassNames`.          | [composition.md](references/composition.md)     |
| `architecture-compound-components`     | Compound parts are plain named exports sharing a private context, never `Parent.Child`.     | [composition.md](references/composition.md)     |

### Medium: re-renders, state shape, lists

| Rule                                          | One line                                                                            | Reference                                       |
| --------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------- |
| `rerender-defer-reads`                        | Do not subscribe to state you only read inside a handler.                           | [rerender.md](references/rerender.md)           |
| `rerender-dependencies`                       | Effect dependencies are primitives, not whole objects.                              | [rerender.md](references/rerender.md)           |
| `rerender-derived-state`                      | Subscribe to the boolean you need; prefer `media-up` in SCSS over JS width checks.  | [rerender.md](references/rerender.md)           |
| `rerender-lazy-state-init`                    | Pass a function to `useState` for expensive initial values.                         | [rerender.md](references/rerender.md)           |
| `rerender-transitions`                        | Mark non-urgent updates (month switch, filters) with `startTransition`.             | [rerender.md](references/rerender.md)           |
| `rerender-memo` (compiler)                    | Move expensive work into a memoized child so early returns skip it.                 | [rerender.md](references/rerender.md)           |
| `rerender-memo-with-default-value` (compiler) | Hoist non-primitive default props of memoized components.                           | [rerender.md](references/rerender.md)           |
| `rerender-simple-expression-in-memo`          | Do not `useMemo` a cheap primitive expression.                                      | [rerender.md](references/rerender.md)           |
| `rerender-split-combined-hooks` (compiler)    | Split memos/effects with independent dependencies.                                  | [rerender.md](references/rerender.md)           |
| `rendering-content-visibility`                | `content-visibility: auto` on rows of long lists, in the block stylesheet.          | [rendering.md](references/rendering.md)         |
| `rendering-activity`                          | `<Activity>` keeps state of panels that toggle often.                               | [rendering.md](references/rendering.md)         |
| `client-event-listeners`                      | One shared global listener through `useSyncExternalStore`.                          | [data-fetching.md](references/data-fetching.md) |
| `client-passive-event-listeners`              | `{ passive: true }` on touch and wheel listeners that never `preventDefault`.       | [data-fetching.md](references/data-fetching.md) |
| `state-decouple-implementation`               | Only the provider knows where state comes from (query or local).                    | [composition.md](references/composition.md)     |
| `state-context-interface`                     | Context value is a `type` with `state`, `actions`, `meta`.                          | [composition.md](references/composition.md)     |
| `state-lift-state`                            | Lift state into a provider so siblings can read it without prop drilling.           | [composition.md](references/composition.md)     |
| `patterns-explicit-variants`                  | Different behavior gets its own component; different look gets a modifier.          | [composition.md](references/composition.md)     |
| `patterns-children-over-render-props`         | Compose with `children`, not `renderX` props (except lazy `QueryContent` children). | [composition.md](references/composition.md)     |
| `react19-apis`                                | `ref` is a prop (no `forwardRef`); `use(Context)`; `<Context value>`.               | [composition.md](references/composition.md)     |

### Low: hot paths and edge cases

| Rule                             | One line                                                                          | Reference                                 |
| -------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------- |
| `js-cache-function-results`      | Reuse `Intl` formatters per locale and currency instead of creating one per call. | [javascript.md](references/javascript.md) |
| `js-index-maps`                  | Build a `Map` by id for repeated lookups.                                         | [javascript.md](references/javascript.md) |
| `js-set-map-lookups`             | Use a `Set` for repeated membership checks.                                       | [javascript.md](references/javascript.md) |
| `js-early-exit`                  | Return as soon as the result is known.                                            | [javascript.md](references/javascript.md) |
| `js-flatmap-filter`              | `flatMap` instead of `map` + `filter(Boolean)`.                                   | [javascript.md](references/javascript.md) |
| `js-min-max-loop`                | One pass for min/max, not a sort.                                                 | [javascript.md](references/javascript.md) |
| `js-hoist-regexp`                | Regexes live in `Patterns`; never build one per render.                           | [javascript.md](references/javascript.md) |
| `rendering-hoist-jsx` (compiler) | Hoist static JSX or use a `ui` component.                                         | [rendering.md](references/rendering.md)   |
| `advanced-effect-event-deps`     | Never list a `useEffectEvent` function in dependencies.                           | [advanced.md](references/advanced.md)     |
| `advanced-use-latest`            | `useEffectEvent` reads the latest callback without re-running the effect.         | [advanced.md](references/advanced.md)     |
| `advanced-init-once`             | App-wide initialization runs once per load, not per mount.                        | [advanced.md](references/advanced.md)     |

## References

| File                                            | Read it when                                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [data-fetching.md](references/data-fetching.md) | Adding or changing a query, mutation, invalidation, optimistic update, storage, listeners. |
| [waterfalls.md](references/waterfalls.md)       | Code awaits more than one request or awaits before closing a dialog.                       |
| [bundle.md](references/bundle.md)               | Adding a heavy dependency, a chart, a wizard, or touching imports.                         |
| [rerender.md](references/rerender.md)           | A screen re-renders too often, typing lags, or effects re-run.                             |
| [rendering.md](references/rendering.md)         | Conditional JSX, hydration warnings, theme flash, long lists.                              |
| [javascript.md](references/javascript.md)       | Loops over transactions, formatting helpers, lookups, regexes.                             |
| [advanced.md](references/advanced.md)           | Effects that subscribe to events or need the latest callback.                              |
| [composition.md](references/composition.md)     | Designing props, variants, compound components or context.                                 |
| [source.md](references/source.md)               | You need the upstream origin of a rule.                                                    |

## Verify

```bash
npm run lint:fix
npm run lint && npm run typecheck && npm test -- --run && npm run build
```

Screens get a test with `QueryClientProvider` and `client.setQueryData(QueryKeys.…, data)`; mutations are mocked with `vi.mock('@/api/mutations', …)` (see `agents/conventions.md` › Tests). Do not claim a bundle or render-time improvement you did not measure.

## Keep the docs true

When a rule here becomes a new house pattern (for example `queryOptions` or a new shared hook), update `agents/conventions.md` › Client patterns and the pages listed for `apps/web` in [agents/docs-map.md](../../../agents/docs-map.md) in the same change.
