import type { StatDelta } from '@/components/ui';
import { getPercentage } from '@/lib/math';

export type Comparison = {
  delta?: StatDelta;
  meta: string;
};

export const compareWith = (
  current: number,
  previous: number,
  previousName: string,
  risingIsGood: boolean
): Comparison => {
  if (!previous) return { meta: `Nothing in ${previousName}` };

  const change = getPercentage(current - previous, previous);

  if (!change) return { meta: `Same as ${previousName}` };

  return {
    delta: {
      good: change > 0 === risingIsGood,
      label: `${Math.abs(change)}%`,
      rising: change > 0,
    },
    meta: `vs ${previousName}`,
  };
};
