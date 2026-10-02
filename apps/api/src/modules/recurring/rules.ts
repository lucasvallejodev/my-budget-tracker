import { addDays, daysBetween } from '@coinkeeper/shared/lib/periods';
import {
  amountRange,
  occurrencesBetween,
  type RecurrenceRule,
} from '@coinkeeper/shared/lib/recurrence';
import type { RecurringCadence } from '@coinkeeper/shared/schema/enums';
import type { OccurrenceStatus } from '@coinkeeper/shared/schema/recurring';

export const DUE_SOON_DAYS = 3;
export const OVERDUE_LOOKBACK_DAYS = 35;
export const MATCH_HISTORY_DAYS = 400;

export type SeriesRule = {
  amountMaxMinor: null | number;
  amountMinMinor: null | number;
  amountMinor: number;
  anchorDate: string;
  cadence: RecurringCadence;
  endDate: null | string;
  interval: number;
  matchWindowDays: number;
};

export type MatchableSeries = SeriesRule & {
  accountId: string;
  currency: string;
  id: string;
  payeeId: null | string;
};

export type MatchCandidate = {
  accountId: string;
  amountMinor: number;
  currency: string;
  date: string;
  id: string;
  payeeId: null | string;
};

export type Match = {
  dueOn: string;
  seriesId: string;
  transactionId: string;
};

type Proposal = Match & { distance: number };

export const occurrenceKey = (seriesId: string, dueOn: string): string => `${seriesId}|${dueOn}`;

export const ruleOf = (series: SeriesRule): RecurrenceRule => ({
  anchorDate: series.anchorDate,
  cadence: series.cadence,
  endDate: series.endDate,
  interval: series.interval,
});

export const rangeOf = (series: SeriesRule): [number, number] => {
  const [low, high] = amountRange(series.amountMinor);

  return [series.amountMinMinor ?? low, series.amountMaxMinor ?? high];
};

export const isOccurrence = (series: SeriesRule, date: string): boolean =>
  occurrencesBetween(ruleOf(series), date, date).length === 1;

export const occurrenceStatus = (
  dueOn: string,
  today: string,
  matchWindowDays: number,
  paid: boolean
): OccurrenceStatus => {
  if (paid) return 'paid';
  if (addDays(dueOn, matchWindowDays) < today) return 'overdue';
  if (dueOn <= addDays(today, DUE_SOON_DAYS)) return 'due';

  return 'upcoming';
};

const fits = (series: MatchableSeries, candidate: MatchCandidate): boolean => {
  if (series.currency !== candidate.currency) return false;

  const sameSource = series.payeeId
    ? series.payeeId === candidate.payeeId
    : series.accountId === candidate.accountId;

  const [low, high] = rangeOf(series);

  return sameSource && candidate.amountMinor >= low && candidate.amountMinor <= high;
};

const proposalFor = (
  series: MatchableSeries,
  candidate: MatchCandidate,
  paid: Set<string>
): null | Proposal => {
  const window = series.matchWindowDays;

  const open = occurrencesBetween(
    ruleOf(series),
    addDays(candidate.date, -window),
    addDays(candidate.date, window)
  ).filter(dueOn => !paid.has(occurrenceKey(series.id, dueOn)));

  const nearest = open.toSorted(
    (left, right) =>
      Math.abs(daysBetween(left, candidate.date)) - Math.abs(daysBetween(right, candidate.date))
  )[0];

  if (!nearest) return null;

  return {
    distance: Math.abs(daysBetween(nearest, candidate.date)),
    dueOn: nearest,
    seriesId: series.id,
    transactionId: candidate.id,
  };
};

export const pickMatches = (
  series: MatchableSeries[],
  candidates: MatchCandidate[],
  alreadyPaid: Set<string>
): Match[] => {
  const paid = new Set(alreadyPaid);
  const matches: Match[] = [];

  for (const candidate of candidates.toSorted((left, right) =>
    left.date.localeCompare(right.date)
  )) {
    const best = series
      .filter(item => fits(item, candidate))
      .flatMap(item => proposalFor(item, candidate, paid) ?? [])
      .toSorted((left, right) => left.distance - right.distance)[0];

    if (best) {
      paid.add(occurrenceKey(best.seriesId, best.dueOn));
      matches.push({
        dueOn: best.dueOn,
        seriesId: best.seriesId,
        transactionId: best.transactionId,
      });
    }
  }

  return matches;
};
