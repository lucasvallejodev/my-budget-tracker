import { z } from 'zod';

import { FieldLengths } from '../constants/field-lengths';
import { Patterns } from '../lib/patterns';
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
