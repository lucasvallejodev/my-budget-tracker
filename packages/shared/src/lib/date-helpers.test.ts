import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { getStartAndEndOfMonth, isoDateOfMonthStart, toIsoDate, toIsoMonth } from './date-helpers';

describe('getStartAndEndOfMonth', () => {
  const mockDate = new Date(2025, 4, 1);

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should return current month start and end when no parameters are provided', () => {
    const { endDate, startDate } = getStartAndEndOfMonth();

    expect(startDate).toEqual(new Date(2025, 4, 1));
    expect(endDate).toEqual(new Date(2025, 4, 31, 23, 59, 59, 999));
  });

  it('should handle undefined month parameter', () => {
    const { endDate, startDate } = getStartAndEndOfMonth(undefined, 2024);

    expect(startDate).toEqual(new Date(2024, 4, 1));
    expect(endDate).toEqual(new Date(2024, 4, 31, 23, 59, 59, 999));
  });

  it('should handle undefined year parameter', () => {
    const { endDate, startDate } = getStartAndEndOfMonth(2);

    expect(startDate).toEqual(new Date(2025, 2, 1));
    expect(endDate).toEqual(new Date(2025, 2, 31, 23, 59, 59, 999));
  });

  it('should use current month when month is less than MIN_MONTH', () => {
    const { endDate, startDate } = getStartAndEndOfMonth(-1, 2024);

    expect(startDate).toEqual(new Date(2024, 4, 1));
    expect(endDate).toEqual(new Date(2024, 4, 31, 23, 59, 59, 999));
  });

  it('should use current month when month is greater than MAX_MONTH', () => {
    const { endDate, startDate } = getStartAndEndOfMonth(12, 2024);

    expect(startDate).toEqual(new Date(2024, 4, 1));
    expect(endDate).toEqual(new Date(2024, 4, 31, 23, 59, 59, 999));
  });

  it('should use current year when year is less than MIN_YEAR', () => {
    const { endDate, startDate } = getStartAndEndOfMonth(2, 1899);

    expect(startDate).toEqual(new Date(2025, 2, 1));
    expect(endDate).toEqual(new Date(2025, 2, 31, 23, 59, 59, 999));
  });

  it('should use current year when year is greater than MAX_YEAR', () => {
    const { endDate, startDate } = getStartAndEndOfMonth(2, 2101);

    expect(startDate).toEqual(new Date(2025, 2, 1));
    expect(endDate).toEqual(new Date(2025, 2, 31, 23, 59, 59, 999));
  });

  it('should handle January correctly', () => {
    const { endDate, startDate } = getStartAndEndOfMonth(0, 2024);

    expect(startDate).toEqual(new Date(2024, 0, 1));
    expect(endDate).toEqual(new Date(2024, 0, 31, 23, 59, 59, 999));
  });

  it('should handle December correctly', () => {
    const { endDate, startDate } = getStartAndEndOfMonth(11, 2024);

    expect(startDate).toEqual(new Date(2024, 11, 1));
    expect(endDate).toEqual(new Date(2024, 11, 31, 23, 59, 59, 999));
  });

  it('should use valid month when in range', () => {
    const { endDate, startDate } = getStartAndEndOfMonth(6, 2023);

    expect(startDate).toEqual(new Date(2023, 6, 1));
    expect(endDate).toEqual(new Date(2023, 6, 31, 23, 59, 59, 999));
  });

  it('should use valid year when in range', () => {
    const { endDate, startDate } = getStartAndEndOfMonth(3, 2000);

    expect(startDate).toEqual(new Date(2000, 3, 1));
    expect(endDate).toEqual(new Date(2000, 3, 30, 23, 59, 59, 999));
  });

  it('should handle February in a leap year', () => {
    const { endDate, startDate } = getStartAndEndOfMonth(1, 2024);

    expect(startDate).toEqual(new Date(2024, 1, 1));
    expect(endDate).toEqual(new Date(2024, 1, 29, 23, 59, 59, 999));
  });

  it('should handle February in a non-leap year', () => {
    const { endDate, startDate } = getStartAndEndOfMonth(1, 2023);

    expect(startDate).toEqual(new Date(2023, 1, 1));
    expect(endDate).toEqual(new Date(2023, 1, 28, 23, 59, 59, 999));
  });

  it('should handle boundary values for month', () => {
    let result = getStartAndEndOfMonth(1, 2024);

    expect(result.startDate).toEqual(new Date(2024, 1, 1));

    result = getStartAndEndOfMonth(10, 2024);
    expect(result.startDate).toEqual(new Date(2024, 10, 1));
  });

  it('should handle boundary values for year', () => {
    let result = getStartAndEndOfMonth(5, 1901);

    expect(result.startDate).toEqual(new Date(1901, 5, 1));

    result = getStartAndEndOfMonth(5, 2099);
    expect(result.startDate).toEqual(new Date(2099, 5, 1));
  });

  it('should handle equal to boundary values', () => {
    let result = getStartAndEndOfMonth(0, 2024);

    expect(result.startDate).toEqual(new Date(2024, 0, 1));

    result = getStartAndEndOfMonth(5, 1899);
    expect(result.startDate).toEqual(new Date(2025, 5, 1));

    result = getStartAndEndOfMonth(11, 2024);
    expect(result.startDate).toEqual(new Date(2024, 11, 1));

    result = getStartAndEndOfMonth(5, 2101);
    expect(result.startDate).toEqual(new Date(2025, 5, 1));
  });
});

describe('ISO date helpers', () => {
  const september23 = new Date(Date.UTC(2026, 8, 23));

  it('formats the UTC calendar day and month', () => {
    expect(toIsoDate(september23)).toBe('2026-09-23');
    expect(toIsoMonth(september23)).toBe('2026-09');
  });

  it('returns the first day of a month, shifted across year boundaries', () => {
    expect(isoDateOfMonthStart('2026-09')).toBe('2026-09-01');
    expect(isoDateOfMonthStart('2026-12', 1)).toBe('2027-01-01');
    expect(isoDateOfMonthStart('2026-01', -1)).toBe('2025-12-01');
  });

  it('throws a RangeError for text that is not a month', () => {
    expect(() => isoDateOfMonthStart('September')).toThrow(RangeError);
  });
});
