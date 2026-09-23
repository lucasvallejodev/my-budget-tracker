import { and, eq, gte, isNull, lte, ne, sql } from 'drizzle-orm';

import { MILLISECONDS_PER_DAY } from '@/constants/time';
import { accounts, transactions } from '@/db/schema';
import { toIsoDate } from '@/lib/date-helpers';
import { Patterns } from '@/lib/patterns';

import { createAccountService } from '../accounts/service';
import { Db, ServiceError } from '../db';
import { createLedgerService } from '../ledger/service';
import { createPayeeService } from '../payees/service';
import { createRuleService } from '../rules/service';
import { parseCsv } from './csv';
import {
  buildImportId,
  ClassifyContext,
  classifyRow,
  ColumnMapping,
  MatchCandidate,
  parseRow,
  Preview,
  PreviewRow,
  PreviewStatus,
  resolveColumns,
} from './preview';

export type { ColumnMapping, Preview } from './preview';

export type TransferSuggestion = {
  amountMinor: number;
  currency: string;
  date: string;
  inAccount: string;
  inId: string;
  outAccount: string;
  outId: string;
};

type ImportContext = {
  db: Db;
  ledger: ReturnType<typeof createLedgerService>;
  ownedAccount: (userId: string, id: string) => Promise<{ currency: string; id: string }>;
  payees: ReturnType<typeof createPayeeService>;
  rules: ReturnType<typeof createRuleService>;
};

const TRANSFER_WINDOW_DAYS = 4;
const TRANSFER_WINDOW_MS = TRANSFER_WINDOW_DAYS * MILLISECONDS_PER_DAY;

const countStatuses = (rows: PreviewRow[]): Record<PreviewStatus, number> => {
  const counts: Record<PreviewStatus, number> = {
    duplicate: 0,
    invalid: 0,
    matched: 0,
    new: 0,
  };

  for (const row of rows) counts[row.status]++;

  return counts;
};

const loadExistingImportIds = async (db: Db, accountId: string): Promise<Set<string>> => {
  const rows = await db
    .select({ importId: transactions.importId })
    .from(transactions)
    .where(and(eq(transactions.accountId, accountId), isNull(transactions.deletedAt)));

  return new Set(rows.map(row => row.importId).filter((id): id is string => !!id));
};

const loadMatchCandidates = (db: Db, accountId: string): Promise<MatchCandidate[]> =>
  db
    .select({
      amountMinor: transactions.amountMinor,
      date: transactions.date,
      id: transactions.id,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.accountId, accountId),
        eq(transactions.kind, 'standard'),
        isNull(transactions.importId),
        isNull(transactions.deletedAt)
      )
    );

type PreviewInput = {
  accountId: string;
  csv: string;
  mapping: ColumnMapping;
};

const preview = async (
  service: ImportContext,
  userId: string,
  input: PreviewInput
): Promise<Preview> => {
  const account = await service.ownedAccount(userId, input.accountId);
  const parsed = parseCsv(input.csv);
  const cols = resolveColumns(input.mapping, parsed.headers);

  const ctx: ClassifyContext = {
    candidates: await loadMatchCandidates(service.db, account.id),
    claimed: new Set(),
    existingIds: await loadExistingImportIds(service.db, account.id),
    matchRule: texts => service.rules.match(userId, texts),
    payeeDefaults: new Map(
      (await service.payees.list(userId)).map(payee => [
        payee.name.toLowerCase(),
        payee.defaultCategoryId,
      ])
    ),
  };

  const occurrences = new Map<string, number>();
  const rows: PreviewRow[] = [];

  for (const [index, cells] of parsed.rows.entries()) {
    const row = parseRow(cells, cols, input.mapping, account.currency);

    rows.push(await classifyRow(ctx, index, row, buildImportId(row, occurrences)));
  }

  return {
    accountId: account.id,
    counts: countStatuses(rows),
    currency: account.currency,
    rows,
  };
};

const applyMatchedRow = async (db: Db, userId: string, row: PreviewRow): Promise<boolean> => {
  if (!row.matchedTransactionId) return false;

  const updated = await db
    .update(transactions)
    .set({ importId: row.importId, originalPayee: row.payee || null })
    .where(
      and(
        eq(transactions.id, row.matchedTransactionId),
        eq(transactions.userId, userId),
        isNull(transactions.importId)
      )
    )
    .returning({ id: transactions.id });

  return updated.length > 0;
};

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof Error && Patterns.uniqueViolationMessage.test(error.message);

