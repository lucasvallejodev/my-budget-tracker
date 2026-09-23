import { MILLISECONDS_PER_DAY } from '@/constants/time';
import { parseAmountInput } from '@/lib/money';

import { ServiceError } from '../db';
import { DateFormat, parseDateCell } from './csv';

export type ColumnMapping = {
  amount?: string;
  credit?: string;
  date: string;
  dateFormat?: DateFormat;
  debit?: string;
  externalId?: string;
  invertSign?: boolean;
  memo?: string;
  payee?: string;
};

export type PreviewStatus = 'new' | 'duplicate' | 'matched' | 'invalid';

export type PreviewRow = {
  amountMinor: number | null;
  date: string | null;
  error?: string;
  importId: string;
  index: number;
  matchedTransactionId?: string;
  memo: string;
  payee: string;
  status: PreviewStatus;
  suggestedBy: 'rule' | 'payee' | null;
  suggestedCategoryId: string | null;
};

export type Preview = {
  accountId: string;
  counts: Record<PreviewStatus, number>;
  currency: string;
  rows: PreviewRow[];
};

export type ResolvedColumns = {
  amount: number;
  credit: number;
  date: number;
  debit: number;
  externalId: number;
  memo: number;
  payee: number;
};

export type ParsedRow = {
  amountMinor: number | null;
  date: string | null;
  error?: string;
  externalId: string;
  memo: string;
  payee: string;
};

export type MatchCandidate = {
  amountMinor: number | bigint | string;
  date: string;
  id: string;
};

const MATCH_WINDOW_DAYS = 7;
const MATCH_WINDOW_MS = MATCH_WINDOW_DAYS * MILLISECONDS_PER_DAY;
const FNV_OFFSET_BASIS = 2166136261;
const FNV_PRIME = 16777619;
const HEX_RADIX = 16;
const HASH_HEX_WIDTH = 8;

export const hash = (text: string): string => {
  let hashValue = FNV_OFFSET_BASIS;

  for (let index = 0; index < text.length; index++) {
    hashValue ^= text.charCodeAt(index);
    hashValue = Math.imul(hashValue, FNV_PRIME);
  }

  return (hashValue >>> 0).toString(HEX_RADIX).padStart(HASH_HEX_WIDTH, '0');
};

export const resolveColumns = (mapping: ColumnMapping, headers: string[]): ResolvedColumns => {
  const column = (name?: string): number => (name ? headers.indexOf(name) : -1);

  const cols: ResolvedColumns = {
    amount: column(mapping.amount),
    credit: column(mapping.credit),
    date: column(mapping.date),
    debit: column(mapping.debit),
    externalId: column(mapping.externalId),
    memo: column(mapping.memo),
    payee: column(mapping.payee),
  };

  if (cols.date < 0) throw new ServiceError('Choose the date column');

  if (cols.amount < 0 && cols.debit < 0 && cols.credit < 0) {
    throw new ServiceError('Choose an amount column, or debit and credit columns');
  }

  return cols;
};

const readCell = (cells: string[], index: number): string =>
  index >= 0 ? (cells[index] ?? '').trim() : '';

const readAbsoluteAmount = (text: string, currency: string): number =>
  text ? Math.abs(parseAmountInput(text, currency)) : 0;

export const parseRowAmount = (
  cells: string[],
  cols: ResolvedColumns,
  mapping: ColumnMapping,
  currency: string
): number => {
  if (cols.amount < 0) {
    const debit = readAbsoluteAmount(readCell(cells, cols.debit), currency);
    const credit = readAbsoluteAmount(readCell(cells, cols.credit), currency);

    return credit - debit;
  }

  const amount = parseAmountInput(readCell(cells, cols.amount), currency);

  return mapping.invertSign ? -amount : amount;
};

export const parseRow = (
  cells: string[],
  cols: ResolvedColumns,
  mapping: ColumnMapping,
  currency: string
): ParsedRow => {
  const date = parseDateCell(readCell(cells, cols.date), mapping.dateFormat ?? 'auto');
  let amountMinor: number | null = null;
  let error: string | undefined;

  try {
    amountMinor = parseRowAmount(cells, cols, mapping, currency);
  } catch (caught) {
    error = caught instanceof Error ? caught.message : 'Invalid amount';
  }

  if (!date) error ??= 'Unreadable date';
  if (amountMinor === 0) error ??= 'Zero amount';

  return {
    amountMinor,
    date,
    error,
    externalId: readCell(cells, cols.externalId),
    memo: readCell(cells, cols.memo),
    payee: readCell(cells, cols.payee),
  };
};

export const buildImportId = (row: ParsedRow, occurrences: Map<string, number>): string => {
  if (row.externalId) return row.externalId;
  const key = `${row.date}:${row.amountMinor}:${row.payee.toLowerCase()}`;
  const occurrence = (occurrences.get(key) ?? 0) + 1;

  occurrences.set(key, occurrence);

  return `csv:${row.date}:${row.amountMinor}:${occurrence}:${hash(row.payee)}`;
};

export const findMatch = (
  candidates: MatchCandidate[],
  claimed: Set<string>,
  row: ParsedRow
): MatchCandidate | undefined => {
  if (row.date === null) return undefined;
  const target = Date.parse(row.date);

  return candidates
    .filter(
      candidate => !claimed.has(candidate.id) && Number(candidate.amountMinor) === row.amountMinor
    )
    .map(candidate => ({ ...candidate, distance: Math.abs(Date.parse(candidate.date) - target) }))
    .filter(candidate => candidate.distance <= MATCH_WINDOW_MS)
    .sort((left, right) => left.distance - right.distance)[0];
};

export type ClassifyContext = {
  candidates: MatchCandidate[];
  claimed: Set<string>;
  existingIds: Set<string>;
  matchRule: (texts: string[]) => Promise<{ categoryId: string } | null | undefined>;
  payeeDefaults: Map<string, string | null>;
};

const suggestCategory = async (
  ctx: ClassifyContext,
  row: ParsedRow
): Promise<Pick<PreviewRow, 'suggestedCategoryId' | 'suggestedBy'>> => {
  const rule = await ctx.matchRule([row.payee, row.memo]);

  if (rule) return { suggestedBy: 'rule', suggestedCategoryId: rule.categoryId };
  const payeeDefault = row.payee ? ctx.payeeDefaults.get(row.payee.toLowerCase()) : null;

  if (payeeDefault) return { suggestedBy: 'payee', suggestedCategoryId: payeeDefault };

  return { suggestedBy: null, suggestedCategoryId: null };
};

export const classifyRow = async (
  ctx: ClassifyContext,
  index: number,
  parsed: ParsedRow,
  importId: string
): Promise<PreviewRow> => {
  const row: PreviewRow = {
    amountMinor: parsed.amountMinor,
    date: parsed.date,
    error: parsed.error,
    importId,
    index,
    memo: parsed.memo,
    payee: parsed.payee,
    status: 'new',
    suggestedBy: null,
    suggestedCategoryId: null,
  };

  if (parsed.error) return { ...row, status: 'invalid' };
  if (ctx.existingIds.has(importId)) return { ...row, status: 'duplicate' };
  const match = findMatch(ctx.candidates, ctx.claimed, parsed);
  const suggestion = await suggestCategory(ctx, parsed);

  if (!match) return { ...row, ...suggestion };
  ctx.claimed.add(match.id);

  return {
    ...row,
    ...suggestion,
    matchedTransactionId: match.id,
    status: 'matched',
  };
};
