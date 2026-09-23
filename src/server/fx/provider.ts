/**
 * Exchange-rate providers. The reports only ever talk to `RateProvider`, so an automatic
 * source (ECB feed, a paid API, a CSV drop) can be plugged in later by implementing this
 * interface and registering it in `services.ts`, without touching any report or UI code.
 */
export type RateQuote = {
  base: string;
  quote: string;
  /** Rate as a decimal: 1 base = rate quote. */
  rate: number;
  /** Date the rate applies to (YYYY-MM-DD); may be earlier than the requested date. */
  date: string;
  source: string;
};

export type RateProvider = {
  readonly name: string;
  /** Most recent rate on or before `date`, or null when the provider has none. */
  getRate(userId: string, base: string, quote: string, date: string): Promise<RateQuote | null>;
};
