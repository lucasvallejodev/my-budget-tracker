import { z } from 'zod';

export const AccountTypeValues = [
  'checking',
  'savings',
  'cash',
  'credit_card',
  'loan',
  'investment',
  'other',
] as const;

export const accountFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50),
  type: z.enum(AccountTypeValues),
  currency: z.string().length(3, 'Choose a currency'),
  institution: z.string().max(50).optional(),
  accountNumber: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
  /** Decimal string in the account currency, e.g. "1250.00". Empty means zero. */
  openingBalance: z.string().max(30).optional(),
  countsInSpending: z.boolean().optional(),
});
export type AccountFormValues = z.infer<typeof accountFormSchema>;

export const updateAccountSchema = accountFormSchema
  .omit({ openingBalance: true })
  .partial()
  .extend({ id: z.string().min(1) });
export type UpdateAccountValues = z.infer<typeof updateAccountSchema>;
