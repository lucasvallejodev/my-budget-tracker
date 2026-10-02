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

export const OccurrenceStates: Record<
  OccurrenceStatus,
  { hint: string; label: string; tone: BadgeTone }
> = {
  due: {
    hint: 'Due today or in the next few days.',
    label: 'Due soon',
    tone: 'warning',
  },
  overdue: {
    hint: 'The due date has passed and no matching payment was found. Record it, link it, or ignore it if it did not happen.',
    label: 'Overdue',
    tone: 'danger',
  },
  paid: {
    hint: 'Matched to a transaction. Not paid removes a wrong match; the transaction stays.',
    label: 'Paid',
    tone: 'success',
  },
  upcoming: {
    hint: 'Expected later in the next 30 days.',
    label: 'Upcoming',
    tone: 'neutral',
  },
};

export const RecurringKindGroups: { hint: string; kind: RecurringKind; label: string }[] = [
  // keep order
  {
    hint: 'Money that comes in, such as a salary.',
    kind: 'income',
    label: 'Income',
  },
  {
    hint: 'Rent, utilities and other bills.',
    kind: 'bill',
    label: 'Bills',
  },
  {
    hint: 'Services you pay for on a schedule.',
    kind: 'subscription',
    label: 'Subscriptions',
  },
  {
    hint: 'Anything else that repeats.',
    kind: 'other',
    label: 'Other',
  },
];

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
