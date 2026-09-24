import { z } from 'zod';

import { DateFormats } from '@/lib/csv';

export const PreviewStatusValues = ['new', 'duplicate', 'matched', 'invalid'] as const;

export const SuggestionSourceValues = ['rule', 'payee'] as const;

export const columnMappingSchema = z.object({
  amount: z.string().optional(),
  credit: z.string().optional(),
  date: z.string().min(1, 'Choose the date column'),
  dateFormat: z.enum(DateFormats).optional(),
  debit: z.string().optional(),
  externalId: z.string().optional(),
  invertSign: z.boolean().optional(),
  memo: z.string().optional(),
  payee: z.string().optional(),
});

export type ColumnMapping = z.infer<typeof columnMappingSchema>;

export const previewRowSchema = z.object({
  amountMinor: z.number().int().nullable(),
  date: z.string().nullable(),
  error: z.string().optional(),
  importId: z.string(),
  index: z.number().int(),
  matchedTransactionId: z.string().optional(),
  memo: z.string(),
  payee: z.string(),
  status: z.enum(PreviewStatusValues),
  suggestedBy: z.enum(SuggestionSourceValues).nullable(),
  suggestedCategoryId: z.string().nullable(),
});

export type PreviewRow = z.infer<typeof previewRowSchema>;

export type PreviewStatus = PreviewRow['status'];

export const previewSchema = z.object({
  accountId: z.string(),
  counts: z.record(z.enum(PreviewStatusValues), z.number().int()),
  currency: z.string(),
  rows: z.array(previewRowSchema),
});

export type Preview = z.infer<typeof previewSchema>;

export const transferSuggestionSchema = z.object({
  amountMinor: z.number().int(),
  currency: z.string(),
  date: z.string(),
  inAccount: z.string(),
  inId: z.string(),
  outAccount: z.string(),
  outId: z.string(),
});

export type TransferSuggestion = z.infer<typeof transferSuggestionSchema>;
