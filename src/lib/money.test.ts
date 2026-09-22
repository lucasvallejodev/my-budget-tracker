import { describe, expect, it } from 'vitest';
import {
  convertMinor,
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
  });
});
