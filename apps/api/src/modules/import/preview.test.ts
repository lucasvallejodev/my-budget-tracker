import { describe, expect, it } from 'vitest';

import {
  buildImportId,
  ClassifyContext,
  classifyRow,
  ColumnMapping,
  findMatch,
  hash,
  ParsedRow,
  parseRow,
  parseRowAmount,
  resolveColumns,
  ResolvedColumns,
} from './preview';

const Headers = ['Date', 'Payee', 'Amount', 'Debit', 'Credit', 'Memo', 'Ref'];

const AmountMapping: ColumnMapping = {
  amount: 'Amount',
  date: 'Date',
  memo: 'Memo',
  payee: 'Payee',
};

const SplitMapping: ColumnMapping = {
  credit: 'Credit',
  date: 'Date',
  debit: 'Debit',
  externalId: 'Ref',
  payee: 'Payee',
};

const parsedRow = (overrides: Partial<ParsedRow> = {}): ParsedRow => ({
  amountMinor: -1250,
  date: '2026-09-05',
  externalId: '',
  memo: '',
  payee: 'Cafe',
  ...overrides,
});

const context = (overrides: Partial<ClassifyContext> = {}): ClassifyContext => ({
  candidates: [],
  claimed: new Set(),
  existingIds: new Set(),
  matchRule: async () => null,
  payeeDefaults: new Map(),
  ...overrides,
});

describe('resolveColumns', () => {
  it('maps header names to indexes and marks unmapped columns with -1', () => {
    expect(resolveColumns(AmountMapping, Headers)).toEqual<ResolvedColumns>({
      amount: 2,
      credit: -1,
      date: 0,
      debit: -1,
      externalId: -1,
      memo: 5,
      payee: 1,
    });
  });
  it('requires a date column and an amount or debit/credit column', () => {
    expect(() => resolveColumns({ amount: 'Amount', date: 'Missing' }, Headers)).toThrow(
      'Choose the date column'
    );
    expect(() => resolveColumns({ date: 'Date' }, Headers)).toThrow(
      'Choose an amount column, or debit and credit columns'
    );
    expect(() => resolveColumns({ credit: 'Credit', date: 'Date' }, Headers)).not.toThrow();
  });
});

describe('parseRowAmount', () => {
  const amountCols = resolveColumns(AmountMapping, Headers);
  const splitCols = resolveColumns(SplitMapping, Headers);

  it('reads a signed amount column and honours invertSign', () => {
    const cells = ['2026-09-05', 'Cafe', '-12.50', '', '', '', ''];

    expect(parseRowAmount(cells, amountCols, AmountMapping, 'EUR')).toBe(-1250);
    expect(parseRowAmount(cells, amountCols, { ...AmountMapping, invertSign: true }, 'EUR')).toBe(
      1250
    );
  });
  it('combines debit and credit columns as credit minus debit, ignoring their signs', () => {
    expect(parseRowAmount(['', '', '', '12.50', '', '', ''], splitCols, SplitMapping, 'EUR')).toBe(
      -1250
    );
    expect(parseRowAmount(['', '', '', '-12.50', '', '', ''], splitCols, SplitMapping, 'EUR')).toBe(
      -1250
    );
    expect(parseRowAmount(['', '', '', '', '200', '', ''], splitCols, SplitMapping, 'EUR')).toBe(
      20000
    );
    expect(parseRowAmount(['', '', '', '', '', '', ''], splitCols, SplitMapping, 'EUR')).toBe(0);
  });
  it('does not invert debit/credit amounts', () => {
    const mapping = { ...SplitMapping, invertSign: true };

    expect(parseRowAmount(['', '', '', '12.50', '', '', ''], splitCols, mapping, 'EUR')).toBe(
      -1250
    );
  });
});

describe('parseRow', () => {
  const cols = resolveColumns(AmountMapping, Headers);

  it('reads and trims the mapped cells', () => {
    const row = parseRow(
      ['2026-09-05', ' Cafe ', '-12.50', '', '', ' lunch ', ''],
      cols,
      AmountMapping,
      'EUR'
    );

    expect(row).toEqual<ParsedRow>({
      amountMinor: -1250,
      date: '2026-09-05',
      error: undefined,
      externalId: '',
      memo: 'lunch',
      payee: 'Cafe',
    });
  });
  it('reports the first problem: amount, then date, then zero amount', () => {
    expect(parseRow(['2026-09-05', '', 'abc'], cols, AmountMapping, 'EUR').error).toBe(
      'Amount must be a number'
    );
    expect(parseRow(['nope', '', '-1'], cols, AmountMapping, 'EUR').error).toBe('Unreadable date');
    expect(parseRow(['2026-09-05', '', '0'], cols, AmountMapping, 'EUR').error).toBe('Zero amount');
    expect(parseRow(['nope', '', '0'], cols, AmountMapping, 'EUR').error).toBe('Unreadable date');
  });
  it('applies the configured date format', () => {
    const mapping: ColumnMapping = { ...AmountMapping, dateFormat: 'MM/DD/YYYY' };

    expect(parseRow(['09/05/2026', '', '-1'], cols, mapping, 'EUR').date).toBe('2026-09-05');
  });
});

