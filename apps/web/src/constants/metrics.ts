import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  LucideIcon,
  Percent,
  PiggyBank,
  Scale,
  Target,
} from 'lucide-react';

export type MetricKind =
  'budgeted' | 'income' | 'kept' | 'netWorth' | 'rate' | 'spending' | 'total';

export const MetricKinds: Record<MetricKind, { color: string; icon: LucideIcon }> = {
  budgeted: { color: 'var(--color-metric-budgeted)', icon: Target },
  income: { color: 'var(--color-metric-income)', icon: ArrowDownLeft },
  kept: { color: 'var(--color-metric-kept)', icon: PiggyBank },
  netWorth: { color: 'var(--color-metric-net-worth)', icon: Landmark },
  rate: { color: 'var(--color-metric-rate)', icon: Percent },
  spending: { color: 'var(--color-metric-spending)', icon: ArrowUpRight },
  total: { color: 'var(--color-metric-total)', icon: Scale },
};
