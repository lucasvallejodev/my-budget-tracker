/**
 * Design tokens that JavaScript needs (SVG charts, seeded data, inline styles).
 *
 * CSS keeps its own tokens in `tokens.scss`; in JSX and SCSS prefer `var(--token)` whenever a
 * CSS variable exists, and reach for this file only where a literal value is required.
 * Every colour used from TypeScript must be declared here: the linter rejects hex, rgb() and
 * hsl() literals anywhere else.
 */

/** Violet scale shared by charts and the accent colour. */
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
  /** Default accent for colour inputs and highlighted chart series. */
  accent: Violet[500],
  /** Palette offered when a category group is created; seeded data uses the same values. */
  group: {
    green: '#16A34A',
    emerald: '#059669',
    cyan: '#0891B2',
    blue: '#2563EB',
    violet: '#7C3AED',
    purple: '#9333EA',
    pink: '#DB2777',
    rose: '#E11D48',
    red: '#DC2626',
    orange: '#EA580C',
    amber: '#D97706',
    yellow: '#CA8A04',
    slate: '#475569',
    slateLight: '#64748B',
    stone: '#78716C',
    teal: '#0F766E',
  },
  /** Fallback for transactions without a category group. */
  uncategorized: '#94A3B8',
  chart: {
    income: Violet[500],
    expense: Gray[400],
    /** Ordered palette for distribution charts; index by series position. */
    series: [Violet[500], Violet[400], Violet[300], Violet[200], Gray[200]],
    /** "Spent" vs "available" pairs in budget rings. */
    used: Violet[500],
    remaining: Violet[200],
  },
} as const;

/** Swatches shown by the colour picker, in display order. */
export const GroupColors: readonly string[] = Object.values(Colors.group);

/** Recharts style objects shared by every chart. */
export const ChartStyle = {
  tooltip: {
    background: 'var(--surface)',
    color: 'var(--ink)',
    border: '1px solid var(--border)',
    borderRadius: 10,
  },
  axisTick: { fill: 'var(--muted)', fontSize: 11 },
  grid: 'var(--border)',
} as const;
