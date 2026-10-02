import { MONTHS_PER_YEAR } from '@coinkeeper/shared/constants/time';

import type { Occurrence, RecurringSeriesRow } from '../use-finance-data';

export type CurrencyAmount = { amountMinor: number; currency: string };

const PERCENT = 100;

const sumByCurrency = (entries: CurrencyAmount[]): CurrencyAmount[] => {
  const totals = new Map<string, number>();

  for (const entry of entries) {
    totals.set(entry.currency, (totals.get(entry.currency) ?? 0) + entry.amountMinor);
  }

  return [...totals].map(([currency, amountMinor]) => ({ amountMinor, currency }));
};

export const stillToPay = (occurrences: Occurrence[]): CurrencyAmount[] =>
  sumByCurrency(
    occurrences
      .filter(occurrence => occurrence.status !== 'paid' && occurrence.amountMinor < 0)
      .map(occurrence => ({ amountMinor: -occurrence.amountMinor, currency: occurrence.currency }))
  );

export const isSpending = (series: RecurringSeriesRow): boolean =>
  series.amountMinor < 0 && series.status !== 'ended';

export const reviewOrder = (series: RecurringSeriesRow[]): RecurringSeriesRow[] =>
  series
    .filter(isSpending)
    .toSorted((left, right) => left.monthlyEquivalentMinor - right.monthlyEquivalentMinor);

export const monthlyCost = (series: RecurringSeriesRow[]): CurrencyAmount[] =>
  sumByCurrency(
    series
      .filter(item => isSpending(item) && item.status === 'active')
      .map(item => ({ amountMinor: -item.monthlyEquivalentMinor, currency: item.currency }))
  );

export const yearlyCost = (monthly: CurrencyAmount): CurrencyAmount => ({
  amountMinor: monthly.amountMinor * MONTHS_PER_YEAR,
  currency: monthly.currency,
});

export const priceChangePercent = (series: RecurringSeriesRow): null | number => {
  const { lastPaidAmountMinor, previousPaidAmountMinor } = series;

  if (lastPaidAmountMinor === null || previousPaidAmountMinor === null) return null;
  if (lastPaidAmountMinor === previousPaidAmountMinor) return null;

  return Math.round(
    ((Math.abs(lastPaidAmountMinor) - Math.abs(previousPaidAmountMinor)) /
      Math.abs(previousPaidAmountMinor)) *
      PERCENT
  );
};
