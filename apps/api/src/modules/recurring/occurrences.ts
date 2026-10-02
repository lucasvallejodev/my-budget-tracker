import { and, eq, gte, inArray, isNotNull, isNull, lte } from 'drizzle-orm';

import { accounts, recurringSeries, transactions } from '@/db/schema';
import { toIsoDate } from '@coinkeeper/shared/lib/date-helpers';
import { addDays } from '@coinkeeper/shared/lib/periods';
import { occurrencesBetween } from '@coinkeeper/shared/lib/recurrence';
import type { Occurrence } from '@coinkeeper/shared/schema/recurring';

import { conflict, notFound, ServiceError } from '../db';
import type { Db, DbOrTx } from '../db';
import {
  isOccurrence,
  occurrenceKey,
  occurrenceStatus,
  OVERDUE_LOOKBACK_DAYS,
  ruleOf,
} from './rules';
import { ownedSeries } from './series';

type ActiveSeries = typeof recurringSeries.$inferSelect;

type Payment = {
  amountMinor: number;
  transactionId: string;
};

const activeSeries = (db: DbOrTx, userId: string): Promise<ActiveSeries[]> =>
  db
    .select()
    .from(recurringSeries)
    .where(
      and(
        eq(recurringSeries.userId, userId),
        isNull(recurringSeries.deletedAt),
        eq(recurringSeries.status, 'active')
      )
    );

const paymentsBetween = async (
  db: DbOrTx,
  userId: string,
  seriesIds: string[],
  { from, to }: { from: string; to: string }
): Promise<Map<string, Payment>> => {
  if (!seriesIds.length) return new Map();

  const rows = await db
    .select({
      amountMinor: transactions.amountMinor,
      dueOn: transactions.recurringDueOn,
      seriesId: transactions.recurringSeriesId,
      transactionId: transactions.id,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        isNull(transactions.deletedAt),
        inArray(transactions.recurringSeriesId, seriesIds),
        gte(transactions.recurringDueOn, from),
        lte(transactions.recurringDueOn, to)
      )
    );

  return new Map(
    rows.map(row => [
      occurrenceKey(row.seriesId ?? '', row.dueOn ?? ''),
      { amountMinor: Number(row.amountMinor), transactionId: row.transactionId },
    ])
  );
};

const occurrencesOf = (
  series: ActiveSeries,
  payments: Map<string, Payment>,
  { from, to, today }: { from: string; to: string; today: string }
): Occurrence[] =>
  occurrencesBetween(ruleOf(series), from, to).map(dueOn => {
    const payment = payments.get(occurrenceKey(series.id, dueOn));

    return {
      accountId: series.accountId,
      amountMinor: Number(series.amountMinor),
      categoryId: series.categoryId,
      currency: series.currency,
      dueOn,
      kind: series.kind,
      name: series.name,
      paidAmountMinor: payment?.amountMinor ?? null,
      payeeId: series.payeeId,
      seriesId: series.id,
      status: occurrenceStatus(dueOn, today, series.matchWindowDays, !!payment),
      transactionId: payment?.transactionId ?? null,
    };
  });

export type OccurrenceWindow = {
  from: string;
  to: string;
  today: string;
};

export const occurrencesInRange = async (
  db: DbOrTx,
  userId: string,
  window: OccurrenceWindow
): Promise<Occurrence[]> => {
  const series = await activeSeries(db, userId);

  const payments = await paymentsBetween(
    db,
    userId,
    series.map(item => item.id),
    window
  );

  return series.flatMap(item => occurrencesOf(item, payments, window));
};

export const unpaidSpendingBetween = async (
  db: DbOrTx,
  userId: string,
  window: OccurrenceWindow
): Promise<Occurrence[]> =>
  (await occurrencesInRange(db, userId, window)).filter(
    occurrence => occurrence.status !== 'paid' && occurrence.amountMinor < 0
  );

export const upcomingOccurrences = async (
  db: Db,
  userId: string,
  { days, today }: { days: number; today: string }
): Promise<Occurrence[]> => {
  const window = {
    from: addDays(today, -OVERDUE_LOOKBACK_DAYS),
    to: addDays(today, days),
    today,
  };

  return (await occurrencesInRange(db, userId, window))
    .filter(occurrence => occurrence.status !== 'paid' || occurrence.dueOn >= addDays(today, -days))
    .toSorted(
      (left, right) => left.dueOn.localeCompare(right.dueOn) || left.name.localeCompare(right.name)
    );
};

