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

/**
 * Guesses the column delimiter of a CSV file from its first non-empty line.
 *
 * @remarks
 * Counts `,`, `;`, tab and `|` and picks the most frequent one; ties and empty input fall back to `,`.
 *
 * @param text - The raw file content.
 * @returns The delimiter character.
 *
 * @example
 * ```ts
 * sniffDelimiter('Date;Payee;Amount'); // ';'
 * ```
 */
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

/**
 * Tells whether a parsed CSV row holds only whitespace.
 *
 * @param row - The cells of one row.
 * @returns `true` when every cell is empty after trimming.
 *
 * @example
 * ```ts
 * isBlankRow([' ', '']); // true
 * ```
 */
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

/**
 * Parses CSV text into trimmed headers and raw body rows.
 *
 * @remarks
 * Handles quoted fields, escaped quotes (`""`), CRLF, LF and lone CR line breaks, a leading byte
 * order mark and blank lines (skipped). An unterminated quote ends at the end of the text.
 *
 * @param text - The raw file content.
 * @param delimiter - The column delimiter; guessed with {@link sniffDelimiter} when omitted.
 * @returns The delimiter used, the header cells and the body rows.
 *
 * @example
 * ```ts
 * parseCsv('a,b
1,2'); // { delimiter: ',', headers: ['a', 'b'], rows: [['1', '2']] }
 * ```
 */
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

export const DateFormats = ['auto', 'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'] as const;

export type DateFormat = (typeof DateFormats)[number];

/**
 * Builds a `YYYY-MM-DD` date from its parts, rejecting impossible months and days.
 *
 * @param yearText - The four-digit year.
 * @param monthText - The month, 1 to 12, with or without a leading zero.
 * @param dayText - The day, 1 to 31, with or without a leading zero.
 * @returns The ISO date, or `null` when the month or day is out of range.
 *
 * @example
 * ```ts
 * buildIsoDate('2026', '9', '1'); // '2026-09-01'
 * ```
 */
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

/**
 * Reads a date cell from a bank export as a `YYYY-MM-DD` string.
 *
 * @remarks
 * `auto` accepts year-first dates and slash or dot separated day-first or month-first dates; an
 * ambiguous day/month pair is read as day first unless only month first is valid.
 *
 * @param value - The cell text.
 * @param format - The expected layout, or `auto`.
 * @returns The ISO date, or `null` when the cell does not match the layout.
 *
 * @example
 * ```ts
 * parseDateCell('31/12/2026'); // '2026-12-31'
 * ```
 */
export const parseDateCell = (value: string, format: DateFormat = 'auto'): string | null => {
  const text = value.trim();
  const iso = Patterns.dateYearFirst.exec(text);

  if (format === 'YYYY-MM-DD' || (format === 'auto' && iso)) {
    return iso ? buildIsoDate(iso[1], iso[2], iso[3]) : null;
  }

  const dmy = Patterns.dateDayFirst.exec(text);

  return dmy ? parseDayMonthCell(dmy, format) : null;
};
