import { and, eq, gte, isNull, lte, ne, sql } from 'drizzle-orm';
import { accounts, transactions } from '@/db/schema';
import { Db, ServiceError, notFound } from '../db';
import { parseAmountInput } from '@/lib/money';
import { createLedgerService } from '../ledger/service';
import { createPayeeService } from '../payees/service';
import { createRuleService } from '../rules/service';
import { DateFormat, parseCsv, parseDateCell } from './csv';

export type ColumnMapping = {
  date: string;
  /** Single signed amount column, or leave empty and use debit/credit. */
  amount?: string;
  debit?: string;
  credit?: string;
  payee?: string;
  memo?: string;
  externalId?: string;
  dateFormat?: DateFormat;
  /** Set when the file shows spending as positive numbers. */
  invertSign?: boolean;
};

export type PreviewRow = {
  index: number;
  date: string | null;
  amountMinor: number | null;
  payee: string;
  memo: string;
  importId: string;
  status: 'new' | 'duplicate' | 'matched' | 'invalid';
  error?: string;
  matchedTransactionId?: string;
  suggestedCategoryId: string | null;
  suggestedBy: 'rule' | 'payee' | null;
};

export type Preview = {
  accountId: string;
  currency: string;
  rows: PreviewRow[];
  counts: { new: number; duplicate: number; matched: number; invalid: number };
};

