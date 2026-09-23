import { describe, expect, it } from 'vitest';
import { getPercentage } from './math';

describe('getPercentage', () => {
  it('rounds to a whole number', () => {
    expect(getPercentage(1, 3)).toBe(33);
    expect(getPercentage(2, 3)).toBe(67);
    expect(getPercentage(50, 200)).toBe(25);
  });

  it('can exceed 100 when the value passes the target', () => {
    expect(getPercentage(150, 100)).toBe(150);
  });

  it('keeps the sign of a negative value', () => {
    expect(getPercentage(-50, 200)).toBe(-25);
  });

  it('returns 0 when the value or the target is zero or not a number', () => {
    expect(getPercentage(0, 100)).toBe(0);
    expect(getPercentage(100, 0)).toBe(0);
    expect(getPercentage(Number.NaN, 100)).toBe(0);
    expect(getPercentage(100, Number.NaN)).toBe(0);
  });
});
