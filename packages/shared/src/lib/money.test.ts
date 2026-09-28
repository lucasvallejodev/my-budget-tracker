import { describe, expect, it } from 'vitest';

import {
  convertMinor,
  formatMajorAmount,
  formatMoney,
  minorToDecimalString,
  minorUnits,
  parseAmountInput,
} from './money';

describe('money', () => {
  it('knows currency exponents', () => {
    expect(minorUnits('EUR')).toBe(2);
    expect(minorUnits('JPY')).toBe(0);
    expect(minorUnits('KWD')).toBe(3);
  });
  it('parses decimal input in either convention', () => {
    expect(parseAmountInput('12.50', 'EUR')).toBe(1250);
    expect(parseAmountInput('12,50', 'EUR')).toBe(1250);
    expect(parseAmountInput('1.234,56', 'EUR')).toBe(123456);
    expect(parseAmountInput('1,234.56', 'USD')).toBe(123456);
    expect(parseAmountInput('1,234,567', 'USD')).toBe(123456700);
    expect(parseAmountInput('-7', 'EUR')).toBe(-700);
    expect(parseAmountInput('(7)', 'EUR')).toBe(-700);
    expect(parseAmountInput('1500', 'JPY')).toBe(1500);
    expect(parseAmountInput('0.5', 'EUR')).toBe(50);
    expect(parseAmountInput('1.234', 'KWD')).toBe(1234);
    expect(() => parseAmountInput('1.234', 'EUR')).toThrow(/decimal/);
    expect(() => parseAmountInput('12.5', 'JPY')).toThrow(/decimal/);
    expect(() => parseAmountInput('abc', 'EUR')).toThrow(/number/);
    expect(() => parseAmountInput('', 'EUR')).toThrow(/required/);
  });
  it('round-trips decimals and formats with the exponent', () => {
    expect(minorToDecimalString(1250, 'EUR')).toBe('12.50');
    expect(minorToDecimalString(-5, 'EUR')).toBe('-0.05');
    expect(minorToDecimalString(1500, 'JPY')).toBe('1500');
    expect(formatMoney(1250, 'EUR', { locale: 'en-US' })).toBe('€12.50');
    expect(formatMoney(-1500, 'JPY', { locale: 'en-US' })).toBe('-¥1,500');
    expect(formatMoney(1250, 'EUR', { locale: 'en-US', signDisplay: 'exceptZero' })).toBe(
      '+€12.50'
    );
  });
  it('converts between exponents with rounding', () => {
    expect(convertMinor(100000, 'EUR', 'USD', 1.085)).toBe(108500);
    expect(convertMinor(100000, 'EUR', 'JPY', 160.5)).toBe(160500);
    expect(convertMinor(-333, 'USD', 'EUR', 0.9)).toBe(-300);
    expect(convertMinor(1000, 'EUR', 'USD', 1.1)).toBe(1100);
    expect(convertMinor(1000, 'EUR', 'JPY', 160)).toBe(1600);
  });
  it('rounds conversion halves away from zero symmetrically', () => {
    expect(convertMinor(1, 'JPY', 'JPY', 0.5)).toBe(1);
    expect(convertMinor(-1, 'JPY', 'JPY', 0.5)).toBe(-1);
  });
  it('treats currency codes case-insensitively', () => {
    expect(minorUnits('jpy')).toBe(0);
  });
  it('reads a single separator before three digits as decimals', () => {
    expect(parseAmountInput('1,234', 'KWD')).toBe(1234);
    expect(() => parseAmountInput('1,234', 'USD')).toThrow(/decimal/);
  });
  it('accepts a leading plus sign and ignores inner whitespace', () => {
    expect(parseAmountInput('+5', 'EUR')).toBe(500);
    expect(parseAmountInput(' 1 234,50 ', 'EUR')).toBe(123450);
  });
  it('rejects amounts beyond the safe integer range', () => {
    expect(() => parseAmountInput('99999999999999999', 'EUR')).toThrow(/too large/);
  });
});

describe('formatMajorAmount', () => {
  it('formats decimal amounts in en-US by default', () => {
    expect(formatMajorAmount(124580.45)).toBe('$124,580.45');
    expect(formatMajorAmount(10, 'EUR')).toBe('€10.00');
  });

  it('follows the currency exponent', () => {
    expect(formatMajorAmount(1500, 'JPY')).toBe('¥1,500');
  });
});

const Exponents = [
  { currency: 'JPY', digits: 0 },
  { currency: 'EUR', digits: 2 },
  { currency: 'KWD', digits: 3 },
];

const DriftProne = [
  {
    currency: 'EUR',
    minor: 29,
    text: '0.29',
  },
  {
    currency: 'EUR',
    minor: 57,
    text: '0.57',
  },
  {
    currency: 'EUR',
    minor: 110,
    text: '1.10',
  },
  {
    currency: 'EUR',
    minor: 115,
    text: '1.15',
  },
  {
    currency: 'EUR',
    minor: 435,
    text: '4.35',
  },
  {
    currency: 'EUR',
    minor: 1999,
    text: '19.99',
  },
  {
    currency: 'KWD',
    minor: 1005,
    text: '1.005',
  },
  {
    currency: 'KWD',
    minor: 8675,
    text: '8.675',
  },
];

