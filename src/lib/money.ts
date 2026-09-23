/**
 * Money helpers. Amounts are stored as signed integer minor units (cents) next to an
 * ISO-4217 currency code. Nothing here ever uses floating point for arithmetic.
 */
export type Money = { amountMinor: number; currency: string };

const exponentCache = new Map<string, number>();

/** Number of minor-unit digits for a currency (EUR 2, JPY 0, KWD 3). */
export const minorUnits = (currency: string): number => {
  const code = currency.toUpperCase();
  const cached = exponentCache.get(code);

  if (cached !== undefined) return cached;
  let digits = 2;

  try {
    digits =
      new Intl.NumberFormat('en', { style: 'currency', currency: code }).resolvedOptions()
        .maximumFractionDigits ?? 2;
  } catch {
    digits = 2;
  }

  exponentCache.set(code, digits);

  return digits;
};

/** Parse user input such as "12.50", "12,50", "1.234,56" or "-7" into minor units. */
export const parseAmountInput = (input: string, currency: string): number => {
  const digits = minorUnits(currency);
  let text = input.trim().replace(/\s/g, '');

  if (!text) throw new Error('Amount is required');
  const negative = text.startsWith('-') || (text.startsWith('(') && text.endsWith(')'));

  text = text.replace(/^[-+(]|\)$/g, '');
  // Decimal separator rule: when both "," and "." appear, the last one is the decimal separator.
  // A separator that appears more than once is a thousands separator. A single separator is
  // always treated as the decimal separator ("1.234" → 1.234, like an HTML number input).
  let integerPart = text;
  let fractionPart = '';
  const lastComma = text.lastIndexOf(',');
  const lastDot = text.lastIndexOf('.');
  const separatorIndex = Math.max(lastComma, lastDot);

  if (separatorIndex >= 0) {
    const separator = text[separatorIndex];
    const occurrences = text.split(separator).length - 1;

    if (occurrences === 1) {
      integerPart = text.slice(0, separatorIndex);
      fractionPart = text.slice(separatorIndex + 1);
    }
  }

  integerPart = integerPart.replace(/[.,]/g, '');

  if (!/^\d*$/.test(integerPart) || !/^\d*$/.test(fractionPart)) {
    throw new Error('Amount must be a number');
  }

  if (fractionPart.length > digits) {
    throw new Error(`Amount can have at most ${digits} decimal place${digits === 1 ? '' : 's'}`);
  }

  const scaled =
    BigInt(integerPart || '0') * BigInt(10) ** BigInt(digits) +
    BigInt((fractionPart || '').padEnd(digits, '0') || '0');

  if (scaled > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Amount is too large');
  const value = Number(scaled);

  return negative ? -value : value;
};

/** Convert minor units to a decimal string with the currency's exponent, e.g. 1250 → "12.50". */
export const minorToDecimalString = (amountMinor: number, currency: string): string => {
  const digits = minorUnits(currency);
  const abs = Math.abs(Math.trunc(amountMinor));
  const whole = Math.floor(abs / 10 ** digits);
  const frac = abs % 10 ** digits;
  const body = digits ? `${whole}.${String(frac).padStart(digits, '0')}` : String(whole);

  return amountMinor < 0 ? `-${body}` : body;
};

/** Format minor units as a localised currency string. */
export const formatMoney = (
  amountMinor: number,
  currency: string,
  options: { locale?: string; signDisplay?: 'auto' | 'always' | 'never' | 'exceptZero' } = {}
): string => {
  const digits = minorUnits(currency);
  const value = amountMinor / 10 ** digits;

  return new Intl.NumberFormat(options.locale ?? undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: options.signDisplay ?? 'auto',
  }).format(value);
};

/** Convert minor units of one currency into another using a decimal rate, rounding half away from zero. */
export const convertMinor = (
  amountMinor: number,
  from: string,
  to: string,
  rate: number
): number => {
  const fromDigits = minorUnits(from);
  const toDigits = minorUnits(to);
  const major = amountMinor / 10 ** fromDigits;
  const converted = major * rate * 10 ** toDigits;

  return Math.sign(converted) * Math.round(Math.abs(converted));
};

export const sumMinor = (values: number[]): number =>
  values.reduce((total, value) => total + value, 0);
