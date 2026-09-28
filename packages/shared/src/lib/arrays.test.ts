import { describe, expect, it } from 'vitest';

import { chunk, hasDistinctItems } from './arrays';

describe('chunk', () => {
  it('splits a list into slices of the given size, keeping the order', () => {
    expect(chunk([1, 2, 3], 2)).toEqual([[1, 2], [3]]);
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('returns no slices for an empty list', () => {
    expect(chunk([], 2)).toEqual([]);
  });

  it('rejects a size that is not a positive integer', () => {
    expect(() => chunk([1], 0)).toThrow(RangeError);
    expect(() => chunk([1], 1.5)).toThrow(RangeError);
  });
});

describe('hasDistinctItems', () => {
  it('accepts a list of distinct items, including the empty list', () => {
    expect(hasDistinctItems(['a', 'b'])).toBe(true);
    expect(hasDistinctItems([])).toBe(true);
  });

  it('rejects a list with a repeated item', () => {
    expect(hasDistinctItems(['a', 'b', 'a'])).toBe(false);
  });
});