const insertNewRow = async (
  service: ImportContext,
  userId: string,
  accountId: string,
  row: PreviewRow & { amountMinor: number; date: string }
): Promise<string | null> => {
  const payee = row.payee ? await service.payees.findOrCreate(userId, row.payee) : null;
  const categoryId = row.suggestedCategoryId ?? payee?.defaultCategoryId ?? null;

  try {
    const created = await service.ledger.createStandard(userId, {
      accountId,
      amountMinor: row.amountMinor,
      categoryId,
      date: row.date,
      importId: row.importId,
      memo: row.memo,
      needsReview: true,
      originalPayee: row.payee || null,
      payeeId: payee?.id ?? null,
      status: 'pending',
    });

    return created.id;
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;

    return null;
  }
};

const isInsertable = (row: PreviewRow): row is PreviewRow & { amountMinor: number; date: string } =>
  row.status === 'new' && row.date !== null && row.amountMinor !== null;

const commit = async (service: ImportContext, userId: string, input: Preview) => {
  const account = await service.ownedAccount(userId, input.accountId);
  let matched = 0;
  const insertedIds: string[] = [];

  for (const row of input.rows) {
    if (row.status === 'matched') {
      if (await applyMatchedRow(service.db, userId, row)) matched++;
    } else if (isInsertable(row)) {
      const id = await insertNewRow(service, userId, account.id, row);

      if (id) insertedIds.push(id);
    }
  }

  return {
    inserted: insertedIds.length,
    insertedIds,
    matched,
  };
};

const shiftDate = (date: string, deltaMs: number): string =>
  toIsoDate(new Date(Date.parse(date) + deltaMs));

type OutgoingRow = {
  accountId: string;
  amountMinor: number;
  currency: string;
  date: string;
  id: string;
};

const findTransferPeer = async (db: Db, userId: string, row: OutgoingRow) => {
  const [peer] = await db
    .select({
      accountId: transactions.accountId,
      accountName: accounts.name,
      id: transactions.id,
    })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.kind, 'standard'),
        isNull(transactions.deletedAt),
        isNull(transactions.categoryId),
        ne(transactions.accountId, row.accountId),
        eq(transactions.currency, row.currency),
        eq(transactions.amountMinor, -row.amountMinor),
        gte(transactions.date, shiftDate(row.date, -TRANSFER_WINDOW_MS)),
        lte(transactions.date, shiftDate(row.date, TRANSFER_WINDOW_MS))
      )
    )
    .orderBy(sql`abs(${transactions.date}::date - ${row.date}::date)`)
    .limit(1);

  return peer;
};

const transferSuggestions = async (
  service: ImportContext,
  userId: string,
  transactionIds?: string[]
): Promise<TransferSuggestion[]> => {
  const rows = await service.ledger.list(userId, {
    ids: transactionIds,
    kind: 'standard',
    limit: 2000,
  });

  const suggestions: TransferSuggestion[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    if (row.amountMinor >= 0 || row.categoryId) continue;
    const peer = await findTransferPeer(service.db, userId, row);

    if (!peer || seen.has(peer.id)) continue;
    seen.add(peer.id);

    suggestions.push({
      amountMinor: -row.amountMinor,
      currency: row.currency,
      date: row.date,
      inAccount: peer.accountName ?? 'Account',
      inId: peer.id,
      outAccount: row.accountName,
      outId: row.id,
    });
  }

  return suggestions;
};

export const createImportService = (db: Db) => {
  const accountsService = createAccountService(db);

  const service: ImportContext = {
    db,
    ledger: createLedgerService(db),
    ownedAccount: async (userId, id) => {
      const account = await accountsService.owned(userId, id);

      if (account.archivedAt) throw new ServiceError('This account is archived');

      return account;
    },
    payees: createPayeeService(db),
    rules: createRuleService(db),
  };

  return {
    commit: (userId: string, input: Preview) => commit(service, userId, input),
    parseCsv,
    preview: (userId: string, input: PreviewInput) => preview(service, userId, input),
    transferSuggestions: (userId: string, transactionIds?: string[]) =>
      transferSuggestions(service, userId, transactionIds),
  };
};
