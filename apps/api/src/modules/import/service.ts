import { and, eq, inArray, isNull, sql } from 'drizzle-orm';

import { categories, transactions } from '@/db/schema';
import { MAX_PAGE_SIZE } from '@coinkeeper/shared/constants/pagination';
import { chunk } from '@coinkeeper/shared/lib/arrays';
import { parseCsv } from '@coinkeeper/shared/lib/csv';
import { toIsoDate } from '@coinkeeper/shared/lib/date-helpers';
import type { TransferSuggestion } from '@coinkeeper/shared/schema/imports';

import { createAccountService } from '../accounts/service';
import { rowsOf, valueList, WRITE_CHUNK_ROWS } from '../batch';
import { Db, DbOrTx, notFound, ServiceError } from '../db';
import { assertDate, assertNonZeroAmount, ownedAccount } from '../ledger/guards';
import { standardInsertValues } from '../ledger/standard';
import {
  createPayeeService,
  learnDefaultCategory,
  payeeNameKey,
  resolvePayeesByName,
} from '../payees/service';
import { matchTransactionsToSeries } from '../recurring/matching';
import { createRuleService } from '../rules/service';
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
export type { TransferSuggestion };

type ImportContext = {
  db: Db;
  ownedAccount: (userId: string, id: string) => Promise<{ currency: string; id: string }>;
  payees: ReturnType<typeof createPayeeService>;
  rules: ReturnType<typeof createRuleService>;
};

const TRANSFER_WINDOW_DAYS = 4;

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
    matchRule: await service.rules.matcher(userId),
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

type InsertableRow = PreviewRow & { amountMinor: number; date: string };

type MatchedRow = PreviewRow & { matchedTransactionId: string };

type PayeesByName = Awaited<ReturnType<typeof resolvePayeesByName>>;

type LockedAccount = Awaited<ReturnType<typeof ownedAccount>>;

type InsertedRow = {
  categoryId: string | null;
  id: string;
  payeeId: string | null;
};

const isInsertable = (row: PreviewRow): row is InsertableRow =>
  row.status === 'new' && row.date !== null && row.amountMinor !== null;

const isMatched = (row: PreviewRow): row is MatchedRow =>
  row.status === 'matched' && !!row.matchedTransactionId;

const assertInsertable = (rows: InsertableRow[]): void => {
  for (const row of rows) {
    assertDate(row.date);
    assertNonZeroAmount(row.amountMinor);
  }
};

const applyMatchedRows = async (
  tx: DbOrTx,
  userId: string,
  accountId: string,
  rows: MatchedRow[]
): Promise<number> => {
  let matched = 0;

  for (const slice of chunk(rows, WRITE_CHUNK_ROWS)) {
    const values = sql.join(
      slice.map(row => sql`(${row.matchedTransactionId}, ${row.importId}, ${row.payee || null})`),
      sql`, `
    );

    const stamped = await rowsOf<{ id: string }>(
      tx,
      sql`
      UPDATE transactions AS target
      SET import_id = matched.import_id, original_payee = matched.original_payee, updated_at = now()
      FROM (VALUES ${values}) AS matched(id, import_id, original_payee)
      WHERE target.id = matched.id AND target.user_id = ${userId} AND target.account_id = ${accountId}
        AND target.kind = 'standard' AND target.import_id IS NULL AND target.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM transactions AS taken
          WHERE taken.account_id = target.account_id AND taken.import_id = matched.import_id
            AND taken.deleted_at IS NULL)
      RETURNING target.id`
    );

    matched += stamped.length;
  }

  return matched;
};

const payeeOf = (payeesByName: PayeesByName, row: InsertableRow) =>
  row.payee.trim() ? payeesByName.get(payeeNameKey(row.payee)) : undefined;

const referencedCategoryIds = (rows: InsertableRow[], payeesByName: PayeesByName): string[] => [
  ...new Set(
    rows.flatMap(row =>
      [row.suggestedCategoryId, payeeOf(payeesByName, row)?.defaultCategoryId].filter(
        (id): id is string => !!id
      )
    )
  ),
];

const activeCategoryIds = async (
  tx: DbOrTx,
  userId: string,
  ids: string[]
): Promise<Set<string>> => {
  const active = new Set<string>();

  for (const slice of chunk(ids, WRITE_CHUNK_ROWS)) {
    const rows = await tx
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          inArray(categories.id, slice),
          eq(categories.userId, userId),
          isNull(categories.archivedAt)
        )
      );

    for (const row of rows) active.add(row.id);
  }

  return active;
};

const importedCategoryId = (
  row: InsertableRow,
  payeeDefault: string | null | undefined,
  active: Set<string>
): string | null => {
  if (row.suggestedCategoryId) {
    return active.has(row.suggestedCategoryId) ? row.suggestedCategoryId : notFound('Category');
  }

  return payeeDefault && active.has(payeeDefault) ? payeeDefault : null;
};

type RowContext = {
  account: LockedAccount;
  active: Set<string>;
  payeesByName: PayeesByName;
  userId: string;
};

const importedRowValues = (
  { account, active, payeesByName, userId }: RowContext,
  row: InsertableRow
): typeof transactions.$inferInsert => {
  const payee = payeeOf(payeesByName, row);

  return standardInsertValues(userId, account, {
    accountId: account.id,
    amountMinor: row.amountMinor,
    categoryId: importedCategoryId(row, payee?.defaultCategoryId, active),
    date: row.date,
    importId: row.importId,
    memo: row.memo,
    needsReview: true,
    originalPayee: row.payee || null,
    payeeId: payee?.id ?? null,
    status: 'pending',
  });
};

