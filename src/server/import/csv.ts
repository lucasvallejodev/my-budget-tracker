import { MAX_DAYS_IN_MONTH, MONTHS_PER_YEAR } from '@/constants/time';
import { Patterns } from '@/lib/patterns';

export type ParsedCsv = {
  delimiter: string;
  headers: string[];
  rows: string[][];
};

const DelimiterCandidates = [',', ';', '\t', '|'];
const ESCAPED_QUOTE_LENGTH = 2;
const CRLF_LENGTH = 2;
const DATE_PART_WIDTH = 2;

export const sniffDelimiter = (text: string): string => {
  const firstLine = text.split(Patterns.lineBreak).find(line => line.trim()) ?? '';
  let best = ',';
  let bestCount = -1;

  for (const candidate of DelimiterCandidates) {
    const count = firstLine.split(candidate).length - 1;

    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }

  return best;
};

type CsvScan = {
  field: string;
  quoted: boolean;
  row: string[];
  rows: string[][];
};

export const isBlankRow = (row: string[]): boolean => row.every(cell => cell.trim() === '');

const endField = (scan: CsvScan): void => {
  scan.row.push(scan.field);
  scan.field = '';
};

const endRow = (scan: CsvScan): void => {
  endField(scan);
  if (!isBlankRow(scan.row)) scan.rows.push(scan.row);
  scan.row = [];
};

const scanQuoted = (scan: CsvScan, source: string, position: number): number => {
  const char = source[position];

  if (char !== '"') {
    scan.field += char;

    return position + 1;
  }

  if (source[position + 1] === '"') {
    scan.field += '"';

    return position + ESCAPED_QUOTE_LENGTH;
  }

  scan.quoted = false;

  return position + 1;
};

const scanPlain = (scan: CsvScan, source: string, position: number, delimiter: string): number => {
  const char = source[position];

  if (char === '"') {
    scan.quoted = true;

    return position + 1;
  }

  if (char === delimiter) {
    endField(scan);

    return position + 1;
  }

  if (char === '\n' || char === '\r') {
    endRow(scan);

    return char === '\r' && source[position + 1] === '\n' ? position + CRLF_LENGTH : position + 1;
  }

  scan.field += char;

  return position + 1;
};

export const parseCsv = (text: string, delimiter = sniffDelimiter(text)): ParsedCsv => {
  const source = text.replace(Patterns.byteOrderMark, '');

  const scan: CsvScan = {
    field: '',
    quoted: false,
    row: [],
    rows: [],
  };

  let position = 0;

  while (position < source.length) {
    position = scan.quoted
      ? scanQuoted(scan, source, position)
      : scanPlain(scan, source, position, delimiter);
  }

  endRow(scan);
  const [headers = [], ...body] = scan.rows;

  return {
    delimiter,
    headers: headers.map(header => header.trim()),
    rows: body,
  };
};

export type DateFormat = 'auto' | 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';

export const buildIsoDate = (
  yearText: string,
  monthText: string,
  dayText: string
): string | null => {
  const month = Number(monthText);
  const day = Number(dayText);

  if (month < 1 || month > MONTHS_PER_YEAR || day < 1 || day > MAX_DAYS_IN_MONTH) return null;

  return `${yearText}-${String(month).padStart(DATE_PART_WIDTH, '0')}-${String(day).padStart(DATE_PART_WIDTH, '0')}`;
};

const parseDayMonthCell = (parts: RegExpExecArray, format: DateFormat): string | null => {
  const [, first, second, year] = parts;

  if (format === 'MM/DD/YYYY') return buildIsoDate(year, first, second);
  if (format === 'DD/MM/YYYY') return buildIsoDate(year, second, first);
  const monthFirst = Number(first) <= MONTHS_PER_YEAR && Number(second) > MONTHS_PER_YEAR;

  return monthFirst ? buildIsoDate(year, first, second) : buildIsoDate(year, second, first);
};

export const parseDateCell = (value: string, format: DateFormat = 'auto'): string | null => {
  const text = value.trim();
  const iso = Patterns.dateYearFirst.exec(text);

  if (format === 'YYYY-MM-DD' || (format === 'auto' && iso)) {
    return iso ? buildIsoDate(iso[1], iso[2], iso[3]) : null;
  }

  const dmy = Patterns.dateDayFirst.exec(text);

  return dmy ? parseDayMonthCell(dmy, format) : null;
};
