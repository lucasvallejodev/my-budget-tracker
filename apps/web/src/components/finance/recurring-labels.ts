import type { BadgeTone } from '@/components/ui';
import { minorToDecimalString } from '@coinkeeper/shared/lib/money';
import type { RecurringCadence, RecurringKind } from '@coinkeeper/shared/schema/enums';
import type { Occurrence, OccurrenceStatus } from '@coinkeeper/shared/schema/recurring';

export const RecurringKindLabels: Record<RecurringKind, string> = {
  bill: 'Bill',
  income: 'Income',
  other: 'Other',
  subscription: 'Subscription',
};

const CadenceNouns: Record<RecurringCadence, { many: string; one: string }> = {
  monthly: { many: 'months', one: 'Monthly' },
  weekly: { many: 'weeks', one: 'Weekly' },
  yearly: { many: 'years', one: 'Yearly' },
};

export const OccurrenceStates: Record<OccurrenceStatus, { label: string; tone: BadgeTone }> = {
  due: { label: 'Due soon', tone: 'warning' },
  overdue: { label: 'Overdue', tone: 'danger' },
  paid: { label: 'Paid', tone: 'success' },
  upcoming: { label: 'Upcoming', tone: 'neutral' },
};

export const OccurrenceStatusOrder: OccurrenceStatus[] = [
  // keep order
  'overdue',
  'due',
  'upcoming',
  'paid',
];

export const cadenceLabel = (cadence: RecurringCadence, interval: number): string =>
  interval === 1 ? CadenceNouns[cadence].one : `Every ${interval} ${CadenceNouns[cadence].many}`;

export const occurrencePreset = (occurrence: Occurrence) => ({
  accountId: occurrence.accountId,
  amount: minorToDecimalString(Math.abs(occurrence.amountMinor), occurrence.currency),
  categoryId: occurrence.categoryId ?? '',
  date: occurrence.dueOn,
  memo: occurrence.name,
  mode: occurrence.amountMinor < 0 ? ('expense' as const) : ('income' as const),
  payeeId: occurrence.payeeId ?? '',
  recurring: { dueOn: occurrence.dueOn, seriesId: occurrence.seriesId },
});
