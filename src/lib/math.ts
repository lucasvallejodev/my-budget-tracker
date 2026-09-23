/**
 * Whole-number percentage of `value` over `target`, 0 when either is zero or missing.
 * Used for budget usage, savings rate and target progress.
 */
export const getPercentage = (value: number, target: number): number => {
  if (!value || !target) return 0;

  return Math.round((value / target) * 100);
};
