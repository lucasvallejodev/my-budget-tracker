import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getStartAndEndOfMonth } from './date-helpers';

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
    const { startDate, endDate } = getStartAndEndOfMonth();

    expect(startDate).toEqual(new Date(2025, 4, 1));
    expect(endDate).toEqual(new Date(2025, 4, 31, 23, 59, 59, 999));
  });

  it('should handle undefined month parameter', () => {
    const { startDate, endDate } = getStartAndEndOfMonth(undefined, 2024);

    expect(startDate).toEqual(new Date(2024, 4, 1));
    expect(endDate).toEqual(new Date(2024, 4, 31, 23, 59, 59, 999));
  });

  it('should handle undefined year parameter', () => {
    const { startDate, endDate } = getStartAndEndOfMonth(2);

    expect(startDate).toEqual(new Date(2025, 2, 1));
    expect(endDate).toEqual(new Date(2025, 2, 31, 23, 59, 59, 999));
  });

  it('should use current month when month is less than MIN_MONTH', () => {
    const { startDate, endDate } = getStartAndEndOfMonth(-1, 2024);

    expect(startDate).toEqual(new Date(2024, 4, 1));
    expect(endDate).toEqual(new Date(2024, 4, 31, 23, 59, 59, 999));
  });

  it('should use current month when month is greater than MAX_MONTH', () => {
    const { startDate, endDate } = getStartAndEndOfMonth(12, 2024);

    expect(startDate).toEqual(new Date(2024, 4, 1));
    expect(endDate).toEqual(new Date(2024, 4, 31, 23, 59, 59, 999));
  });

  it('should use current year when year is less than MIN_YEAR', () => {
    const { startDate, endDate } = getStartAndEndOfMonth(2, 1899);

    expect(startDate).toEqual(new Date(2025, 2, 1));
    expect(endDate).toEqual(new Date(2025, 2, 31, 23, 59, 59, 999));
  });

  it('should use current year when year is greater than MAX_YEAR', () => {
    const { startDate, endDate } = getStartAndEndOfMonth(2, 2101);

    expect(startDate).toEqual(new Date(2025, 2, 1));
    expect(endDate).toEqual(new Date(2025, 2, 31, 23, 59, 59, 999));
  });

  it('should handle January correctly', () => {
    const { startDate, endDate } = getStartAndEndOfMonth(0, 2024);

    expect(startDate).toEqual(new Date(2024, 0, 1));
    expect(endDate).toEqual(new Date(2024, 0, 31, 23, 59, 59, 999));
  });

  it('should handle December correctly', () => {
    const { startDate, endDate } = getStartAndEndOfMonth(11, 2024);

    expect(startDate).toEqual(new Date(2024, 11, 1));
    expect(endDate).toEqual(new Date(2024, 11, 31, 23, 59, 59, 999));
  });

  it('should use valid month when in range', () => {
    const { startDate, endDate } = getStartAndEndOfMonth(6, 2023);

    expect(startDate).toEqual(new Date(2023, 6, 1));
    expect(endDate).toEqual(new Date(2023, 6, 31, 23, 59, 59, 999));
  });

  it('should use valid year when in range', () => {
    const { startDate, endDate } = getStartAndEndOfMonth(3, 2000);

    expect(startDate).toEqual(new Date(2000, 3, 1));
    expect(endDate).toEqual(new Date(2000, 3, 30, 23, 59, 59, 999));
  });

  it('should handle February in a leap year', () => {
    const { startDate, endDate } = getStartAndEndOfMonth(1, 2024);

    expect(startDate).toEqual(new Date(2024, 1, 1));
    expect(endDate).toEqual(new Date(2024, 1, 29, 23, 59, 59, 999));
  });

  it('should handle February in a non-leap year', () => {
    const { startDate, endDate } = getStartAndEndOfMonth(1, 2023);

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
