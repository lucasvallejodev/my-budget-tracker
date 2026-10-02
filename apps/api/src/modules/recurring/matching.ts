import { and, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm';

import { recurringSeries, transactions } from '@/db/schema';
import { addDays } from '@coinkeeper/shared/lib/periods';

import type { Db, DbOrTx } from '../db';
import { isUniqueViolation } from '../errors';
import {
  MATCH_HISTORY_DAYS,
  type MatchableSeries,
  type MatchCandidate,
  occurrenceKey,
  pickMatches,
} from './rules';

type Scope = {
  seriesId?: string;
  today: string;
  transactionIds?: string[];
};

const activeSeries = (db: DbOrTx, userId: string, seriesId?: string) =>
  db
    .select({
      accountId: recurringSeries.accountId,
      amountMaxMinor: recurringSeries.amountMaxMinor,
      amountMinMinor: recurringSeries.amountMinMinor,
      amountMinor: recurringSeries.amountMinor,
      anchorDate: recurringSeries.anchorDate,
      cadence: recurringSeries.cadence,
      currency: recurringSeries.currency,
      endDate: recurringSeries.endDate,
      id: recurringSeries.id,
      interval: recurringSeries.interval,
      matchWindowDays: recurringSeries.matchWindowDays,
      payeeId: recurringSeries.payeeId,
    })
    .from(recurringSeries)
    .where(
      and(
        eq(recurringSeries.userId, userId),
        isNull(recurringSeries.deletedAt),
        eq(recurringSeries.status, 'active'),
        seriesId ? eq(recurringSeries.id, seriesId) : undefined
      )
    );

const candidatesFor = async (
  db: DbOrTx,
  userId: string,
  { seriesId, today, transactionIds }: Scope
): Promise<MatchCandidate[]> => {
  const rows = await db
    .select({
      accountId: transactions.accountId,
      amountMinor: transactions.amountMinor,
      currency: transactions.currency,
      date: transactions.date,
      id: transactions.id,
      payeeId: transactions.payeeId,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.kind, 'standard'),
        isNull(transactions.deletedAt),
        isNull(transactions.recurringSeriesId),
        transactionIds ? inArray(transactions.id, transactionIds) : undefined,
        seriesId ? sql`${transactions.date} >= ${addDays(today, -MATCH_HISTORY_DAYS)}` : undefined
      )
    );

  return rows.map(row => ({ ...row, amountMinor: Number(row.amountMinor) }));
};

const paidOccurrences = async (
  db: DbOrTx,
  userId: string,
  seriesIds: string[]
): Promise<Set<string>> => {
  const rows = await db
    .select({ dueOn: transactions.recurringDueOn, seriesId: transactions.recurringSeriesId })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        isNull(transactions.deletedAt),
        isNotNull(transactions.recurringSeriesId),
        inArray(transactions.recurringSeriesId, seriesIds)
      )
    );

  return new Set(rows.map(row => occurrenceKey(row.seriesId ?? '', row.dueOn ?? '')));
};

const linkMatches = async (
  db: DbOrTx,
  userId: string,
  matches: ReturnType<typeof pickMatches>
): Promise<void> => {
  const values = sql.join(
    matches.map(match => sql`(${match.transactionId}, ${match.seriesId}, ${match.dueOn}::date)`),
    sql`, `
  );

  await db.execute(sql`
    UPDATE transactions AS target
    SET recurring_series_id = matched.series_id, recurring_due_on = matched.due_on, updated_at = now()
    FROM (VALUES ${values}) AS matched(id, series_id, due_on)
    WHERE target.id = matched.id AND target.user_id = ${userId}
      AND target.recurring_series_id IS NULL AND target.deleted_at IS NULL`);
};

export const matchTransactionsToSeries = async (
  db: Db,
  userId: string,
  scope: Scope
): Promise<number> => {
  if (scope.transactionIds && !scope.transactionIds.length) return 0;

  try {
    return await db.transaction(async tx => {
      const series: MatchableSeries[] = (await activeSeries(tx, userId, scope.seriesId)).map(
        item => ({ ...item, amountMinor: Number(item.amountMinor) })
      );

      if (!series.length) return 0;

      const candidates = await candidatesFor(tx, userId, scope);

      if (!candidates.length) return 0;

      const paid = await paidOccurrences(
        tx,
        userId,
        series.map(item => item.id)
      );

      const matches = pickMatches(series, candidates, paid);

      if (matches.length) await linkMatches(tx, userId, matches);

      return matches.length;
    });
  } catch (error) {
    if (isUniqueViolation(error)) return 0;

    throw error;
  }
};
