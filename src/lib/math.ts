import { PERCENT_SCALE } from '@/constants/money';

/**
 * Returns `value` as a whole-number percentage of `target`, e.g. budget spent against its limit.
 *
 * @remarks
 * Not clamped: the result exceeds 100 when `value` passes `target` and keeps the sign of a
 * negative value. A zero or `NaN` on either side returns 0 instead of `Infinity` or `NaN`.
 *
 * @param value - The part, e.g. the amount spent.
 * @param target - The whole, e.g. the budget limit.
 * @returns The percentage rounded to the nearest integer.
 *
 * @example
 * ```ts
 * getPercentage(1, 3); // 33
 * getPercentage(150, 100); // 150
 * getPercentage(100, 0); // 0
 * ```
 */
export const getPercentage = (value: number, target: number): number => {
  if (!value || !target) return 0;

  return Math.round((value / target) * PERCENT_SCALE);
};
