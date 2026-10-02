import { Check, CircleAlert, Gauge, LucideIcon } from 'lucide-react';

import type { BadgeTone, ProgressTone } from '@/components/ui';
import { ISO_MONTH_LENGTH } from '@coinkeeper/shared/constants/time';
import { type BudgetPace, budgetPace } from '@coinkeeper/shared/lib/budget-pace';
import { calendarPeriod } from '@coinkeeper/shared/lib/periods';

import type { BudgetRow } from './use-finance-data';

export type BudgetState = 'fast' | 'ok' | 'over';

export const BudgetStates: Record<
  BudgetState,
  {
    fill: string;
    icon: LucideIcon;
    label: string;
    progress: ProgressTone;
    tone: BadgeTone;
  }
> = {
  fast: {
    fill: 'var(--color-warning-mark)',
    icon: Gauge,
    label: 'Spending too fast',
    progress: 'warning',
    tone: 'warning',
  },
  ok: {
    fill: 'var(--color-brand)',
    icon: Check,
    label: 'On track',
    progress: 'brand',
    tone: 'success',
  },
  over: {
    fill: 'var(--color-negative-mark)',
    icon: CircleAlert,
    label: 'Over budget',
    progress: 'danger',
    tone: 'danger',
  },
};

// keep order
export const BudgetStateOrder: BudgetState[] = ['over', 'fast', 'ok'];

export const budgetState = (
  spentMinor: number,
  limitMinor: number,
  tooFast: boolean
): BudgetState => {
  if (spentMinor > limitMinor) return 'over';

  return tooFast ? 'fast' : 'ok';
};

export type BudgetFigures = {
  budget: BudgetRow;
  leftMinor: number;
  pace: BudgetPace;
  state: BudgetState;
};

export const budgetFigures = (budget: BudgetRow, today: string): BudgetFigures => {
  const pace = budgetPace({
    billsDueMinor: budget.billsDueMinor,
    fixedSpentMinor: budget.fixedSpentMinor,
    limitMinor: budget.amountMinor,
    period: calendarPeriod(budget.month.slice(0, ISO_MONTH_LENGTH)),
    spentMinor: budget.spentMinor,
    today,
  });

  return {
    budget,
    leftMinor: budget.amountMinor - budget.spentMinor,
    pace,
    state: budgetState(budget.spentMinor, budget.amountMinor, pace.tooFast),
  };
};
