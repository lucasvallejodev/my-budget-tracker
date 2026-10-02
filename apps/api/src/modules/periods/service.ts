import { and, eq, isNull } from 'drizzle-orm';

import { budgetPeriodStarts, userSettings } from '@/db/schema';
import { ISO_MONTH_LENGTH } from '@coinkeeper/shared/constants/time';
import { isoDateOfMonthStart } from '@coinkeeper/shared/lib/date-helpers';
import { isIsoMonth } from '@coinkeeper/shared/lib/patterns';
import {
  addDays,
  type BudgetPeriod,
  type PeriodOverrides,
  periodRange,
  type PeriodSettings,
  ruleStart,
} from '@coinkeeper/shared/lib/periods';
import type { Period } from '@coinkeeper/shared/schema/settings';

import { notFound, ServiceError } from '../db';
import type { Db, DbOrTx } from '../db';

export type PeriodSpan = { end: string; start: string };

export type UserPeriods = {
  overrides: PeriodOverrides;
  settings: PeriodSettings;
};

const shiftKey = (key: string, months: number): string =>
  isoDateOfMonthStart(key, months).slice(0, ISO_MONTH_LENGTH);

export const spanOf = (period: BudgetPeriod): PeriodSpan => ({
  end: addDays(period.to, 1),
  start: period.from,
});

export const userPeriods = async (db: DbOrTx, userId: string): Promise<UserPeriods> => {
  const [settings] = await db
    .select({ rule: userSettings.periodRule, weekendDays: userSettings.weekendDays })
    .from(userSettings)
    .where(eq(userSettings.userId, userId));

  const rows = await db
    .select({ key: budgetPeriodStarts.periodKey, startsOn: budgetPeriodStarts.startsOn })
    .from(budgetPeriodStarts)
    .where(and(eq(budgetPeriodStarts.userId, userId), isNull(budgetPeriodStarts.deletedAt)));

  return {
    overrides: Object.fromEntries(rows.map(row => [row.key, row.startsOn])),
    settings: settings ?? { rule: { kind: 'calendar' }, weekendDays: [] },
  };
};

export const periodOf = ({ overrides, settings }: UserPeriods, key: string): BudgetPeriod => {
  if (!isIsoMonth(key)) throw new ServiceError('Month must be YYYY-MM');

  return periodRange(key, settings, overrides);
};

const toPeriod = (periods: UserPeriods, key: string): Period => ({
  ...periodOf(periods, key),
  moved: !!periods.overrides[key],
  ruleFrom: ruleStart(key, periods.settings),
});

const clearOverride = (db: DbOrTx, userId: string, key: string) =>
  db
    .update(budgetPeriodStarts)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(budgetPeriodStarts.userId, userId),
        eq(budgetPeriodStarts.periodKey, key),
        isNull(budgetPeriodStarts.deletedAt)
      )
    )
    .returning({ id: budgetPeriodStarts.id });

const assertWithinNeighbours = (periods: UserPeriods, key: string, startsOn: string): void => {
  const others = { ...periods, overrides: { ...periods.overrides } };

  delete others.overrides[key];

  const previousStart = periodOf(others, shiftKey(key, -1)).from;
  const nextStart = periodOf(others, shiftKey(key, 1)).from;

  if (startsOn <= previousStart || startsOn >= nextStart) {
    throw new ServiceError('A period must start after the previous one and before the next one');
  }
};

export const createPeriodService = (db: Db) => ({
  async move(userId: string, key: string, startsOn: string): Promise<Period> {
    const periods = await userPeriods(db, userId);

    assertWithinNeighbours(periods, key, startsOn);
    await db.transaction(async tx => {
      await clearOverride(tx, userId, key);
      await tx.insert(budgetPeriodStarts).values({
        periodKey: key,
        startsOn,
        userId,
      });
    });

    return toPeriod(await userPeriods(db, userId), key);
  },
  async range(userId: string, key: string): Promise<Period> {
    return toPeriod(await userPeriods(db, userId), key);
  },
  async reset(userId: string, key: string): Promise<Period> {
    if ((await clearOverride(db, userId, key)).length === 0) notFound('Moved period');

    return toPeriod(await userPeriods(db, userId), key);
  },
});
