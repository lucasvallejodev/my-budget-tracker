/** Minimal RFC-4180 CSV parser with delimiter sniffing (comma, semicolon, tab, pipe). */
export type ParsedCsv = {
  headers: string[];
  rows: string[][];
  delimiter: string;
};

export const sniffDelimiter = (text: string): string => {
  const firstLine = text.split(/\r?\n/).find(line => line.trim()) ?? '';
  const candidates = [',', ';', '\t', '|'];
  let best = ',';
  let bestCount = -1;

  for (const candidate of candidates) {
    const count = firstLine.split(candidate).length - 1;

    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }

  return best;
};

export const parseCsv = (text: string, delimiter = sniffDelimiter(text)): ParsedCsv => {
  const source = text.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];

    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += char;
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some(cell => cell.trim() !== '')) rows.push(row);
      row = [];
    } else field += char;
  }

  row.push(field);
  if (row.some(cell => cell.trim() !== '')) rows.push(row);
  const [headers = [], ...body] = rows;

  return {
    headers: headers.map(h => h.trim()),
    rows: body,
    delimiter,
  };
};

export type DateFormat = 'auto' | 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';

/** Normalises a date cell to YYYY-MM-DD, or returns null when it cannot be read. */
export const parseDateCell = (value: string, format: DateFormat = 'auto'): string | null => {
  const text = value.trim();
  const iso = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(text);
  const dmy = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/.exec(text);

  const build = (y: string, m: string, d: string) => {
    const month = Number(m);
    const day = Number(d);

    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  if (format === 'YYYY-MM-DD' || (format === 'auto' && iso)) {
    return iso ? build(iso[1], iso[2], iso[3]) : null;
  }

  if (!dmy) return null;
  if (format === 'MM/DD/YYYY') return build(dmy[3], dmy[1], dmy[2]);
  if (format === 'DD/MM/YYYY') return build(dmy[3], dmy[2], dmy[1]);

  // auto: prefer day-first unless the first number cannot be a day
  return Number(dmy[1]) > 12
    ? build(dmy[3], dmy[2], dmy[1])
    : Number(dmy[2]) > 12
      ? build(dmy[3], dmy[1], dmy[2])
      : build(dmy[3], dmy[2], dmy[1]);
};
