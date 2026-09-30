const NextKeys = new Set(['ArrowDown', 'ArrowRight']);
const PreviousKeys = new Set(['ArrowLeft', 'ArrowUp']);

/**
 * Works out which item of a one-tab-stop group (radio group, listbox) a key moves to.
 *
 * @remarks
 * Arrows move by one and wrap around; Home and End jump to the ends. Other keys return `null`
 * so the caller leaves the event alone.
 *
 * @param key - `KeyboardEvent.key`.
 * @param index - The index of the item that has focus.
 * @param count - How many items the group has.
 * @returns The index to move to, or `null` when the key does not move.
 *
 * @example
 * ```ts
 * nextRovingIndex('ArrowRight', 2, 3); // 0
 * nextRovingIndex('End', 0, 3); // 2
 * nextRovingIndex('a', 0, 3); // null
 * ```
 */
export const nextRovingIndex = (key: string, index: number, count: number): number | null => {
  if (!count) return null;
  if (NextKeys.has(key)) return (index + 1) % count;
  if (PreviousKeys.has(key)) return (index - 1 + count) % count;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;

  return null;
};

/**
 * Moves focus to another child of the element that holds a roving group.
 *
 * @param group - The group container; its element children are the items, in order.
 * @param index - The index of the child to focus.
 */
export const focusRovingItem = (group: Element | null, index: number): void => {
  const item = group?.children[index];

  if (item instanceof HTMLElement) item.focus();
};
