import { and, desc, eq, lte } from 'drizzle-orm';
import { exchangeRates } from '@/db/schema';
import { Db, ServiceError } from '../db';
import { convertMinor } from '@/lib/money';
import { RateProvider, RateQuote } from './provider';

/** Rates the user typed in by hand (Settings → Currencies). */
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
    return { base, quote, rate: Number(row.rate), date: row.date, source: row.source };
  }
}

export type Conversion = {
  amountMinor: number;
  currency: string;
  rate: RateQuote | null;
};

export function createFxService(db: Db, providers: RateProvider[] = [new ManualRateProvider(db)]) {
  async function lookup(userId: string, base: string, quote: string, date: string) {
    for (const provider of providers) {
      const direct = await provider.getRate(userId, base, quote, date);
      if (direct) return direct;
      const inverse = await provider.getRate(userId, quote, base, date);
      if (inverse && inverse.rate !== 0)
        return {
          base,
          quote,
          rate: 1 / inverse.rate,
          date: inverse.date,
          source: `${inverse.source} (inverse)`,
        };
    }
    return null;
  }
  return {
    providers,
    async list(userId: string) {
      return (
        await db
          .select()
          .from(exchangeRates)
          .where(eq(exchangeRates.userId, userId))
          .orderBy(desc(exchangeRates.date), exchangeRates.base, exchangeRates.quote)
      ).map(row => ({ ...row, rate: Number(row.rate) }));
    },
    async upsert(
      userId: string,
      data: { base: string; quote: string; date: string; rate: number; source?: string }
    ) {
      const base = data.base.toUpperCase();
      const quote = data.quote.toUpperCase();
      if (base === quote) throw new ServiceError('Choose two different currencies');
      if (!(data.rate > 0)) throw new ServiceError('The rate must be a positive number');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) throw new ServiceError('Date must be YYYY-MM-DD');
      const [row] = await db
        .insert(exchangeRates)
        .values({
          userId,
          base,
          quote,
          date: data.date,
          rate: String(data.rate),
          source: data.source ?? 'manual',
        })
        .onConflictDoUpdate({
          target: [
            exchangeRates.userId,
            exchangeRates.base,
            exchangeRates.quote,
            exchangeRates.date,
          ],
          set: { rate: String(data.rate), source: data.source ?? 'manual' },
        })
        .returning();
      return { ...row, rate: Number(row.rate) };
    },
    async remove(userId: string, key: { base: string; quote: string; date: string }) {
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
    /** Rate for `date` (most recent on or before), trying direct then inverse pairs across providers. */
    getRate: lookup,
    /** Converts an amount; when no rate exists the amount is returned unconverted with `rate: null`. */
    async convert(
      userId: string,
      amountMinor: number,
      from: string,
      to: string,
      date: string
    ): Promise<Conversion> {
      if (from === to) return { amountMinor, currency: to, rate: null };
      const rate = await lookup(userId, from, to, date);
      if (!rate) return { amountMinor, currency: from, rate: null };
      return { amountMinor: convertMinor(amountMinor, from, to, rate.rate), currency: to, rate };
    },
  };
}
