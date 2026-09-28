export type RateQuote = {
  base: string;
  date: string;
  quote: string;
  rate: number;
  source: string;
};

export type RateProvider = {
  latestRates(
    userId: string,
    currencies: string[],
    counterpart: string,
    date: string
  ): Promise<RateQuote[]>;
  readonly name: string;
};
