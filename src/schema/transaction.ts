import { z } from 'zod';

import { FieldLengths } from '@/constants/field-lengths';
import { Patterns } from '@/lib/patterns';

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
  direction: z.enum(['expense', 'income']),
  excluded: z.boolean().optional(),
  memo: z.string().max(FieldLengths.memo).optional(),
  payeeId: z.string().optional(),
  status: z.enum(['pending', 'cleared', 'reconciled']).optional(),
});
export type StandardTransactionValues = z.infer<typeof standardTransactionSchema>;

export const transferSchema = z.object({
  amountFrom: decimalAmountString,
  amountTo: z.string().trim().max(FieldLengths.amountInput).optional(),
  date: dateString,
  fromAccountId: z.string().min(1, 'Source account is required'),
  memo: z.string().max(FieldLengths.memo).optional(),
  status: z.enum(['pending', 'cleared', 'reconciled']).optional(),
  toAccountId: z.string().min(1, 'Destination account is required'),
});
export type TransferValues = z.infer<typeof transferSchema>;
