const StoragePrefix = 'coinkeeper-remembered-';

export const RememberedFields = {
  currencyView: 'currency-view',
  recentCategories: 'recent-categories',
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

const ListSeparator = ',';

/**
 * Reads a list of values remembered in this browser, most recent first.
 *
 * @remarks
 * Stored as one comma-separated entry through {@link rememberedValue}, so ids must not contain
 * commas. Missing storage gives an empty list.
 *
 * @param field - Which remembered list to read (see {@link RememberedFields}).
 * @returns The stored values, most recent first.
 *
 * @example
 * ```ts
 * rememberInList(RememberedFields.recentCategories, 'food', 5);
 * rememberedList(RememberedFields.recentCategories); // ['food']
 * ```
 */
export const rememberedList = (field: RememberedField): string[] =>
  rememberedValue(field).split(ListSeparator).filter(Boolean);

/**
 * Moves a value to the front of a remembered list, keeping at most `limit` distinct values.
 *
 * @param field - Which list to update (see {@link RememberedFields}).
 * @param value - The value to put first, such as a category id.
 * @param limit - How many values to keep.
 * @returns The updated list, most recent first.
 *
 * @example
 * ```ts
 * rememberInList(RememberedFields.recentCategories, 'rent', 2); // ['rent', 'food']
 * ```
 */
export const rememberInList = (field: RememberedField, value: string, limit: number): string[] => {
  const list = [value, ...rememberedList(field).filter(item => item !== value)].slice(0, limit);

  rememberValue(field, list.join(ListSeparator));

  return list;
};
