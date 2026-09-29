// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RememberedFields, rememberedValue, rememberValue } from './form-memory';

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
});
