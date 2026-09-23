import { DECIMAL_RADIX, DEFAULT_MINOR_UNIT_DIGITS } from '@/constants/money';
import { isDigitsOnly, Patterns } from '@/lib/patterns';

const exponentCache = new Map<string, number>();

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

export const minorToDecimalString = (amountMinor: number, currency: string): string => {
  const digits = minorUnits(currency);
  const abs = Math.abs(Math.trunc(amountMinor));
  const whole = Math.floor(abs / minorUnitScale(digits));
  const frac = abs % minorUnitScale(digits);
  const body = digits ? `${whole}.${String(frac).padStart(digits, '0')}` : String(whole);

  return amountMinor < 0 ? `-${body}` : body;
};

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
