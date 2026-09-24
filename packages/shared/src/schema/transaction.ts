import { z } from 'zod';

import { FieldLengths } from '../constants/field-lengths';
import { Patterns } from '../lib/patterns';
import { deletedQuerySchema, isoDateSchema, isoMonthSchema, pageSizeSchema } from './common';
import {
  CategoryKindValues,
  TransactionDirectionValues,
  TransactionKindValues,
  TransactionStatusValues,
} from './enums';

const dateString = z.string().regex(Patterns.isoDate, 'Choose a date');

const decimalAmountString = z
  .string()
  .trim()
  .min(1, 'Amount is required')
  .max(FieldLengths.amountInput);

export const standardTransactionSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  amount: decimalAmountString,
  categoryId: z.string().optional(),
  date: dateString,
  direction: z.enum(TransactionDirectionValues),
  excluded: z.boolean().optional(),
  memo: z.string().max(FieldLengths.memo).optional(),
  payeeId: z.string().optional(),
  status: z.enum(TransactionStatusValues).optional(),
});

export type StandardTransactionValues = z.infer<typeof standardTransactionSchema>;

export const transferSchema = z.object({
  amountFrom: decimalAmountString,
  amountTo: z.string().trim().max(FieldLengths.amountInput).optional(),
  date: dateString,
  fromAccountId: z.string().min(1, 'Source account is required'),
  memo: z.string().max(FieldLengths.memo).optional(),
  status: z.enum(TransactionStatusValues).optional(),
  toAccountId: z.string().min(1, 'Destination account is required'),
});

export type TransferValues = z.infer<typeof transferSchema>;

export const transactionRowSchema = z.object({
  accountCurrency: z.string(),
  accountId: z.string(),
  accountName: z.string(),
  amountMinor: z.number().int(),
  categoryIcon: z.string().nullable(),
  categoryId: z.string().nullable(),
  categoryName: z.string().nullable(),
  counterpartAccountId: z.string().nullable(),
  counterpartAccountName: z.string().nullable(),
  currency: z.string(),
  date: z.string(),
  deletedAt: z.string().nullable(),
  excluded: z.boolean(),
  groupColor: z.string().nullable(),
  groupId: z.string().nullable(),
  groupKind: z.enum(CategoryKindValues).nullable(),
  groupName: z.string().nullable(),
  id: z.string(),
  importId: z.string().nullable(),
  kind: z.enum(TransactionKindValues),
  memo: z.string(),
  needsReview: z.boolean(),
  originalPayee: z.string().nullable(),
  payeeId: z.string().nullable(),
  payeeName: z.string().nullable(),
  status: z.enum(TransactionStatusValues),
  transferId: z.string().nullable(),
});

export type TransactionRow = z.infer<typeof transactionRowSchema>;

const SEARCH_MAX_LENGTH = 100;
const CURSOR_MAX_LENGTH = 200;

export const transactionPatchSchema = standardTransactionSchema.partial().extend({
  needsReview: z.boolean().optional(),
});

export type TransactionPatchValues = z.infer<typeof transactionPatchSchema>;

export const transactionListQuerySchema = deletedQuerySchema.extend({
  accountId: z.uuid().optional(),
  categoryId: z.uuid().optional(),
  cursor: z.string().max(CURSOR_MAX_LENGTH).optional(),
  from: isoDateSchema.optional(),
  kind: z.enum(TransactionKindValues).optional(),
  limit: pageSizeSchema.optional(),
  month: isoMonthSchema.optional(),
  needsReview: z.stringbool().optional(),
  q: z.string().trim().max(SEARCH_MAX_LENGTH).optional(),
  to: isoDateSchema.optional(),
});

export type TransactionListQuery = z.input<typeof transactionListQuerySchema>;

export const transferParamsSchema = z.object({ transferId: z.uuid() });

export const transferPatchSchema = z.object({
  memo: z.string().max(FieldLengths.memo).optional(),
  status: z.enum(TransactionStatusValues).optional(),
});

export type TransferPatchValues = z.infer<typeof transferPatchSchema>;

export const linkTransferSchema = z.object({
  inTransactionId: z.uuid(),
  outTransactionId: z.uuid(),
});

export type LinkTransferValues = z.infer<typeof linkTransferSchema>;

export const transferResponseSchema = z.object({
  legs: z.array(transactionRowSchema),
  transferId: z.string(),
});

export type Transfer = z.infer<typeof transferResponseSchema>;
