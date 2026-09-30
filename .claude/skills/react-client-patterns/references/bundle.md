> Summary: bundle rules for the web app: lazy-load heavy client-only parts with `next/dynamic` (`bundle-dynamic-imports`), load feature code on the activating event (`bundle-conditional`), preload on intent (`bundle-preload`), keep dynamic imports statically analysable (`bundle-analyzable-paths`), and keep our project barrels (`bundle-barrel-imports`).

# Bundle size

The heavy dependencies are `recharts` (the `cash-flow-chart` component, `analytics/analytics-charts.tsx` and `accounts-overview/net-worth-trend.tsx`), `react-day-picker`, `cmdk` and the import wizard. Everything else is small. Measure before and after: do not claim a size win you did not see.

## bundle-dynamic-imports

Lazy-load a heavy component that is not needed for the first paint, or that only some users open. Declare the dynamic component at module scope (never inside a component, which would remount it on every render), import by folder, and pick the named export.

Avoid:

```tsx
import { CashFlowChart } from '../cash-flow-chart';
```

Prefer:

```tsx
import dynamic from 'next/dynamic';

import { Spinner } from '@/components/ui';

const CashFlowChart = dynamic(
  () => import('../cash-flow-chart').then(chartModule => chartModule.CashFlowChart),
  { loading: () => <Spinner label="Loading chart" />, ssr: false }
);
```

- `ssr: false` is only allowed in a `'use client'` file; every screen in `components/finance/` is one.
- From `apps/web/src/app/**`, import by folder: `import('@/components/finance/cash-flow-chart')`. Never import a file inside a component folder.
- Reserve space for the chart (the `chart-frame` block) so the fallback does not shift the layout.
- Component tests that render the screen must still find the chart: mock `next/dynamic` or wait for the chart with `findBy…`.

## bundle-barrel-imports

Upstream advice says "avoid barrel files". In this repository that is wrong for our own code: `@/components/ui` and the module barrels are required, enforced by ESLint (`no-restricted-imports`) and `apps/web/src/components/structure.test.ts`. They are small, named re-exports compiled by Next.

- Keep importing components through their barrel or folder exactly as `agents/components.md` › Imports says.
- Next.js already rewrites imports from the barrels of common libraries (its default `optimizePackageImports` list includes `lucide-react`, `date-fns` and `recharts`), so do not add them to `next.config.ts` and do not deep-import `lucide-react/dist/...` (no types, breaks under `strict`).
- Category icons go through the registry in `apps/web/src/constants/icons.ts` and `<Icon icon={name} />`; never `import * as` from `lucide-react`.
- When you add a new heavy library that ships one big barrel and is not on Next's list, add it to `experimental.optimizePackageImports` in `apps/web/next.config.ts` and check the build.

## bundle-conditional

Load large code from the event that needs it, not at module load and not from an effect that mirrors state.

Avoid:

```tsx
import { exportTransactions } from '../export-transactions';

<Button variant="outline" size="sm" onClick={() => exportTransactions(filtered)}>
  Export CSV
</Button>;
```

Prefer:

```tsx
const exportFiltered = async (rows: TransactionRow[]) => {
  const { exportTransactions } = await import('../export-transactions');

  exportTransactions(rows);
};

<Button variant="outline" size="sm" onClick={() => exportFiltered(filtered)}>
  Export CSV
</Button>;
```

Worth it only when the module is large or pulls a dependency; `export-transactions.ts` is small, so this is the shape, not a required change.

## bundle-preload

Start downloading a lazy chunk when the user shows intent (hover, focus), so it is ready by the click. Pair with `bundle-dynamic-imports`.

```tsx
const preloadImportWizard = () => {
  void import('../import-wizard');
};

<Button onClick={openImport} onFocus={preloadImportWizard} onMouseEnter={preloadImportWizard}>
  Import CSV
</Button>;
```

Data can be preloaded the same way with `queryClient.prefetchQuery(...)`; see `client-query-hooks` in [data-fetching.md](data-fetching.md).

## bundle-analyzable-paths

The bundler can only split what it can see. Build dynamic imports from an explicit map of literal `import()` calls, never from a path held in a variable. The map is a module-level constant object, so its name is PascalCase.

Avoid:

```ts
const chartPath = `../${chartName}-chart`;
const chartModule = await import(chartPath);
```

Prefer:

```ts
const ChartLoaders = {
  cashFlow: () => import('../cash-flow-chart').then(chartModule => chartModule.CashFlowChart),
  analytics: () => import('../analytics').then(chartModule => chartModule.Analytics),
};

const Chart = await ChartLoaders[chartName]();
```
