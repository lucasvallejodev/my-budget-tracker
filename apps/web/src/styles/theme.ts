import { GroupPalette, UNCATEGORIZED_COLOR } from '@coinkeeper/shared/constants/palette';

const Violet = {
  200: '#ddd6fe',
  300: '#c4b5fd',
  400: '#a78bfa',
  500: '#8b5cf6',
} as const;

const Gray = {
  200: '#e5e7eb',
  400: '#9ca3af',
} as const;

export const Colors = {
  accent: Violet[500],
  chart: {
    expense: Gray[400],
    income: Violet[500],
    remaining: Violet[200],
    series: [Violet[500], Violet[400], Violet[300], Violet[200], Gray[200]],
    used: Violet[500],
  },
  group: GroupPalette,
  uncategorizedFallback: UNCATEGORIZED_COLOR,
} as const;

export const GroupColors: readonly string[] = Object.values(Colors.group);

export const ChartStyle = {
  axisTick: { fill: 'var(--muted)', fontSize: 11 },
  grid: 'var(--border)',
  tooltip: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    color: 'var(--ink)',
  },
} as const;
