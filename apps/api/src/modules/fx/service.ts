import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
} from 'drizzle-orm';
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
  async latestRates(
    userId: string,
    currencies: string[],
    counterpart: string,
    date: string
  ): Promise<RateQuote[]> {
    if (!currencies.length) return [];

    const rows = await this.db
      .selectDistinctOn([exchangeRates.base, exchangeRates.quote])
      .from(exchangeRates)
      .where(
        and(
          eq(exchangeRates.userId, userId),
          lte(exchangeRates.date, date),
          isNull(exchangeRates.deletedAt),
          or(
            and(inArray(exchangeRates.base, currencies), eq(exchangeRates.quote, counterpart)),
            and(eq(exchangeRates.base, counterpart), inArray(exchangeRates.quote, currencies))
          )
        )
      )
      .orderBy(asc(exchangeRates.base), asc(exchangeRates.quote), desc(exchangeRates.date));

    return rows.map(row => ({
      base: row.base,
      date: row.date,
      quote: row.quote,
      rate: Number(row.rate),
      source: row.source,
    }));
  }
}

const inverseOf = (rate: RateQuote): RateQuote | null =>
  rate.rate === 0
    ? null
    : {
        base: rate.quote,
        date: rate.date,
        quote: rate.base,
        rate: 1 / rate.rate,
        source: `${rate.source} (inverse)`,
      };

const pickRate = (quotes: RateQuote[], base: string, quote: string): RateQuote | null => {
  const direct = quotes.find(candidate => candidate.base === base && candidate.quote === quote);
  const inverse = quotes.find(candidate => candidate.base === quote && candidate.quote === base);

  return direct ?? (inverse ? inverseOf(inverse) : null);
};

type RateRequest = {
  bases: string[];
  date: string;
  quote: string;
  userId: string;
};

const resolveRates = async (
  providers: RateProvider[],
  { bases, date, quote, userId }: RateRequest
): Promise<Map<string, RateQuote>> => {
  const resolved = new Map<string, RateQuote>();

  for (const provider of providers) {
    const pending = bases.filter(base => !resolved.has(base));

    if (!pending.length) break;
    const quotes = await provider.latestRates(userId, pending, quote, date);

    for (const base of pending) {
      const rate = pickRate(quotes, base, quote);

      if (rate) resolved.set(base, rate);
    }
  }

  return resolved;
};

export type Conversion = {
  amountMinor: number;
  currency: string;
  rate: RateQuote | null;
};

export const createFxService = (
  db: Db,
  providers: RateProvider[] = [new ManualRateProvider(db)]
) => {
  const getRates = (userId: string, bases: string[], quote: string, date: string) =>
    resolveRates(providers, {
      bases,
      date,
      quote,
      userId,
    });

  const lookup = async (userId: string, base: string, quote: string, date: string) =>
    (await getRates(userId, [base], quote, date)).get(base) ?? null;

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
    getRates,
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
