import type { BadgeTone } from '@/components/ui';

const NearLimitRatio = 0.8;

export const budgetStatus = (
  ratio: number,
  tooFast = false
): { label: string; tone: BadgeTone } => {
  if (ratio >= 1) return { label: 'Exceeded', tone: 'danger' };
  if (tooFast) return { label: 'Spending too fast', tone: 'warning' };
  if (ratio >= NearLimitRatio) return { label: 'Near limit', tone: 'warning' };

  return { label: 'On track', tone: 'success' };
};
