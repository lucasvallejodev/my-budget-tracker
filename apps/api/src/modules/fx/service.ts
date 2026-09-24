import { and, asc, desc, eq, getTableColumns, gte, isNotNull, isNull, lte, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { exchangeRates } from '@/db/schema';
import { convertMinor } from '@coinkeeper/shared/lib/money';
import { isIsoDate } from '@coinkeeper/shared/lib/patterns';
import type { ExchangeRateKey, ExchangeRateRow } from '@coinkeeper/shared/schema/exchange-rates';

import { Db, notFound, ServiceError, toIsoTimestamp } from '../db';
import { isForeignKeyViolation } from '../errors';
import { RateProvider, RateQuote } from './provider';

type RateFilters = {
  base?: string;
  deleted?: boolean;
  from?: string;
  quote?: string;
  to?: string;
};

type RateRecord = typeof exchangeRates.$inferSelect;

const toRate = (row: RateRecord): ExchangeRateRow => ({
  base: row.base,
  date: row.date,
  deletedAt: toIsoTimestamp(row.deletedAt),
  quote: row.quote,
  rate: Number(row.rate),
  source: row.source,
});

const keyCondition = (userId: string, key: ExchangeRateKey): SQL | undefined =>
  and(
    eq(exchangeRates.userId, userId),
    eq(exchangeRates.base, key.base.toUpperCase()),
    eq(exchangeRates.quote, key.quote.toUpperCase()),
    eq(exchangeRates.date, key.date)
  );

const filterConditions = (userId: string, filters: RateFilters): SQL | undefined =>
  and(
    eq(exchangeRates.userId, userId),
    filters.deleted ? isNotNull(exchangeRates.deletedAt) : isNull(exchangeRates.deletedAt),
    filters.base ? eq(exchangeRates.base, filters.base.toUpperCase()) : undefined,
    filters.quote ? eq(exchangeRates.quote, filters.quote.toUpperCase()) : undefined,
    filters.from ? gte(exchangeRates.date, filters.from) : undefined,
    filters.to ? lte(exchangeRates.date, filters.to) : undefined
  );

export class ManualRateProvider implements RateProvider {
  readonly name = 'manual';
  constructor(private readonly db: Db) {}
  async getRate(userId: string, base: string, quote: string, date: string) {
    const [row] = await this.db
      .select()
      .from(exchangeRates)
      .where(
        and(
          eq(exchangeRates.userId, userId),
          eq(exchangeRates.base, base),
          eq(exchangeRates.quote, quote),
          lte(exchangeRates.date, date),
          isNull(exchangeRates.deletedAt)
        )
      )
      .orderBy(desc(exchangeRates.date))
      .limit(1);

    if (!row) return null;

    return {
      base,
      date: row.date,
      quote,
      rate: Number(row.rate),
      source: row.source,
    };
  }
}

export type Conversion = {
  amountMinor: number;
  currency: string;
  rate: RateQuote | null;
};

export const createFxService = (
  db: Db,
  providers: RateProvider[] = [new ManualRateProvider(db)]
) => {
  const lookup = async (userId: string, base: string, quote: string, date: string) => {
    for (const provider of providers) {
      const direct = await provider.getRate(userId, base, quote, date);

      if (direct) return direct;
      // eslint-disable-next-line sonarjs/arguments-order
      const inverse = await provider.getRate(userId, quote, base, date);

      if (inverse && inverse.rate !== 0) {
        return {
          base,
          date: inverse.date,
          quote,
          rate: 1 / inverse.rate,
          source: `${inverse.source} (inverse)`,
        };
      }
    }

    return null;
  };

  return {
    async convert(
      userId: string,
      {
        amountMinor,
        date,
        from,
        to,
      }: { amountMinor: number; date: string; from: string; to: string }
    ): Promise<Conversion> {
      if (from === to) {
        return {
          amountMinor,
          currency: to,
          rate: null,
        };
      }

      const rate = await lookup(userId, from, to, date);

      if (!rate) {
        return {
          amountMinor,
          currency: from,
          rate: null,
        };
      }

      return {
        amountMinor: convertMinor(amountMinor, from, to, rate.rate),
        currency: to,
        rate,
      };
    },
    getRate: lookup,
    async list(userId: string, filters: RateFilters = {}): Promise<ExchangeRateRow[]> {
      const rows = await db
        .select()
        .from(exchangeRates)
        .where(filterConditions(userId, filters))
        .orderBy(desc(exchangeRates.date), asc(exchangeRates.base), asc(exchangeRates.quote));

      return rows.map(toRate);
    },
    providers,
    async remove(userId: string, key: ExchangeRateKey): Promise<void> {
      const deleted = await db
        .update(exchangeRates)
        .set({ deletedAt: new Date() })
        .where(and(keyCondition(userId, key), isNull(exchangeRates.deletedAt)))
        .returning({ date: exchangeRates.date });

      if (!deleted.length) notFound('Exchange rate');
    },
    async restore(userId: string, key: ExchangeRateKey): Promise<ExchangeRateRow> {
      const [restored] = await db
        .update(exchangeRates)
        .set({ deletedAt: null })
        .where(and(keyCondition(userId, key), isNotNull(exchangeRates.deletedAt)))
        .returning();

      return toRate(restored ?? notFound('Deleted exchange rate'));
    },
    async upsert(
      userId: string,
      data: {
        base: string;
        date: string;
        quote: string;
        rate: number;
        source?: string;
      }
    ): Promise<{ created: boolean; rate: ExchangeRateRow }> {
      const base = data.base.toUpperCase();
      const quote = data.quote.toUpperCase();

      if (base === quote) throw new ServiceError('Choose two different currencies');

      if (!Number.isFinite(data.rate) || data.rate <= 0) {
        throw new ServiceError('The rate must be a positive number');
      }

      if (!isIsoDate(data.date)) throw new ServiceError('Date must be YYYY-MM-DD');

      try {
        const [row] = await db
          .insert(exchangeRates)
          .values({
            base,
            date: data.date,
            quote,
            rate: String(data.rate),
            source: data.source ?? 'manual',
            userId,
          })
          .onConflictDoUpdate({
            set: {
              deletedAt: null,
              rate: String(data.rate),
              source: data.source ?? 'manual',
            },
            target: [
              exchangeRates.userId,
              exchangeRates.base,
              exchangeRates.quote,
              exchangeRates.date,
            ],
          })
          .returning({ ...getTableColumns(exchangeRates), inserted: sql<boolean>`(xmax = 0)` });

        return { created: row.inserted, rate: toRate(row) };
      } catch (error) {
        if (isForeignKeyViolation(error)) throw new ServiceError('Unknown currency code');
        throw error;
      }
    },
  };
};
