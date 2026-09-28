/**
 * Splits a list into consecutive slices of at most `size` items.
 *
 * @remarks
 * Used to keep multi-row SQL statements under PostgreSQL's limit of 65,535 bind parameters.
 *
 * @param items - The list to split.
 * @param size - The largest slice length; a positive integer.
 * @returns The slices in their original order; an empty list gives no slices.
 * @throws `RangeError` when `size` is not a positive integer.
 *
 * @example
 * ```ts
 * chunk([1, 2, 3], 2); // [[1, 2], [3]]
 * chunk([], 2); // []
 * ```
 */
export const chunk = <Item>(items: readonly Item[], size: number): Item[][] => {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError('Chunk size must be a positive integer');
  }

  return Array.from({ length: Math.ceil(items.length / size) }, (_slice, index) =>
    items.slice(index * size, (index + 1) * size)
  );
};

/**
 * Checks that no item appears twice in a list.
 *
 * @remarks
 * Items are compared with `SameValueZero`, as `Set` does.
 *
 * @param items - The list to check.
 * @returns `true` when every item is distinct, including for the empty list.
 *
 * @example
 * ```ts
 * hasDistinctItems(['a', 'b']); // true
 * hasDistinctItems(['a', 'b', 'a']); // false
 * ```
 */
export const hasDistinctItems = <Item>(items: readonly Item[]): boolean =>
  new Set(items).size === items.length;
