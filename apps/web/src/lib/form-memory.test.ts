// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  RememberedFields,
  rememberedList,
  rememberedValue,
  rememberInList,
  rememberValue,
} from './form-memory';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('form memory', () => {
  it('remembers and reads a value', () => {
    rememberValue(RememberedFields.standardAccount, 'acc-1');

    expect(rememberedValue(RememberedFields.standardAccount)).toBe('acc-1');
    expect(rememberedValue(RememberedFields.transferFrom)).toBe('');
  });

  it('clears the value when given an empty one', () => {
    rememberValue(RememberedFields.transferTo, 'acc-2');
    rememberValue(RememberedFields.transferTo, '');

    expect(rememberedValue(RememberedFields.transferTo)).toBe('');
  });

  it('ignores storage that is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() => rememberValue(RememberedFields.standardAccount, 'acc-1')).not.toThrow();
    expect(rememberedValue(RememberedFields.standardAccount)).toBe('');
  });

  it('keeps a most-recent-first list without duplicates', () => {
    rememberInList(RememberedFields.recentCategories, 'food', 2);
    rememberInList(RememberedFields.recentCategories, 'rent', 2);

    expect(rememberInList(RememberedFields.recentCategories, 'rent', 2)).toEqual(['rent', 'food']);
    expect(rememberInList(RememberedFields.recentCategories, 'fuel', 2)).toEqual(['fuel', 'rent']);
    expect(rememberedList(RememberedFields.recentCategories)).toEqual(['fuel', 'rent']);
    expect(rememberedList(RememberedFields.currencyView)).toEqual([]);
  });
});