const EdgeAmounts = [
  0,
  1,
  9,
  10,
  99,
  100,
  101,
  999,
  1000,
  1001,
  123456,
  1_000_000_007,
  10 ** 12,
  10 ** 15 - 1,
  Number.MAX_SAFE_INTEGER,
];

const SAMPLE_COUNT = 500;
const SAMPLE_SEED = 20260928;
const EXHAUSTIVE_MAJOR_UNITS = 20;
const PARK_MILLER_MULTIPLIER = 48271;
const PARK_MILLER_MODULUS = 2 ** 31 - 1;

const seededRandom = (seed: number) => {
  let state = seed;

  return () => {
    state = (state * PARK_MILLER_MULTIPLIER) % PARK_MILLER_MODULUS;

    return state / PARK_MILLER_MODULUS;
  };
};

const negated = (amount: number) => (amount === 0 ? 0 : -amount);

const sampledAmounts = (limit: number): number[] => {
  const random = seededRandom(SAMPLE_SEED);
  const magnitudes = Math.ceil(Math.log10(limit)) + 1;

  return Array.from({ length: SAMPLE_COUNT }, () => {
    const magnitude = Math.floor(random() * magnitudes);
    const amount = Math.floor(random() * Math.min(10 ** magnitude, limit));

    return random() < 0.5 ? negated(amount) : amount;
  });
};

const withSigns = (amounts: number[]) => amounts.flatMap(amount => [amount, negated(amount)]);

const plainEnUs = (formatted: string) => formatted.replace(/[^\d.-]/g, '');

describe('money round trips', () => {
  it.each(Exponents)('reads back every decimal string it writes in $currency', ({ currency }) => {
    for (const amount of [...withSigns(EdgeAmounts), ...sampledAmounts(Number.MAX_SAFE_INTEGER)]) {
      expect(parseAmountInput(minorToDecimalString(amount, currency), currency)).toBe(amount);
    }
  });

  it.each(Exponents)(
    'parses every amount up to $digits decimals exactly in $currency',
    ({ currency, digits }) => {
      const scale = 10 ** digits;

      for (let amount = 0; amount <= EXHAUSTIVE_MAJOR_UNITS * scale; amount += 1) {
        const text = minorToDecimalString(amount, currency);

        expect(parseAmountInput(text, currency)).toBe(amount);
        expect(parseAmountInput(`-${text}`, currency)).toBe(-amount);
        expect(parseAmountInput(`(${text})`, currency)).toBe(-amount);
        expect(parseAmountInput(`+${text}`, currency)).toBe(amount);
        expect(parseAmountInput(text.replace('.', ','), currency)).toBe(amount);
      }
    }
  );

  it.each(DriftProne)(
    'parses $text $currency to $minor without float drift',
    ({ currency, minor, text }) => {
      expect(parseAmountInput(text, currency)).toBe(minor);
      expect(minorToDecimalString(minor, currency)).toBe(text);
    }
  );

  it('adds parsed amounts without drift where floats would', () => {
    expect(parseAmountInput('0.10', 'EUR') + parseAmountInput('0.20', 'EUR')).toBe(
      parseAmountInput('0.30', 'EUR')
    );

    const tenths = Array.from({ length: 10 }, () => parseAmountInput('0.1', 'EUR'));

    expect(tenths.reduce((total, amount) => total + amount, 0)).toBe(parseAmountInput('1', 'EUR'));
  });

  it('keeps the largest safe amount exact and rejects the next one', () => {
    expect(parseAmountInput('90,071,992,547,409.91', 'EUR')).toBe(Number.MAX_SAFE_INTEGER);
    expect(parseAmountInput('9007199254740991', 'JPY')).toBe(Number.MAX_SAFE_INTEGER);
    expect(parseAmountInput('-9.007.199.254.740,991', 'KWD')).toBe(-Number.MAX_SAFE_INTEGER);
    expect(minorToDecimalString(Number.MAX_SAFE_INTEGER, 'KWD')).toBe('9007199254740.991');
    expect(() => parseAmountInput('90071992547409.92', 'EUR')).toThrow(/too large/);
    expect(() => parseAmountInput('9007199254740992', 'JPY')).toThrow(/too large/);
  });

  it.each(Exponents)(
    'formats every safe amount so it reads back exactly in $currency',
    ({ currency, digits }) => {
      const amounts = [...withSigns(EdgeAmounts), ...sampledAmounts(Number.MAX_SAFE_INTEGER)];

      for (const amount of amounts) {
        const formatted = formatMoney(amount, currency, { locale: 'en-US' });

        expect(parseAmountInput(plainEnUs(formatted), currency)).toBe(amount);
        expect(plainEnUs(formatted).split('.')[1]?.length ?? 0).toBe(digits);
      }
    }
  );
});

describe('formatMoney precision', () => {
  it('formats the largest safe amount without float rounding', () => {
    expect(formatMoney(Number.MAX_SAFE_INTEGER, 'EUR', { locale: 'en-US' })).toBe(
      '€90,071,992,547,409.91'
    );
    expect(formatMoney(-Number.MAX_SAFE_INTEGER, 'KWD', { locale: 'en-US' })).toContain(
      '9,007,199,254,740.991'
    );
  });

  it('reuses one formatter per locale, currency and sign display', () => {
    expect(formatMoney(1250, 'eur', { locale: 'en-US' })).toBe(
      formatMoney(1250, 'EUR', { locale: 'en-US' })
    );
  });
});
