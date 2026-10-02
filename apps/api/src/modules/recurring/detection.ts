import { and, eq, gte, isNotNull, isNull, sql } from 'drizzle-orm';

import { payees, transactions } from '@/db/schema';
import { addDays, daysBetween } from '@coinkeeper/shared/lib/periods';
import {
  cadenceFromGap,
  monthlyEquivalent,
  nextOccurrence,
} from '@coinkeeper/shared/lib/recurrence';
import type { RecurringCadence, RecurringKind } from '@coinkeeper/shared/schema/enums';
import type { RecurringSuggestion } from '@coinkeeper/shared/schema/recurring';

import type { DbOrTx } from '../db';
import { MATCH_HISTORY_DAYS } from './rules';

export type HistoryRow = {
  accountId: string;
  amountMinor: number;
  categoryId: null | string;
  currency: string;
  date: string;
  payeeId: string;
  payeeName: string;
};

const MIN_HITS = 3;
const REGULAR_SHARE = 0.75;
const MAX_WEEKLY_SPREAD = 0.2;
const MAX_SPREAD = 0.75;
const GAP_TOLERANCE = 0.35;
const FIXED_AMOUNT_SPREAD = 0.05;
const RECENCY_FACTOR = 1.5;
const RECENCY_SLACK_DAYS = 7;
const HALF = 2;

const median = (values: number[]): number => {
  const sorted = values.toSorted((left, right) => left - right);
  const middle = Math.floor(sorted.length / HALF);

  return sorted.length % HALF
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / HALF);
};

const groupKey = (row: HistoryRow): string =>
  `${row.payeeId}|${row.currency}|${row.amountMinor < 0 ? 'out' : 'in'}`;

const groupRows = (rows: HistoryRow[]): HistoryRow[][] => {
  const groups = new Map<string, HistoryRow[]>();

  for (const row of rows) groups.set(groupKey(row), [...(groups.get(groupKey(row)) ?? []), row]);

  return [...groups.values()];
};

const gapsOf = (dates: string[]): number[] =>
  dates.slice(1).map((date, index) => daysBetween(dates[index], date));

const isRegular = (gaps: number[], typical: number): boolean =>
  gaps.filter(gap => Math.abs(gap - typical) <= typical * GAP_TOLERANCE).length >=
  gaps.length * REGULAR_SHARE;

const spreadOf = (amounts: number[], typicalMinor: number): number => {
  const magnitudes = amounts.map(Math.abs);

  return (Math.max(...magnitudes) - Math.min(...magnitudes)) / Math.abs(typicalMinor);
};

const steadyEnough = (cadence: RecurringCadence, spread: number): boolean =>
  spread <= (cadence === 'weekly' ? MAX_WEEKLY_SPREAD : MAX_SPREAD);

const kindOf = (typicalMinor: number, spread: number): RecurringKind => {
  if (typicalMinor > 0) return 'income';

  return spread <= FIXED_AMOUNT_SPREAD ? 'subscription' : 'bill';
};

const suggestionOf = (group: HistoryRow[], today: string): null | RecurringSuggestion => {
  const rows = group.toSorted((left, right) => left.date.localeCompare(right.date));
  const dates = [...new Set(rows.map(row => row.date))];

  if (dates.length < MIN_HITS) return null;

  const gaps = gapsOf(dates);
  const typicalGap = median(gaps);
  const detected = cadenceFromGap(typicalGap);
  const last = rows.at(-1)!;

  if (!detected || !isRegular(gaps, typicalGap)) return null;
  if (daysBetween(last.date, today) > typicalGap * RECENCY_FACTOR + RECENCY_SLACK_DAYS) return null;

  const amounts = rows.map(row => row.amountMinor);
  const typicalMinor = median(amounts);
  const spread = spreadOf(amounts, typicalMinor);

  if (!steadyEnough(detected.cadence, spread)) return null;

  const kind = kindOf(typicalMinor, spread);
  const rule = { anchorDate: last.date, ...detected };

  return {
    accountId: last.accountId,
    amountMinor: kind === 'subscription' ? last.amountMinor : typicalMinor,
    anchorDate: last.date,
    cadence: detected.cadence,
    categoryId: rows.findLast(row => row.categoryId)?.categoryId ?? null,
    currency: last.currency,
    interval: detected.interval,
    kind,
    lastDate: last.date,
    nextDueOn: nextOccurrence(rule, addDays(last.date, 1) > today ? addDays(last.date, 1) : today),
    occurrences: rows.length,
    payeeId: last.payeeId,
    payeeName: last.payeeName,
  };
};

const monthlyWeight = (suggestion: RecurringSuggestion): number =>
  Math.abs(monthlyEquivalent(suggestion.amountMinor, suggestion.cadence, suggestion.interval));

export const detectSeries = (rows: HistoryRow[], today: string): RecurringSuggestion[] =>
  groupRows(rows)
    .flatMap(group => suggestionOf(group, today) ?? [])
    .toSorted((left, right) => monthlyWeight(right) - monthlyWeight(left));

export const recurringHistory = async (
  db: DbOrTx,
  userId: string,
  today: string
): Promise<HistoryRow[]> => {
  const rows = await db
    .select({
      accountId: transactions.accountId,
      amountMinor: transactions.amountMinor,
      categoryId: transactions.categoryId,
      currency: transactions.currency,
      date: transactions.date,
      payeeId: sql<string>`${transactions.payeeId}`,
      payeeName: payees.name,
    })
    .from(transactions)
    .innerJoin(payees, eq(payees.id, transactions.payeeId))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.kind, 'standard'),
        isNull(transactions.deletedAt),
        isNull(transactions.recurringSeriesId),
        isNotNull(transactions.payeeId),
        gte(transactions.date, addDays(today, -MATCH_HISTORY_DAYS)),
        sql`NOT EXISTS (SELECT 1 FROM recurring_series series WHERE series.user_id = ${userId} AND series.payee_id = ${transactions.payeeId} AND series.deleted_at IS NULL)`
      )
    );

  return rows.map(row => ({ ...row, amountMinor: Number(row.amountMinor) }));
};
