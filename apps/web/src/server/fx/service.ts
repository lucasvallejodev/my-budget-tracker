import { and, desc, eq, lte } from 'drizzle-orm';

import { exchangeRates } from '@/db/schema';
import { convertMinor } from '@coinkeeper/shared/lib/money';
import { isIsoDate } from '@coinkeeper/shared/lib/patterns';

import { Db, ServiceError } from '../db';
import { RateProvider, RateQuote } from './provider';

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
          lte(exchangeRates.date, date)
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
    async list(userId: string) {
      return (
        await db
          .select()
          .from(exchangeRates)
          .where(eq(exchangeRates.userId, userId))
          .orderBy(desc(exchangeRates.date), exchangeRates.base, exchangeRates.quote)
      ).map(row => ({ ...row, rate: Number(row.rate) }));
    },
    providers,
    async remove(
      userId: string,
      key: {
        base: string;
        date: string;
        quote: string;
      }
    ) {
      await db
        .delete(exchangeRates)
        .where(
          and(
            eq(exchangeRates.userId, userId),
            eq(exchangeRates.base, key.base.toUpperCase()),
            eq(exchangeRates.quote, key.quote.toUpperCase()),
            eq(exchangeRates.date, key.date)
          )
        );
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
    ) {
      const base = data.base.toUpperCase();
      const quote = data.quote.toUpperCase();

      if (base === quote) throw new ServiceError('Choose two different currencies');

      if (!Number.isFinite(data.rate) || data.rate <= 0) {
        throw new ServiceError('The rate must be a positive number');
      }

      if (!isIsoDate(data.date)) throw new ServiceError('Date must be YYYY-MM-DD');

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
          set: { rate: String(data.rate), source: data.source ?? 'manual' },
          target: [
            exchangeRates.userId,
            exchangeRates.base,
            exchangeRates.quote,
            exchangeRates.date,
          ],
        })
        .returning();

      return { ...row, rate: Number(row.rate) };
    },
  };
};
