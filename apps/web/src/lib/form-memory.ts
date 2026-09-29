const StoragePrefix = 'coinkeeper-remembered-';

export const RememberedFields = {
  standardAccount: 'standard-account',
  transferFrom: 'transfer-from',
  transferTo: 'transfer-to',
} as const;

export type RememberedField = (typeof RememberedFields)[keyof typeof RememberedFields];

/**
 * Reads a form value remembered in this browser, such as the account used last.
 *
 * @remarks
 * A per-viewer convenience only: the value lives in `localStorage`, so it is missing in a private
 * window, after clearing site data or on another device. Storage errors are swallowed.
 *
 * @param field - Which remembered value to read (see {@link RememberedFields}).
 * @returns The stored text, or an empty string when nothing is stored or storage is unavailable.
 *
 * @example
 * ```ts
 * rememberValue(RememberedFields.standardAccount, 'acc-1');
 * rememberedValue(RememberedFields.standardAccount); // 'acc-1'
 * ```
 */
export const rememberedValue = (field: RememberedField): string => {
  try {
    return localStorage.getItem(`${StoragePrefix}${field}`) ?? '';
  } catch {
    return '';
  }
};

/**
 * Remembers a form value in this browser for the next time the form opens.
 *
 * @remarks
 * Empty values clear the entry. Storage errors (private mode, quota) are ignored because the value
 * is only a convenience.
 *
 * @param field - Which value to remember (see {@link RememberedFields}).
 * @param value - The value, such as an account id.
 */
export const rememberValue = (field: RememberedField, value: string): void => {
  try {
    if (value) localStorage.setItem(`${StoragePrefix}${field}`, value);
    else localStorage.removeItem(`${StoragePrefix}${field}`);
  } catch {
    return;
  }
};
