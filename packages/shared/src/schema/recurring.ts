import { z } from 'zod';

import { FieldLengths } from '../constants/field-lengths';
import { deletedQuerySchema, isoDateSchema } from './common';
import {
  RecurringCadenceValues,
  RecurringKindValues,
  RecurringRecordModeValues,
  RecurringSourceValues,
  RecurringStatusValues,
} from './enums';

export const MAX_RECURRING_INTERVAL = 52;
export const MAX_MATCH_WINDOW_DAYS = 15;
export const MAX_UPCOMING_DAYS = 92;
export const DEFAULT_UPCOMING_DAYS = 30;

export const OccurrenceStatusValues = ['paid', 'overdue', 'due', 'upcoming'] as const;

export type OccurrenceStatus = (typeof OccurrenceStatusValues)[number];

export const recurringFormSchema = z.object({
  accountId: z.string().min(1, 'Choose an account'),
  amount: z.string().trim().min(1, 'Amount is required').max(FieldLengths.amountInput),
  anchorDate: isoDateSchema,
  cadence: z.enum(RecurringCadenceValues),
  categoryId: z.string().optional(),
  endDate: z.union([isoDateSchema, z.literal('')]).optional(),
  interval: z.number().int().min(1).max(MAX_RECURRING_INTERVAL),
  kind: z.enum(RecurringKindValues),
  matchWindowDays: z.number().int().min(0).max(MAX_MATCH_WINDOW_DAYS).optional(),
  name: z.string().trim().min(1, 'Name is required').max(FieldLengths.name),
  payeeId: z.string().optional(),
  recordMode: z.enum(RecurringRecordModeValues),
  source: z.enum(RecurringSourceValues).optional(),
  status: z.enum(RecurringStatusValues).optional(),
});

export type RecurringFormValues = z.infer<typeof recurringFormSchema>;

export const recurringSeriesRowSchema = z.object({
  accountId: z.string(),
  accountName: z.string().nullable(),
  amountMaxMinor: z.number().int(),
  amountMinMinor: z.number().int(),
  amountMinor: z.number().int(),
  anchorDate: z.string(),
  cadence: z.enum(RecurringCadenceValues),
  categoryId: z.string().nullable(),
  categoryName: z.string().nullable(),
  currency: z.string(),
  deletedAt: z.string().nullable(),
  endDate: z.string().nullable(),
  id: z.string(),
  interval: z.number().int(),
  kind: z.enum(RecurringKindValues),
  lastPaidAmountMinor: z.number().int().nullable(),
  lastPaidOn: z.string().nullable(),
  matchWindowDays: z.number().int(),
  monthlyEquivalentMinor: z.number().int(),
  name: z.string(),
  nextDueOn: z.string().nullable(),
  paidCount: z.number().int(),
  payeeId: z.string().nullable(),
  payeeName: z.string().nullable(),
  previousPaidAmountMinor: z.number().int().nullable(),
  recordMode: z.enum(RecurringRecordModeValues),
  source: z.enum(RecurringSourceValues),
  status: z.enum(RecurringStatusValues),
});

export type RecurringSeriesRow = z.infer<typeof recurringSeriesRowSchema>;

export const recurringListQuerySchema = deletedQuerySchema.extend({
  today: isoDateSchema.optional(),
});

export const occurrenceSchema = z.object({
  accountId: z.string(),
  amountMinor: z.number().int(),
  categoryId: z.string().nullable(),
  currency: z.string(),
  dueOn: z.string(),
  kind: z.enum(RecurringKindValues),
  name: z.string(),
  paidAmountMinor: z.number().int().nullable(),
  payeeId: z.string().nullable(),
  seriesId: z.string(),
  status: z.enum(OccurrenceStatusValues),
  transactionId: z.string().nullable(),
});

export type Occurrence = z.infer<typeof occurrenceSchema>;

export const upcomingQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(MAX_UPCOMING_DAYS).optional(),
  today: isoDateSchema.optional(),
});

export const todaySchema = z.object({ today: isoDateSchema.optional() });

export const recordDueResultSchema = z.object({ created: z.number().int() });

export const occurrenceParamsSchema = z.object({
  dueOn: isoDateSchema,
  id: z.uuid(),
});

export const linkOccurrenceSchema = z.object({ transactionId: z.uuid() });

export const recurringSuggestionSchema = z.object({
  accountId: z.string(),
  amountMinor: z.number().int(),
  anchorDate: z.string(),
  cadence: z.enum(RecurringCadenceValues),
  categoryId: z.string().nullable(),
  currency: z.string(),
  interval: z.number().int(),
  kind: z.enum(RecurringKindValues),
  lastDate: z.string(),
  nextDueOn: z.string().nullable(),
  occurrences: z.number().int(),
  payeeId: z.string(),
  payeeName: z.string(),
});

export type RecurringSuggestion = z.infer<typeof recurringSuggestionSchema>;
