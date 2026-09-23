export type RateQuote = {
  base: string;
  date: string;
  quote: string;
  rate: number;
  source: string;
};

export type RateProvider = {
  getRate(userId: string, base: string, quote: string, date: string): Promise<RateQuote | null>;
  readonly name: string;
};
