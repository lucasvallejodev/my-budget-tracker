import { localIsoDate } from '@coinkeeper/shared/lib/date-helpers';
import { minorToDecimalString } from '@coinkeeper/shared/lib/money';
import type { RecurringCadence } from '@coinkeeper/shared/schema/enums';
import type {
  RecurringFormValues,
  RecurringSeriesRow,
  RecurringSuggestion,
} from '@coinkeeper/shared/schema/recurring';

import { cadenceLabel } from '../recurring-labels';

export type FrequencyOption = { label: string; value: string };

type Frequency = { cadence: RecurringCadence; interval: number };

const CommonFrequencies: Frequency[] = [
  // keep order
  { cadence: 'weekly', interval: 1 },
  { cadence: 'weekly', interval: 2 },
  { cadence: 'monthly', interval: 1 },
  { cadence: 'monthly', interval: 2 },
  { cadence: 'monthly', interval: 3 },
  { cadence: 'monthly', interval: 6 },
  { cadence: 'yearly', interval: 1 },
];

const FrequencySeparator = ':';

export const frequencyValue = (cadence: RecurringCadence, interval: number): string =>
  `${cadence}${FrequencySeparator}${interval}`;

export const parseFrequency = (value: string): Frequency => {
  const [cadence, interval] = value.split(FrequencySeparator);

  return { cadence: cadence as RecurringCadence, interval: Number(interval) };
};

const sameFrequency = (left: Frequency, right: Frequency): boolean =>
  left.cadence === right.cadence && left.interval === right.interval;

export const frequencyOptions = (current?: Frequency): FrequencyOption[] => {
  const known = current && !CommonFrequencies.some(item => sameFrequency(item, current));
  const frequencies = known ? [...CommonFrequencies, current] : CommonFrequencies;

  return frequencies.map(({ cadence, interval }) => ({
    label: cadenceLabel(cadence, interval),
    value: frequencyValue(cadence, interval),
  }));
};

const NewSeries: RecurringFormValues = {
  accountId: '',
  amount: '',
  anchorDate: '',
  cadence: 'monthly',
  categoryId: '',
  endDate: '',
  interval: 1,
  kind: 'bill',
  name: '',
  payeeId: '',
  recordMode: 'match_only',
};

export const seriesDefaults = (series?: RecurringSeriesRow): RecurringFormValues => {
  if (!series) return { ...NewSeries, anchorDate: localIsoDate(new Date()) };

  return {
    accountId: series.accountId,
    amount: minorToDecimalString(Math.abs(series.amountMinor), series.currency),
    anchorDate: series.anchorDate,
    cadence: series.cadence,
    categoryId: series.categoryId ?? '',
    endDate: series.endDate ?? '',
    interval: series.interval,
    kind: series.kind,
    matchWindowDays: series.matchWindowDays,
    name: series.name,
    payeeId: series.payeeId ?? '',
    recordMode: series.recordMode,
    source: series.source,
    status: series.status,
  };
};

export const suggestionValues = (suggestion: RecurringSuggestion): RecurringFormValues => ({
  accountId: suggestion.accountId,
  amount: minorToDecimalString(Math.abs(suggestion.amountMinor), suggestion.currency),
  anchorDate: suggestion.nextDueOn ?? suggestion.anchorDate,
  cadence: suggestion.cadence,
  categoryId: suggestion.categoryId ?? '',
  endDate: '',
  interval: suggestion.interval,
  kind: suggestion.kind,
  name: suggestion.payeeName,
  payeeId: suggestion.payeeId,
  recordMode: 'match_only',
  source: 'detected',
});