const insertImportedRows = async (
  tx: DbOrTx,
  values: (typeof transactions.$inferInsert)[]
): Promise<InsertedRow[]> => {
  const inserted: InsertedRow[] = [];

  for (const slice of chunk(values, WRITE_CHUNK_ROWS)) {
    const created = await tx
      .insert(transactions)
      .values(slice)
      .onConflictDoNothing({
        target: [transactions.accountId, transactions.importId],
        where: sql`${transactions.importId} IS NOT NULL AND ${transactions.deletedAt} IS NULL`,
      })
      .returning({
        categoryId: transactions.categoryId,
        id: transactions.id,
        payeeId: transactions.payeeId,
      });

    inserted.push(...created);
  }

  return inserted;
};

const learnPayeeDefaults = async (
  tx: DbOrTx,
  userId: string,
  inserted: InsertedRow[]
): Promise<void> => {
  const payeeIds = new Set(
    inserted.flatMap(row => (row.categoryId && row.payeeId ? [row.payeeId] : []))
  );

  for (const payeeId of payeeIds) await learnDefaultCategory(tx, userId, payeeId);
};

const commit = async (service: ImportContext, userId: string, input: Preview) => {
  const insertable = input.rows.filter(isInsertable);

  assertInsertable(insertable);

  const result = await service.db.transaction(async tx => {
    const account = await ownedAccount(tx, userId, input.accountId);
    const matched = await applyMatchedRows(tx, userId, account.id, input.rows.filter(isMatched));

    const payeesByName = await resolvePayeesByName(
      tx,
      userId,
      insertable.map(row => row.payee)
    );

    const context: RowContext = {
      account,
      active: await activeCategoryIds(tx, userId, referencedCategoryIds(insertable, payeesByName)),
      payeesByName,
      userId,
    };

    const inserted = await insertImportedRows(
      tx,
      insertable.map(row => importedRowValues(context, row))
    );

    await learnPayeeDefaults(tx, userId, inserted);

    return {
      inserted: inserted.length,
      insertedIds: inserted.map(row => row.id),
      matched,
    };
  });

  await matchTransactionsToSeries(service.db, userId, {
    today: toIsoDate(new Date()),
    transactionIds: result.insertedIds,
  });

  return result;
};

type SuggestionRow = {
  amount_minor: string;
  currency: string;
  date: string;
  in_account: string;
  in_id: string;
  out_account: string;
  out_id: string;
};

const suggestionCandidates = (
  db: Db,
  userId: string,
  transactionIds?: string[]
): Promise<SuggestionRow[]> =>
  rowsOf<SuggestionRow>(
    db,
    sql`
    SELECT outgoing.id AS out_id, outgoing.amount_minor, outgoing.currency, outgoing.date::text AS date,
      out_account.name AS out_account, peer.id AS in_id, peer.account_name AS in_account
    FROM transactions AS outgoing
    JOIN accounts AS out_account ON out_account.id = outgoing.account_id
    JOIN LATERAL (
      SELECT incoming.id, in_account.name AS account_name
      FROM transactions AS incoming
      JOIN accounts AS in_account ON in_account.id = incoming.account_id
      WHERE incoming.user_id = ${userId} AND incoming.kind = 'standard'
        AND incoming.deleted_at IS NULL AND incoming.category_id IS NULL
        AND incoming.account_id <> outgoing.account_id AND incoming.currency = outgoing.currency
        AND incoming.amount_minor = -outgoing.amount_minor
        AND incoming.date BETWEEN outgoing.date - ${TRANSFER_WINDOW_DAYS}::int
          AND outgoing.date + ${TRANSFER_WINDOW_DAYS}::int
      ORDER BY abs(incoming.date - outgoing.date), incoming.created_at, incoming.id
      LIMIT 1
    ) AS peer ON true
    WHERE outgoing.user_id = ${userId} AND outgoing.kind = 'standard'
      AND outgoing.deleted_at IS NULL AND outgoing.category_id IS NULL AND outgoing.amount_minor < 0
      ${transactionIds ? sql`AND outgoing.id IN (${valueList(transactionIds)})` : sql``}
    ORDER BY outgoing.date DESC, outgoing.created_at DESC, outgoing.id DESC
    LIMIT ${MAX_PAGE_SIZE}`
  );

const transferSuggestions = async (
  service: ImportContext,
  userId: string,
  transactionIds?: string[]
): Promise<TransferSuggestion[]> => {
  if (transactionIds && !transactionIds.length) return [];

  const suggestions: TransferSuggestion[] = [];
  const seen = new Set<string>();

  for (const row of await suggestionCandidates(service.db, userId, transactionIds)) {
    if (seen.has(row.in_id)) continue;
    seen.add(row.in_id);

    suggestions.push({
      amountMinor: -Number(row.amount_minor),
      currency: row.currency,
      date: row.date,
      inAccount: row.in_account,
      inId: row.in_id,
      outAccount: row.out_account,
      outId: row.out_id,
    });
  }

  return suggestions;
};

export const createImportService = (db: Db) => {
  const accountsService = createAccountService(db);

  const service: ImportContext = {
    db,
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
