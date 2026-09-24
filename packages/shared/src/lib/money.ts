import { DECIMAL_RADIX, DEFAULT_MINOR_UNIT_DIGITS } from '../constants/money';
import { isDigitsOnly, Patterns } from './patterns';

const exponentCache = new Map<string, number>();

/**
 * Returns how many decimal digits a currency uses for its minor unit (its ISO 4217 exponent).
 *
 * @remarks
 * The value comes from `Intl.NumberFormat`, so it follows the runtime's currency data. The code
 * is case-insensitive. A code that `Intl` rejects falls back to `DEFAULT_MINOR_UNIT_DIGITS` (2)
 * instead of throwing. Results are cached per code for the life of the process.
 *
 * @param currency - ISO 4217 currency code, e.g. `'EUR'` or `'jpy'`.
 * @returns The number of decimals: 2 for EUR, 0 for JPY, 3 for KWD.
 *
 * @example
 * ```ts
 * minorUnits('EUR'); // 2
 * minorUnits('JPY'); // 0
 * minorUnits('KWD'); // 3
 * ```
 */
export const minorUnits = (currency: string): number => {
  const code = currency.toUpperCase();
  const cached = exponentCache.get(code);

  if (cached !== undefined) return cached;
  let digits = DEFAULT_MINOR_UNIT_DIGITS;

  try {
    digits =
      new Intl.NumberFormat('en', { currency: code, style: 'currency' }).resolvedOptions()
        .maximumFractionDigits ?? DEFAULT_MINOR_UNIT_DIGITS;
  } catch {
    digits = DEFAULT_MINOR_UNIT_DIGITS;
  }

  exponentCache.set(code, digits);

  return digits;
};

const minorUnitScale = (digits: number): number => DECIMAL_RADIX ** digits;

const splitDecimal = (text: string): { fractionPart: string; integerPart: string } => {
  const separatorIndex = Math.max(text.lastIndexOf(','), text.lastIndexOf('.'));

  if (separatorIndex < 0) return { fractionPart: '', integerPart: text };
  const separator = text[separatorIndex];
  const occurrences = text.split(separator).length - 1;

  if (occurrences !== 1) {
    return { fractionPart: '', integerPart: text.replace(Patterns.thousandsSeparator, '') };
  }

  return {
    fractionPart: text.slice(separatorIndex + 1),
    integerPart: text.slice(0, separatorIndex).replace(Patterns.thousandsSeparator, ''),
  };
};

/**
 * Parses an amount typed by a person into signed integer minor units of `currency`.
 *
 * @remarks
 * This is the only entry point from user text into the ledger; server actions call it with the
 * account's currency, never the Zod schema.
 *
 * - Whitespace anywhere is ignored.
 * - A leading `-`, or parentheses around the whole amount, make it negative; a leading `+` is
 *   accepted and ignored.
 * - Either decimal convention works. The last `.` or `,` is the decimal separator when it
 *   appears exactly once; when it repeats, every separator is a thousands separator.
 * - Because of that, a single separator followed by three digits counts as decimals:
 *   `'1,234'` is 1.234, which throws for USD and is 1234 minor units for KWD.
 *
 * Arithmetic runs in `BigInt`, so no floating-point rounding happens during parsing.
 *
 * @param input - Raw text such as `'1.234,56'`, `'1,234.56'`, `'(7)'` or `'-0.5'`.
 * @param currency - ISO 4217 code of the account; decides how many decimals are allowed.
 * @returns The amount in minor units (cents for EUR, yen for JPY), negative for outflows.
 * @throws `Error` when the text is empty, is not a number, has more decimals than
 *   {@link minorUnits} allows for `currency`, or exceeds `Number.MAX_SAFE_INTEGER` minor units.
 *   The messages are user-facing.
 *
 * @example
 * ```ts
 * parseAmountInput('12,50', 'EUR'); // 1250
 * parseAmountInput('1.234,56', 'EUR'); // 123456
 * parseAmountInput('1,234,567', 'USD'); // 123456700
 * parseAmountInput('(7)', 'EUR'); // -700
 * parseAmountInput('1500', 'JPY'); // 1500
 * parseAmountInput('12.5', 'JPY'); // throws: at most 0 decimal places
 * ```
 */