export type TransferSuggestion = {
  outId: string;
  outAccount: string;
  inId: string;
  inAccount: string;
  amountMinor: number;
  currency: string;
  date: string;
};

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function createImportService(db: Db) {
  const ledger = createLedgerService(db);
  const payees = createPayeeService(db);
  const rulesService = createRuleService(db);

  async function ownedAccount(userId: string, id: string) {
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId), isNull(accounts.deletedAt)))
      .limit(1);
    if (!account) notFound('Account');
    if (account.archivedAt) throw new ServiceError('This account is archived');
    return account;
  }

  return {
    parseCsv,

    /** Parses and classifies every row without writing anything. */
    async preview(
      userId: string,
      input: { accountId: string; csv: string; mapping: ColumnMapping }
    ): Promise<Preview> {
      const account = await ownedAccount(userId, input.accountId);
      const parsed = parseCsv(input.csv);
      const column = (name?: string) => (name ? parsed.headers.indexOf(name) : -1);
      const cols = {
        date: column(input.mapping.date),
        amount: column(input.mapping.amount),
        debit: column(input.mapping.debit),
        credit: column(input.mapping.credit),
        payee: column(input.mapping.payee),
        memo: column(input.mapping.memo),
        externalId: column(input.mapping.externalId),
      };
      if (cols.date < 0) throw new ServiceError('Choose the date column');
      if (cols.amount < 0 && cols.debit < 0 && cols.credit < 0)
        throw new ServiceError('Choose an amount column, or debit and credit columns');

      const existingIds = new Set(
        (
          await db
            .select({ importId: transactions.importId })
            .from(transactions)
            .where(and(eq(transactions.accountId, account.id), isNull(transactions.deletedAt)))
        )
          .map(row => row.importId)
          .filter((id): id is string => !!id)
      );
      const candidates = await db
        .select({
          id: transactions.id,
          date: transactions.date,
          amountMinor: transactions.amountMinor,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.accountId, account.id),
            eq(transactions.kind, 'standard'),
            isNull(transactions.importId),
            isNull(transactions.deletedAt)
          )
        );
      const claimed = new Set<string>();
      const occurrences = new Map<string, number>();
      const payeeDefaults = new Map(
        (await payees.list(userId)).map(p => [p.name.toLowerCase(), p.defaultCategoryId])
      );
      const rows: PreviewRow[] = [];
      for (const [index, cells] of parsed.rows.entries()) {
        const cell = (i: number) => (i >= 0 ? (cells[i] ?? '').trim() : '');
        const date = parseDateCell(cell(cols.date), input.mapping.dateFormat ?? 'auto');
        let amountMinor: number | null = null;
        let error: string | undefined;
        try {
          if (cols.amount >= 0) amountMinor = parseAmountInput(cell(cols.amount), account.currency);
          else {
            const debit = cell(cols.debit)
              ? Math.abs(parseAmountInput(cell(cols.debit), account.currency))
              : 0;
            const credit = cell(cols.credit)
              ? Math.abs(parseAmountInput(cell(cols.credit), account.currency))
              : 0;
            amountMinor = credit - debit;
          }
          if (input.mapping.invertSign && cols.amount >= 0) amountMinor = -amountMinor;
        } catch (e) {
          error = e instanceof Error ? e.message : 'Invalid amount';
        }
        if (!date) error = error ?? 'Unreadable date';
        if (amountMinor === 0) error = error ?? 'Zero amount';
        const payee = cell(cols.payee);
        const memo = cell(cols.memo);
        const external = cell(cols.externalId);
        const key = `${date}:${amountMinor}:${payee.toLowerCase()}`;
        const occurrence = (occurrences.get(key) ?? 0) + 1;
        occurrences.set(key, occurrence);
        const importId = external || `csv:${date}:${amountMinor}:${occurrence}:${hash(payee)}`;
        const row: PreviewRow = {
          index,
          date,
          amountMinor,
          payee,
          memo,
          importId,
          status: 'new',
          error,
          suggestedCategoryId: null,
          suggestedBy: null,
        };
        if (error) row.status = 'invalid';
        else if (existingIds.has(importId)) row.status = 'duplicate';
        else {
          const match = candidates
            .filter(c => !claimed.has(c.id) && Number(c.amountMinor) === amountMinor)
            .map(c => ({ ...c, distance: Math.abs(Date.parse(c.date) - Date.parse(date!)) }))
            .filter(c => c.distance <= 7 * 86400000)
            .sort((a, b) => a.distance - b.distance)[0];
          if (match) {
            claimed.add(match.id);
            row.status = 'matched';
            row.matchedTransactionId = match.id;
          }
          const rule = await rulesService.match(userId, [payee, memo]);
          if (rule) {
            row.suggestedCategoryId = rule.categoryId;
            row.suggestedBy = 'rule';
          } else if (payee && payeeDefaults.get(payee.toLowerCase())) {
            row.suggestedCategoryId = payeeDefaults.get(payee.toLowerCase()) ?? null;
            row.suggestedBy = 'payee';
          }
        }
        rows.push(row);
      }
      return {
        accountId: account.id,
        currency: account.currency,
        rows,
        counts: {
          new: rows.filter(r => r.status === 'new').length,
          duplicate: rows.filter(r => r.status === 'duplicate').length,
          matched: rows.filter(r => r.status === 'matched').length,
          invalid: rows.filter(r => r.status === 'invalid').length,
        },
      };
    },

    /**
     * Writes the preview: new rows are inserted as pending imports, matched rows only receive the
     * import id (the user's manual entry is authoritative). Duplicates and invalid rows are skipped.
     */
    async commit(userId: string, preview: Preview) {
      const account = await ownedAccount(userId, preview.accountId);
      let inserted = 0;
      let matched = 0;
      const insertedIds: string[] = [];
      for (const row of preview.rows) {
        if (row.status === 'matched' && row.matchedTransactionId) {
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
          if (updated.length) matched++;
          continue;
        }
        if (row.status !== 'new' || row.date === null || row.amountMinor === null) continue;
        const payee = row.payee ? await payees.findOrCreate(userId, row.payee) : null;
        const categoryId = row.suggestedCategoryId ?? payee?.defaultCategoryId ?? null;
        try {
          const created = await ledger.createStandard(userId, {
            accountId: account.id,
            amountMinor: row.amountMinor,
            date: row.date,
            payeeId: payee?.id ?? null,
            categoryId,
            memo: row.memo,
            status: 'pending',
            needsReview: true,
            importId: row.importId,
            originalPayee: row.payee || null,
          });
          insertedIds.push(created.id);
          inserted++;
        } catch (error) {
          // A concurrent import of the same file: the unique (account, import_id) index wins.
          if (!(error instanceof Error && /unique|duplicate/i.test(error.message))) throw error;
        }
      }
      return { inserted, matched, insertedIds };
    },

    /** Opposite-sign rows in other accounts within four days that look like the other leg. */
    async transferSuggestions(
      userId: string,
      transactionIds?: string[]
    ): Promise<TransferSuggestion[]> {
      const rows = await ledger.list(userId, {
        kind: 'standard',
        limit: 2000,
        ids: transactionIds,
      });
      const suggestions: TransferSuggestion[] = [];
      const seen = new Set<string>();
      for (const row of rows) {
        if (row.amountMinor >= 0 || row.categoryId) continue;
        const from = new Date(Date.parse(row.date) - 4 * 86400000).toISOString().slice(0, 10);
        const to = new Date(Date.parse(row.date) + 4 * 86400000).toISOString().slice(0, 10);
        const [peer] = await db
          .select({
            id: transactions.id,
            accountId: transactions.accountId,
            date: transactions.date,
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
              gte(transactions.date, from),
              lte(transactions.date, to)
            )
          )
          .orderBy(sql`abs(${transactions.date}::date - ${row.date}::date)`)
          .limit(1);
        if (!peer || seen.has(peer.id)) continue;
        seen.add(peer.id);
        const [peerAccount] = await db
          .select({ name: accounts.name })
          .from(accounts)
          .where(eq(accounts.id, peer.accountId));
        suggestions.push({
          outId: row.id,
          outAccount: row.accountName,
          inId: peer.id,
          inAccount: peerAccount?.name ?? 'Account',
          amountMinor: -row.amountMinor,
          currency: row.currency,
          date: row.date,
        });
      }
      return suggestions;
    },
  };
}
