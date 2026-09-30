import { type BrandIcon, BrandIcons } from '@/constants/brands';
import { Patterns } from '@coinkeeper/shared/lib/patterns';

const INITIALS_LENGTH = 2;
const MONOGRAM_TINTS = 8;
const HEX_RADIX = 16;
const CHANNEL_MAX = 255;
const LIGHT_LUMINANCE = 0.6;
const RED_WEIGHT = 0.299;
const GREEN_WEIGHT = 0.587;
const BLUE_WEIGHT = 0.114;
const GREEN_OFFSET = 2;
const BLUE_OFFSET = 4;
const CHANNEL_LENGTH = 2;
const HashMultiplier = 31;

/**
 * Reduces a payee name to lowercase letters and digits so spellings of one brand compare equal.
 *
 * @param name - A payee name or bank text such as `'SPOTIFY AB'`.
 * @returns The name without spaces, punctuation or case.
 *
 * @example
 * ```ts
 * payeeKey('Uber *Eats'); // 'ubereats'
 * ```
 */
export const payeeKey = (name: string): string =>
  name.toLocaleLowerCase().replace(Patterns.nonAlphanumeric, '');

/**
 * Finds the bundled brand glyph for a payee name.
 *
 * @remarks
 * A name matches a brand when its key equals the brand key or starts with it, and the longest
 * brand wins, so `'Uber Eats'` gets Uber Eats rather than Uber. Only glyphs bundled in
 * `constants/brands.ts` are used; nothing is fetched.
 *
 * @param name - The payee name or bank text.
 * @returns The brand glyph, or `undefined` for unknown payees.
 *
 * @example
 * ```ts
 * brandFor('Spotify AB')?.title; // 'Spotify'
 * brandFor('Corner Café'); // undefined
 * ```
 */
export const brandFor = (name: string): BrandIcon | undefined => {
  const key = payeeKey(name);

  if (!key) return undefined;

  const match = Object.keys(BrandIcons)
    .filter(brand => key.startsWith(brand))
    .sort((left, right) => right.length - left.length)[0];

  return match ? BrandIcons[match] : undefined;
};

/**
 * Builds the two-letter monogram shown for a name.
 *
 * @param name - A person, payee or account name.
 * @returns The first letters or digits of the first two words (punctuation ignored), or the first
 * two of a single word, in upper case; `'?'` for an empty name.
 *
 * @example
 * ```ts
 * initialsOf('Corner Café'); // 'CC'
 * initialsOf('greenleaf'); // 'GR'
 * ```
 */
export const initialsOf = (name: string): string => {
  const words = name.split(' ').map(payeeKey).filter(Boolean);

  if (!words.length) return '?';

  const initials =
    words.length > 1 ? words.map(word => word[0]).join('') : words[0].slice(0, INITIALS_LENGTH);

  return initials.slice(0, INITIALS_LENGTH).toLocaleUpperCase();
};

/**
 * Picks the monogram background for a name, so the same payee always gets the same tint.
 *
 * @param name - The payee name.
 * @returns A `var(--color-avatar-N)` reference to one of the theme's monogram tints.
 *
 * @example
 * ```ts
 * monogramTint('Corner Café') === monogramTint('Corner Café'); // true
 * ```
 */
export const monogramTint = (name: string): string => {
  const hash = [...payeeKey(name)].reduce(
    (total, character) => (total * HashMultiplier + character.charCodeAt(0)) % MONOGRAM_TINTS,
    0
  );

  return `var(--color-avatar-${hash + 1})`;
};

const channel = (hex: string, offset: number): number =>
  Number.parseInt(hex.slice(offset, offset + CHANNEL_LENGTH), HEX_RADIX) / CHANNEL_MAX;

/**
 * Chooses a readable glyph colour for a brand background.
 *
 * @param hex - The brand colour as six hex digits without `#`, as Simple Icons provides it.
 * @returns The theme's text colour for light brands, otherwise the colour used on filled buttons.
 *
 * @example
 * ```ts
 * brandForeground('E50914'); // 'var(--color-on-brand)'
 * brandForeground('FFE01B'); // 'var(--color-text)'
 * ```
 */
export const brandForeground = (hex: string): string => {
  const luminance =
    RED_WEIGHT * channel(hex, 0) +
    GREEN_WEIGHT * channel(hex, GREEN_OFFSET) +
    BLUE_WEIGHT * channel(hex, BLUE_OFFSET);

  return luminance > LIGHT_LUMINANCE ? 'var(--color-text)' : 'var(--color-on-brand)';
};