describe('buildImportId', () => {
  it('prefers the file id and otherwise numbers identical rows', () => {
    const occurrences = new Map<string, number>();

    expect(buildImportId(parsedRow({ externalId: 'ref-1' }), occurrences)).toBe('ref-1');
    expect(occurrences.size).toBe(0);
    const first = buildImportId(parsedRow(), occurrences);
    const second = buildImportId(parsedRow({ payee: 'CAFE' }), occurrences);
    const other = buildImportId(parsedRow({ amountMinor: -1 }), occurrences);

    expect(first).toBe(`csv:2026-09-05:-1250:1:${hash('Cafe')}`);
    expect(second).toBe(`csv:2026-09-05:-1250:2:${hash('CAFE')}`);
    expect(other).toBe(`csv:2026-09-05:-1:1:${hash('Cafe')}`);
  });
});

describe('findMatch', () => {
  const candidates = [
    {
      amountMinor: -1250,
      date: '2026-09-20',
      id: 'far',
    },
    {
      amountMinor: '-1250',
      date: '2026-09-07',
      id: 'near',
    },
    {
      amountMinor: -1250,
      date: '2026-09-05',
      id: 'exact',
    },
    {
      amountMinor: -1,
      date: '2026-09-05',
      id: 'other',
    },
  ];

  it('picks the closest unclaimed candidate with the same amount within a week', () => {
    expect(findMatch(candidates, new Set(), parsedRow())?.id).toBe('exact');
    expect(findMatch(candidates, new Set(['exact']), parsedRow())?.id).toBe('near');
    expect(findMatch(candidates, new Set(['exact', 'near']), parsedRow())).toBeUndefined();
    expect(findMatch(candidates, new Set(), parsedRow({ amountMinor: 5 }))).toBeUndefined();
    expect(findMatch(candidates, new Set(), parsedRow({ date: null }))).toBeUndefined();
  });
});

describe('classifyRow', () => {
  it('flags rows with an error as invalid without matching or suggesting', async () => {
    const ctx = context({
      existingIds: new Set(['id']),
      matchRule: async () => ({ categoryId: 'cat' }),
    });

    const row = await classifyRow(ctx, 3, parsedRow({ error: 'Zero amount' }), 'id');

    expect(row).toMatchObject({
      error: 'Zero amount',
      importId: 'id',
      index: 3,
      status: 'invalid',
      suggestedCategoryId: null,
    });
  });
  it('flags already imported ids as duplicates', async () => {
    const row = await classifyRow(context({ existingIds: new Set(['id']) }), 0, parsedRow(), 'id');

    expect(row.status).toBe('duplicate');
  });
  it('matches a manual entry, claims it and suggests from a rule first', async () => {
    const ctx = context({
      candidates: [
        {
          amountMinor: -1250,
          date: '2026-09-05',
          id: 'tx',
        },
      ],
      matchRule: async () => ({ categoryId: 'rule-cat' }),
      payeeDefaults: new Map([['cafe', 'payee-cat']]),
    });

    const row = await classifyRow(ctx, 0, parsedRow(), 'id');

    expect(row).toMatchObject({
      matchedTransactionId: 'tx',
      status: 'matched',
      suggestedBy: 'rule',
      suggestedCategoryId: 'rule-cat',
    });
    expect(ctx.claimed.has('tx')).toBe(true);
    const again = await classifyRow(ctx, 1, parsedRow(), 'id-2');

    expect(again.status).toBe('new');
  });
  it('falls back to the payee default, case-insensitively, and otherwise suggests nothing', async () => {
    const ctx = context({ payeeDefaults: new Map([['cafe', 'payee-cat']]) });

    expect(await classifyRow(ctx, 0, parsedRow({ payee: 'CAFE' }), 'a')).toMatchObject({
      status: 'new',
      suggestedBy: 'payee',
      suggestedCategoryId: 'payee-cat',
    });
    expect(await classifyRow(ctx, 1, parsedRow({ payee: '' }), 'b')).toMatchObject({
      suggestedBy: null,
      suggestedCategoryId: null,
    });
  });
});
