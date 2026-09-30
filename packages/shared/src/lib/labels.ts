import { GroupPalette } from '../constants/palette';
import { Patterns } from './patterns';

/**
 * Turns a code identifier into words a person can read.
 *
 * @remarks
 * Used to name icons and palette colours for screen readers, which would otherwise spell out
 * names such as `ShoppingCart` or a hex code.
 *
 * @param identifier - A camelCase or PascalCase name, possibly ending in digits.
 * @returns The words in sentence case.
 *
 * @example
 * ```ts
 * humanizeIdentifier('ShoppingCart'); // 'Shopping cart'
 * humanizeIdentifier('slateLight'); // 'Slate light'
 * humanizeIdentifier('Building2'); // 'Building 2'
 * ```
 */
export const humanizeIdentifier = (identifier: string): string => {
  const words = identifier.split(Patterns.identifierWordStart).join(' ').toLowerCase();

  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * Names a colour of the group palette in words.
 *
 * @param hex - A `#RRGGBB` colour, in any letter case.
 * @returns The palette name (`'Slate light'`), or the hex code for a custom colour.
 *
 * @example
 * ```ts
 * paletteColorName('#d97706'); // 'Amber'
 * paletteColorName('#123456'); // '#123456'
 * ```
 */
export const paletteColorName = (hex: string): string => {
  const entry = Object.entries(GroupPalette).find(
    ([, value]) => value.toLowerCase() === hex.toLowerCase()
  );

  return entry ? humanizeIdentifier(entry[0]) : hex;
};
