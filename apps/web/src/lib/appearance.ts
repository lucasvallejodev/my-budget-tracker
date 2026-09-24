export const ThemeStorageKey = 'coinkeeper-theme';
export const ThemeChangeEvent = 'coinkeeper-theme';
export const DarkSchemeQuery = '(prefers-color-scheme: dark)';

const DefaultTheme = 'light';

/**
 * Decides which colour scheme a theme preference renders as.
 *
 * @param theme - The stored preference: `'light'`, `'dark'` or `'system'`.
 * @param prefersDark - Whether the operating system asks for a dark scheme.
 * @returns `'dark'` or `'light'`; unknown preferences render light.
 *
 * @example
 * ```ts
 * resolveTheme('system', true); // 'dark'
 * resolveTheme('light', true); // 'light'
 * ```
 */
export const resolveTheme = (theme: string, prefersDark: boolean): 'dark' | 'light' =>
  theme === 'dark' || (theme === 'system' && prefersDark) ? 'dark' : 'light';

/**
 * Reads the stored theme preference.
 *
 * @returns The saved preference, or `'light'` when nothing is stored.
 */
export const storedTheme = (): string => localStorage.getItem(ThemeStorageKey) || DefaultTheme;

/**
 * Applies a theme preference to the document, stores it and notifies listeners.
 *
 * @remarks
 * Sets `data-theme` on `<html>` (which switches the tokens in `src/styles/tokens.scss`), saves the
 * preference in `localStorage` and dispatches {@link ThemeChangeEvent} on `window`.
 *
 * @param theme - `'light'`, `'dark'` or `'system'`.
 */
export const applyTheme = (theme: string): void => {
  const prefersDark = window.matchMedia(DarkSchemeQuery).matches;

  document.documentElement.dataset.theme = resolveTheme(theme, prefersDark);
  localStorage.setItem(ThemeStorageKey, theme);
  window.dispatchEvent(new Event(ThemeChangeEvent));
};
