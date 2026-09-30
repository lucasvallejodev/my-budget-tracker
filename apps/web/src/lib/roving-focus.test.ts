import { describe, expect, it } from 'vitest';

import { focusRovingItem, nextRovingIndex } from './roving-focus';

describe('nextRovingIndex', () => {
  it('moves with arrows, wraps, and jumps with Home and End', () => {
    expect(nextRovingIndex('ArrowRight', 0, 3)).toBe(1);
    expect(nextRovingIndex('ArrowDown', 2, 3)).toBe(0);
    expect(nextRovingIndex('ArrowLeft', 0, 3)).toBe(2);
    expect(nextRovingIndex('ArrowUp', 1, 3)).toBe(0);
    expect(nextRovingIndex('Home', 2, 3)).toBe(0);
    expect(nextRovingIndex('End', 0, 3)).toBe(2);
    expect(nextRovingIndex('Enter', 0, 3)).toBeNull();
    expect(nextRovingIndex('ArrowRight', 0, 0)).toBeNull();
  });
});

describe('focusRovingItem', () => {
  it('focuses the child at the index and ignores a missing one', () => {
    const group = document.createElement('div');

    group.innerHTML = '<button>One</button><button>Two</button>';
    document.body.append(group);
    focusRovingItem(group, 1);

    expect(document.activeElement?.textContent).toBe('Two');

    focusRovingItem(group, 5);
    focusRovingItem(null, 0);

    expect(document.activeElement?.textContent).toBe('Two');
    group.remove();
  });
});
