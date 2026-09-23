import { PERCENT_SCALE } from '@/constants/money';

export const getPercentage = (value: number, target: number): number => {
  if (!value || !target) return 0;

  return Math.round((value / target) * PERCENT_SCALE);
};
