import { and, eq, isNull } from 'drizzle-orm';

import { accounts, recurringSeries } from '@/db/schema';
import { toIsoDate } from '@coinkeeper/shared/lib/date-helpers';
import { DEFAULT_UPCOMING_DAYS } from '@coinkeeper/shared/schema/recurring';
import type {
  Occurrence,
  RecurringSeriesRow,
  RecurringSuggestion,
} from '@coinkeeper/shared/schema/recurring';

import { ownedActiveCategory } from '../categories/service';
import { notFound, ServiceError } from '../db';
import type { Db } from '../db';
import { assertPayee } from '../ledger/guards';
import { get as getTransaction } from '../ledger/queries';
import type { TransactionRow } from '../ledger/types';
import { detectSeries, recurringHistory } from './detection';
import { matchTransactionsToSeries } from './matching';
import {
  linkOccurrence,
  recordDueOccurrences,
  unlinkOccurrence,
  upcomingOccurrences,
} from './occurrences';
import { assertSeriesShape, listSeries, ownedSeries, type SeriesInput } from './series';

export type { SeriesInput } from './series';

type TodayOption = { today?: string };

const todayOf = (options: TodayOption = {}): string => options.today ?? toIsoDate(new Date());

const seriesAccount = async (db: Db, userId: string, accountId: string) => {
  const [account] = await db
    .select({ archivedAt: accounts.archivedAt, currency: accounts.currency })
    .from(accounts)
    .where(
      and(eq(accounts.id, accountId), eq(accounts.userId, userId), isNull(accounts.deletedAt))
    );

  if (!account) notFound('Account');
  if (account.archivedAt) throw new ServiceError('This account is archived');

  return account;
};

const validated = async (db: Db, userId: string, input: SeriesInput) => {
  assertSeriesShape(input);

  const account = await seriesAccount(db, userId, input.accountId);

  if (input.categoryId) await ownedActiveCategory(db, userId, input.categoryId);
  if (input.payeeId) await assertPayee(db, userId, input.payeeId);

  return {
    accountId: input.accountId,
    amountMinor: input.amountMinor,
    anchorDate: input.anchorDate,
    cadence: input.cadence,
    categoryId: input.categoryId,
    currency: account.currency,
    endDate: input.endDate,
    interval: input.interval,
    kind: input.kind,
    matchWindowDays: input.matchWindowDays,
    name: input.name.trim(),
    payeeId: input.payeeId,
    recordMode: input.recordMode,
    source: input.source,
    status: input.status,
  };
};

export const createRecurringService = (db: Db) => {
  const get = async (userId: string, id: string, options?: TodayOption) => {
    const [row] = await listSeries(db, userId, { id, today: todayOf(options) });

    return row ?? notFound('Recurring series');
  };

  const matchHistory = (userId: string, seriesId: string, options?: TodayOption) =>
    matchTransactionsToSeries(db, userId, { seriesId, today: todayOf(options) });

  return {
    async create(
      userId: string,
      input: SeriesInput,
      options?: TodayOption
    ): Promise<RecurringSeriesRow> {
      const values = await validated(db, userId, input);

      const [created] = await db
        .insert(recurringSeries)
        .values({ ...values, userId })
        .returning({ id: recurringSeries.id });

      await matchHistory(userId, created.id, options);

      return get(userId, created.id, options);
    },
    get,
    async link(
      userId: string,
      seriesId: string,
      dueOn: string,
      transactionId: string
    ): Promise<TransactionRow> {
      await linkOccurrence(db, userId, {
        dueOn,
        seriesId,
        transactionId,
      });

      return getTransaction(db, userId, transactionId);
    },
    list: (userId: string, options: TodayOption & { deleted?: boolean } = {}) =>
      listSeries(db, userId, { deleted: options.deleted, today: todayOf(options) }),
    recordDue: (userId: string, options?: TodayOption): Promise<number> =>
      recordDueOccurrences(db, userId, todayOf(options)),
    async remove(userId: string, id: string): Promise<void> {
      await ownedSeries(db, userId, id);
      await db
        .update(recurringSeries)
        .set({ deletedAt: new Date() })
        .where(eq(recurringSeries.id, id));
    },
    async restore(userId: string, id: string): Promise<RecurringSeriesRow> {
      await ownedSeries(db, userId, id, { deleted: true });
      await db.update(recurringSeries).set({ deletedAt: null }).where(eq(recurringSeries.id, id));

      return get(userId, id);
    },
    async suggestions(userId: string, options?: TodayOption): Promise<RecurringSuggestion[]> {
      const today = todayOf(options);

      return detectSeries(await recurringHistory(db, userId, today), today);
    },
    unlink: (userId: string, seriesId: string, dueOn: string) =>
      unlinkOccurrence(db, userId, { dueOn, seriesId }),
    upcoming: (
      userId: string,
      options: TodayOption & { days?: number } = {}
    ): Promise<Occurrence[]> =>
      upcomingOccurrences(db, userId, {
        days: options.days ?? DEFAULT_UPCOMING_DAYS,
        today: todayOf(options),
      }),
    async update(
      userId: string,
      id: string,
      input: SeriesInput,
      options?: TodayOption
    ): Promise<RecurringSeriesRow> {
      await ownedSeries(db, userId, id);

      const values = await validated(db, userId, input);

      await db.update(recurringSeries).set(values).where(eq(recurringSeries.id, id));
      await matchHistory(userId, id, options);

      return get(userId, id, options);
    },
  };
};
