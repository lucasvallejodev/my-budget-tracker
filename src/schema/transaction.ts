import { z } from 'zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date');

/** Money is entered as a decimal string and parsed server-side with the account currency. */
const amountString = z.string().trim().min(1, 'Amount is required').max(30);

export const standardTransactionSchema = z.object({
  direction: z.enum(['expense', 'income']),
  accountId: z.string().min(1, 'Account is required'),
  amount: amountString,
  date: dateString,
  categoryId: z.string().optional(),
  payeeId: z.string().optional(),
  memo: z.string().max(500).optional(),
  status: z.enum(['pending', 'cleared', 'reconciled']).optional(),
  excluded: z.boolean().optional(),
});
export type StandardTransactionValues = z.infer<typeof standardTransactionSchema>;

export const transferSchema = z.object({
  fromAccountId: z.string().min(1, 'Source account is required'),
  toAccountId: z.string().min(1, 'Destination account is required'),
  amountFrom: amountString,
  amountTo: z.string().trim().max(30).optional(),
  date: dateString,
  memo: z.string().max(500).optional(),
  status: z.enum(['pending', 'cleared', 'reconciled']).optional(),
});
export type TransferValues = z.infer<typeof transferSchema>;

export const transactionFormSchema = z.discriminatedUnion('mode', [
  standardTransactionSchema.extend({ mode: z.literal('standard') }),
  transferSchema.extend({ mode: z.literal('transfer') }),
]);
export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