const usableAccount = async (db: DbOrTx, userId: string, series: ActiveSeries) => {
  const [account] = await db
    .select({ currency: accounts.currency })
    .from(accounts)
    .where(
      and(
        eq(accounts.id, series.accountId),
        eq(accounts.userId, userId),
        isNull(accounts.deletedAt),
        isNull(accounts.archivedAt)
      )
    );

  return account?.currency === series.currency;
};

const createdOn = (series: ActiveSeries): string => toIsoDate(series.createdAt);

const dueRows = async (db: DbOrTx, userId: string, series: ActiveSeries, today: string) => {
  const lookback = addDays(today, -OVERDUE_LOOKBACK_DAYS);
  const firstRecordable = addDays(createdOn(series), -series.matchWindowDays);
  const from = firstRecordable > lookback ? firstRecordable : lookback;

  if (!(await usableAccount(db, userId, series))) return [];

  return occurrencesBetween(ruleOf(series), from, today).map(dueOn => ({
    accountId: series.accountId,
    amountMinor: Number(series.amountMinor),
    categoryId: series.categoryId,
    currency: series.currency,
    date: dueOn,
    kind: 'standard' as const,
    memo: series.name,
    needsReview: true,
    payeeId: series.payeeId,
    recurringDueOn: dueOn,
    recurringSeriesId: series.id,
    status: 'pending' as const,
    userId,
  }));
};

export const recordDueOccurrences = async (
  db: Db,
  userId: string,
  today: string
): Promise<number> =>
  db.transaction(async tx => {
    const pending = (await activeSeries(tx, userId)).filter(
      series => series.recordMode === 'create_pending'
    );

    const rows = [];

    for (const series of pending) rows.push(...(await dueRows(tx, userId, series, today)));

    if (!rows.length) return 0;

    const inserted = await tx
      .insert(transactions)
      .values(rows)
      .onConflictDoNothing()
      .returning({ id: transactions.id });

    return inserted.length;
  });

const linkedTransaction = async (db: DbOrTx, userId: string, seriesId: string, dueOn: string) => {
  const [row] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        isNull(transactions.deletedAt),
        eq(transactions.recurringSeriesId, seriesId),
        eq(transactions.recurringDueOn, dueOn)
      )
    );

  return row;
};

const linkableTransaction = async (db: DbOrTx, userId: string, transactionId: string) => {
  const [row] = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.id, transactionId),
        eq(transactions.userId, userId),
        isNull(transactions.deletedAt)
      )
    )
    .for('update');

  if (!row) notFound('Transaction');
  if (row.kind !== 'standard') throw new ServiceError('Only income and expenses can be linked');

  return row;
};

export const assertOpenOccurrence = async (
  db: DbOrTx,
  userId: string,
  { currency, dueOn, seriesId }: { currency: string; dueOn: string; seriesId: string }
): Promise<void> => {
  const series = await ownedSeries(db, userId, seriesId);

  if (!isOccurrence(series, dueOn)) throw new ServiceError('The series is not due on that date');
  if (series.currency !== currency) throw new ServiceError('The currencies do not match');

  if (await linkedTransaction(db, userId, seriesId, dueOn)) {
    conflict('That payment is already recorded');
  }
};

export const linkOccurrence = async (
  db: Db,
  userId: string,
  { dueOn, seriesId, transactionId }: { dueOn: string; seriesId: string; transactionId: string }
): Promise<void> =>
  db.transaction(async tx => {
    const row = await linkableTransaction(tx, userId, transactionId);

    await assertOpenOccurrence(tx, userId, {
      currency: row.currency,
      dueOn,
      seriesId,
    });
    await tx
      .update(transactions)
      .set({ recurringDueOn: dueOn, recurringSeriesId: seriesId })
      .where(eq(transactions.id, transactionId));
  });

export const unlinkOccurrence = async (
  db: Db,
  userId: string,
  { dueOn, seriesId }: { dueOn: string; seriesId: string }
): Promise<void> => {
  await ownedSeries(db, userId, seriesId);

  const row = (await linkedTransaction(db, userId, seriesId, dueOn)) ?? notFound('Payment');

  await db
    .update(transactions)
    .set({ recurringDueOn: null, recurringSeriesId: null })
    .where(and(eq(transactions.id, row.id), isNotNull(transactions.recurringSeriesId)));
};
