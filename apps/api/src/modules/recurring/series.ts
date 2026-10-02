import { and, asc, eq, isNotNull, isNull, sql } from 'drizzle-orm';

import { accounts, categories, payees, recurringSeries } from '@/db/schema';
import { addDays } from '@coinkeeper/shared/lib/periods';
import { monthlyEquivalent, nextOccurrence } from '@coinkeeper/shared/lib/recurrence';
import type {
  RecurringCadence,
  RecurringKind,
  RecurringRecordMode,
  RecurringSource,
  RecurringStatus,
} from '@coinkeeper/shared/schema/enums';
import type { RecurringSeriesRow } from '@coinkeeper/shared/schema/recurring';

import { rowsOf } from '../batch';
import { notFound, ServiceError, toIsoTimestamp } from '../db';
import type { Db, DbOrTx } from '../db';
import { rangeOf, ruleOf } from './rules';

export type SeriesInput = {
  accountId: string;
  amountMinor: number;
  anchorDate: string;
  cadence: RecurringCadence;
  categoryId: null | string;
  endDate: null | string;
  interval: number;
  kind: RecurringKind;
  matchWindowDays?: number;
  name: string;
  payeeId: null | string;
  recordMode: RecurringRecordMode;
  source?: RecurringSource;
  status?: RecurringStatus;
};

type PaymentStats = {
  lastPaidAmountMinor: null | number;
  lastPaidOn: null | string;
  paidCount: number;
  previousPaidAmountMinor: null | number;
};

type PaymentRow = {
  amount_minor: string;
  due_on: string;
  paid_count: string;
  position: string;
  series_id: string;
};

const NoPayments: PaymentStats = {
  lastPaidAmountMinor: null,
  lastPaidOn: null,
  paidCount: 0,
  previousPaidAmountMinor: null,
};

const LATEST_PAYMENTS = 2;

const paymentStats = async (db: DbOrTx, userId: string): Promise<Map<string, PaymentStats>> => {
  const rows = await rowsOf<PaymentRow>(
    db,
    sql`
    SELECT series_id, amount_minor, due_on, position, paid_count FROM (
      SELECT t.recurring_series_id AS series_id, t.amount_minor, t.recurring_due_on::text AS due_on,
        row_number() OVER (PARTITION BY t.recurring_series_id ORDER BY t.recurring_due_on DESC) AS position,
        count(*) OVER (PARTITION BY t.recurring_series_id) AS paid_count
      FROM transactions t
      WHERE t.user_id = ${userId} AND t.deleted_at IS NULL AND t.recurring_series_id IS NOT NULL
    ) ranked
    WHERE position <= ${LATEST_PAYMENTS}`
  );

  const stats = new Map<string, PaymentStats>();

  for (const row of rows) {
    const current = stats.get(row.series_id) ?? {
      ...NoPayments,
      paidCount: Number(row.paid_count),
    };

    if (Number(row.position) === 1) {
      current.lastPaidOn = row.due_on;
      current.lastPaidAmountMinor = Number(row.amount_minor);
    } else {
      current.previousPaidAmountMinor = Number(row.amount_minor);
    }

    stats.set(row.series_id, current);
  }

  return stats;
};

type SeriesRecord = Awaited<ReturnType<typeof selectSeries>>[number];

const selectSeries = (db: DbOrTx, userId: string, deleted: boolean, id?: string) =>
  db
    .select({
      accountId: recurringSeries.accountId,
      accountName: accounts.name,
      amountMaxMinor: recurringSeries.amountMaxMinor,
      amountMinMinor: recurringSeries.amountMinMinor,
      amountMinor: recurringSeries.amountMinor,
      anchorDate: recurringSeries.anchorDate,
      cadence: recurringSeries.cadence,
      categoryId: recurringSeries.categoryId,
      categoryName: categories.name,
      currency: recurringSeries.currency,
      deletedAt: recurringSeries.deletedAt,
      endDate: recurringSeries.endDate,
      id: recurringSeries.id,
      interval: recurringSeries.interval,
      kind: recurringSeries.kind,
      matchWindowDays: recurringSeries.matchWindowDays,
      name: recurringSeries.name,
      payeeId: recurringSeries.payeeId,
      payeeName: payees.name,
      recordMode: recurringSeries.recordMode,
      source: recurringSeries.source,
      status: recurringSeries.status,
    })
    .from(recurringSeries)
    .leftJoin(accounts, eq(accounts.id, recurringSeries.accountId))
    .leftJoin(categories, eq(categories.id, recurringSeries.categoryId))
    .leftJoin(payees, eq(payees.id, recurringSeries.payeeId))
    .where(
      and(
        eq(recurringSeries.userId, userId),
        deleted ? isNotNull(recurringSeries.deletedAt) : isNull(recurringSeries.deletedAt),
        id ? eq(recurringSeries.id, id) : undefined
      )
    )
    .orderBy(asc(recurringSeries.name));

const nextDueOf = (series: SeriesRecord, stats: PaymentStats, today: string): null | string => {
  if (series.status !== 'active') return null;

  const afterLastPaid = stats.lastPaidOn ? addDays(stats.lastPaidOn, 1) : today;

  return nextOccurrence(ruleOf(series), afterLastPaid > today ? afterLastPaid : today);
};

const toSeriesRow = (
  record: SeriesRecord,
  stats: PaymentStats,
  today: string
): RecurringSeriesRow => {
  const series = { ...record, amountMinor: Number(record.amountMinor) };
  const [amountMinMinor, amountMaxMinor] = rangeOf(series);

  return {
    ...series,
    ...stats,
    amountMaxMinor,
    amountMinMinor,
    deletedAt: toIsoTimestamp(series.deletedAt),
    monthlyEquivalentMinor: monthlyEquivalent(series.amountMinor, series.cadence, series.interval),
    nextDueOn: nextDueOf(series, stats, today),
  };
};

export const listSeries = async (
  db: Db,
  userId: string,
  { deleted = false, id, today }: { deleted?: boolean; id?: string; today: string }
): Promise<RecurringSeriesRow[]> => {
  const [records, stats] = await Promise.all([
    selectSeries(db, userId, deleted, id),
    paymentStats(db, userId),
  ]);

  return records.map(record => toSeriesRow(record, stats.get(record.id) ?? NoPayments, today));
};

export const ownedSeries = async (
  db: DbOrTx,
  userId: string,
  id: string,
  { deleted = false } = {}
) => {
  const [series] = await db
    .select()
    .from(recurringSeries)
    .where(
      and(
        eq(recurringSeries.id, id),
        eq(recurringSeries.userId, userId),
        deleted ? isNotNull(recurringSeries.deletedAt) : isNull(recurringSeries.deletedAt)
      )
    )
    .limit(1);

  return series ?? notFound(deleted ? 'Deleted recurring series' : 'Recurring series');
};

export const assertSeriesShape = (input: SeriesInput): void => {
  if (!input.name.trim()) throw new ServiceError('Name is required');

  if (!Number.isInteger(input.amountMinor) || !input.amountMinor) {
    throw new ServiceError('Amount must be a non-zero whole number of minor units');
  }

  if (input.endDate && input.endDate < input.anchorDate) {
    throw new ServiceError('The end date must be on or after the first due date');
  }
};
