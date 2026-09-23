import { z } from 'zod';

import { FieldLengths } from '@/constants/field-lengths';

const AccountTypeValues = [
  'checking',
  'savings',
  'cash',
  'credit_card',
  'loan',
  'investment',
  'other',
] as const;

export const accountFormSchema = z.object({
  accountNumber: z.string().max(FieldLengths.accountNumber).optional(),
  countsInSpending: z.boolean().optional(),
  currency: z.string().length(FieldLengths.currencyCode, 'Choose a currency'),
  institution: z.string().max(FieldLengths.institution).optional(),
  name: z.string().trim().min(1, 'Name is required').max(FieldLengths.name),
  notes: z.string().max(FieldLengths.notes).optional(),
  openingBalance: z.string().max(FieldLengths.amountInput).optional(),
  type: z.enum(AccountTypeValues),
});
export type AccountFormValues = z.infer<typeof accountFormSchema>;

export const updateAccountSchema = accountFormSchema
  .omit({ openingBalance: true })
  .partial()
  .extend({ id: z.string().min(1) });
export type UpdateAccountValues = z.infer<typeof updateAccountSchema>;