export const parseAmountInput = (input: string, currency: string): number => {
  const digits = minorUnits(currency);
  const text = input.trim().replace(Patterns.whitespace, '');

  if (!text) throw new Error('Amount is required');
  const negative = text.startsWith('-') || (text.startsWith('(') && text.endsWith(')'));
  const { fractionPart, integerPart } = splitDecimal(text.replace(Patterns.amountSignWrapper, ''));

  if (!isDigitsOnly(integerPart) || !isDigitsOnly(fractionPart)) {
    throw new Error('Amount must be a number');
  }

  if (fractionPart.length > digits) {
    throw new Error(`Amount can have at most ${digits} decimal place${digits === 1 ? '' : 's'}`);
  }

  const scaled =
    BigInt(integerPart || '0') * BigInt(DECIMAL_RADIX) ** BigInt(digits) +
    BigInt((fractionPart || '').padEnd(digits, '0') || '0');

  if (scaled > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Amount is too large');
  const value = Number(scaled);

  return negative ? -value : value;
};

/**
 * Writes minor units as a plain decimal string with exactly the currency's number of decimals.
 *
 * @remarks
 * The output has no currency symbol, no grouping and always uses `.` as the separator, so it is
 * meant for form fields, CSV export and values that {@link parseAmountInput} reads back, not for
 * display (use {@link formatMoney}). A non-integer input is truncated toward zero first.
 *
 * @param amountMinor - Signed amount in minor units.
 * @param currency - ISO 4217 code the amount is expressed in.
 * @returns The decimal text, with a leading `-` for negative amounts.
 *
 * @example
 * ```ts
 * minorToDecimalString(1250, 'EUR'); // '12.50'
 * minorToDecimalString(-5, 'EUR'); // '-0.05'
 * minorToDecimalString(1500, 'JPY'); // '1500'
 * ```
 */
export const minorToDecimalString = (amountMinor: number, currency: string): string => {
  const digits = minorUnits(currency);
  const abs = Math.abs(Math.trunc(amountMinor));
  const whole = Math.floor(abs / minorUnitScale(digits));
  const frac = abs % minorUnitScale(digits);
  const body = digits ? `${whole}.${String(frac).padStart(digits, '0')}` : String(whole);

  return amountMinor < 0 ? `-${body}` : body;
};

/**
 * Formats minor units for display, with the currency symbol and the locale's grouping.
 *
 * @remarks
 * Always shows exactly the currency's number of decimals (`€12.50`, never `€12.5`). Without a
 * `locale`, the runtime default is used, which can differ between the server and the browser.
 *
 * @param amountMinor - Signed amount in minor units.
 * @param currency - ISO 4217 code the amount is expressed in.
 * @param options - `locale` is a BCP 47 tag such as `'en-US'`; `signDisplay` is passed to
 *   `Intl.NumberFormat` (`'exceptZero'` adds a `+` to positive amounts).
 * @returns The localised string, e.g. `'€12.50'` or `'-¥1,500'`.
 *
 * @example
 * ```ts
 * formatMoney(1250, 'EUR', { locale: 'en-US' }); // '€12.50'
 * formatMoney(-1500, 'JPY', { locale: 'en-US' }); // '-¥1,500'
 * formatMoney(1250, 'EUR', { locale: 'en-US', signDisplay: 'exceptZero' }); // '+€12.50'
 * ```
 */
export const formatMoney = (
  amountMinor: number,
  currency: string,
  options: { locale?: string; signDisplay?: 'auto' | 'always' | 'never' | 'exceptZero' } = {}
): string => {
  const digits = minorUnits(currency);
  const value = amountMinor / minorUnitScale(digits);

  return new Intl.NumberFormat(options.locale ?? undefined, {
    currency: currency.toUpperCase(),
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
    signDisplay: options.signDisplay ?? 'auto',
    style: 'currency',
  }).format(value);
};

/**
 * Converts an amount from one currency to another at a given exchange rate.
 *
 * @remarks
 * Handles currencies with different exponents (EUR has 2 decimals, JPY 0). The result is
 * rounded to the nearest minor unit, with halves rounded away from zero so that a negative
 * amount converts to the exact negative of its positive counterpart. The ledger always stores
 * the original amount; this is only for reports in the primary currency.
 *
 * @param amountMinor - Signed amount in minor units of `from`.
 * @param from - ISO 4217 code of the amount.
 * @param to - ISO 4217 code to convert into.
 * @param rate - Units of `to` per one unit of `from` (1 EUR = `rate` USD).
 * @returns The converted amount in minor units of `to`.
 *
 * @example
 * ```ts
 * convertMinor(1000, 'EUR', 'USD', 1.1); // 1100 (10.00 EUR -> 11.00 USD)
 * convertMinor(1000, 'EUR', 'JPY', 160); // 1600 (10.00 EUR -> 1600 JPY)
 * ```
 */
export const convertMinor = (
  amountMinor: number,
  from: string,
  to: string,
  rate: number
): number => {
  const fromDigits = minorUnits(from);
  const toDigits = minorUnits(to);
  const major = amountMinor / minorUnitScale(fromDigits);
  const converted = major * rate * minorUnitScale(toDigits);

  return Math.sign(converted) * Math.round(Math.abs(converted));
};

const DisplayLocale = 'en-US';

/**
 * Formats an amount given in major units (`124580.45`), for sample data and chart axes.
 *
 * @remarks
 * Ledger amounts are minor units and go through {@link formatMoney}; this helper exists for values
 * that are already decimals, such as the component gallery's sample figures. The locale defaults
 * to `en-US` so previews render the same everywhere.
 *
 * @param amount - Amount in major units of `currency`.
 * @param currency - ISO 4217 code; defaults to `'USD'`.
 * @param options - `locale` is a BCP 47 tag such as `'en-US'`.
 * @returns The localised currency string.
 *
 * @example
 * ```ts
 * formatMajorAmount(124580.45); // '$124,580.45'
 * formatMajorAmount(10, 'EUR'); // '€10.00'
 * ```
 */
export const formatMajorAmount = (
  amount: number,
  currency = 'USD',
  options: { locale?: string } = {}
): string =>
  new Intl.NumberFormat(options.locale ?? DisplayLocale, {
    currency,
    maximumFractionDigits: minorUnits(currency),
    style: 'currency',
  }).format(amount);
