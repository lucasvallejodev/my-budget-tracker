import { describe, expect, it } from 'vitest';

import { buildIsoDate, isBlankRow, parseCsv, parseDateCell, sniffDelimiter } from './csv';

describe('csv', () => {
  it('sniffs the delimiter and handles quotes, escapes and blank lines', () => {
    const text =
      'Date;Payee;Amount\r\n2026-09-01;"Café ""Central"", Madrid";-12,50\r\n\r\n2026-09-02;Salary;2.000,00\n';

    expect(sniffDelimiter(text)).toBe(';');
    const parsed = parseCsv(text);

    expect(parsed.headers).toEqual(['Date', 'Payee', 'Amount']);
    expect(parsed.rows).toEqual([
      ['2026-09-01', 'Café "Central", Madrid', '-12,50'],
      ['2026-09-02', 'Salary', '2.000,00'],
    ]);
  });
  it('strips a BOM and defaults to commas', () => {
    expect(parseCsv('﻿a,b\n1,2').headers).toEqual(['a', 'b']);
  });
  it('parses common date layouts', () => {
    expect(parseDateCell('2026-09-05')).toBe('2026-09-05');
    expect(parseDateCell('05/09/2026')).toBe('2026-09-05');
    expect(parseDateCell('09/05/2026', 'MM/DD/YYYY')).toBe('2026-09-05');
    expect(parseDateCell('25/09/2026')).toBe('2026-09-25');
    expect(parseDateCell('09/25/2026')).toBe('2026-09-25');
    expect(parseDateCell('5.9.2026')).toBe('2026-09-05');
    expect(parseDateCell('2026-09-05 10:22')).toBe('2026-09-05');
    expect(parseDateCell('not a date')).toBeNull();
    expect(parseDateCell('31/13/2026')).toBeNull();
  });
});

describe('csv scanner helpers', () => {
  it('treats rows made only of whitespace as blank', () => {
    expect(isBlankRow(['', '  ', '\t'])).toBe(true);
    expect(isBlankRow(['', 'x'])).toBe(false);
  });
  it('keeps delimiters and newlines inside quotes and closes an unterminated quote at the end', () => {
    expect(parseCsv('a,b\n"x,y\nz",2').rows).toEqual([['x,y\nz', '2']]);
    expect(parseCsv('a,b\n"open,1').rows).toEqual([['open,1']]);
  });
  it('accepts an explicit delimiter and lone carriage returns', () => {
    expect(parseCsv('a|b\r1|2\r', '|')).toEqual({
      delimiter: '|',
      headers: ['a', 'b'],
      rows: [['1', '2']],
    });
  });
  it('builds ISO dates only from valid months and days', () => {
    expect(buildIsoDate('2026', '9', '5')).toBe('2026-09-05');
    expect(buildIsoDate('2026', '13', '5')).toBeNull();
    expect(buildIsoDate('2026', '0', '5')).toBeNull();
    expect(buildIsoDate('2026', '9', '32')).toBeNull();
  });
  it('returns null for an explicit format that does not match the cell', () => {
    expect(parseDateCell('05/09/2026', 'YYYY-MM-DD')).toBeNull();
    expect(parseDateCell('2026-09-05', 'DD/MM/YYYY')).toBeNull();
  });
});
