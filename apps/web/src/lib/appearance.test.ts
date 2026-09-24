import { afterEach, describe, expect, it, vi } from 'vitest';

import { applyTheme, resolveTheme, storedTheme, ThemeChangeEvent } from './appearance';

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

const stubSystemScheme = (dark: boolean) =>
  vi.stubGlobal('matchMedia', () => ({ matches: dark }) as MediaQueryList);

describe('resolveTheme', () => {
  it('follows the system only for the system preference', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});

describe('applyTheme', () => {
  it('marks the document, stores the preference and notifies listeners', () => {
    const listener = vi.fn();

    stubSystemScheme(true);
    window.addEventListener(ThemeChangeEvent, listener);
    applyTheme('system');
    window.removeEventListener(ThemeChangeEvent, listener);

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(storedTheme()).toBe('system');
    expect(listener).toHaveBeenCalledOnce();
  });

  it('defaults the stored preference to light', () => {
    expect(storedTheme()).toBe('light');
  });
});
