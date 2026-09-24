import { z } from 'zod';

import { FieldLengths } from '@/constants/field-lengths';

import { AccountClassificationValues, AccountTypeValues } from './enums';

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

export const accountSummarySchema = z.object({
  accountNumber: z.string().nullable(),
  archivedAt: z.string().nullable(),
  balanceMinor: z.number().int(),
  classification: z.enum(AccountClassificationValues),
  color: z.string().nullable(),
  countsInSpending: z.boolean(),
  currency: z.string(),
  icon: z.string().nullable(),
  id: z.string(),
  institution: z.string().nullable(),
  name: z.string(),
  notes: z.string().nullable(),
  transactionCount: z.number().int(),
  type: z.enum(AccountTypeValues),
});

export type AccountSummary = z.infer<typeof accountSummarySchema>;
