import { GroupPalette, UNCATEGORIZED_COLOR } from '@coinkeeper/shared/constants/palette';

const cssVariable = (name: string): string => `var(--${name})`;

export const Colors = {
  brand: cssVariable('color-brand'),
  chart: {
    axis: cssVariable('color-chart-axis'),
    expense: cssVariable('color-chart-expense'),
    grid: cssVariable('color-chart-grid'),
    income: cssVariable('color-chart-income'),
    muted: cssVariable('color-chart-muted'),
    negative: cssVariable('color-negative-mark'),
    positive: cssVariable('color-positive-mark'),
    warning: cssVariable('color-warning-mark'),
  },
  group: GroupPalette,
  surface: cssVariable('color-surface'),
  text: cssVariable('color-text'),
  textMuted: cssVariable('color-text-muted'),
  uncategorizedFallback: UNCATEGORIZED_COLOR,
} as const;

export const GroupColors: readonly string[] = Object.values(Colors.group);

export const DefaultPickerColor = GroupPalette.blue;

export const ChartStyle = {
  axisTick: { fill: Colors.chart.axis, fontSize: cssVariable('font-size-micro') },
  grid: Colors.chart.grid,
  tooltip: {
    background: Colors.surface,
    border: cssVariable('border-card'),
    borderRadius: cssVariable('radius-control'),
    boxShadow: cssVariable('shadow-raised'),
    color: Colors.text,
    fontSize: cssVariable('font-size-meta'),
  },
} as const;
