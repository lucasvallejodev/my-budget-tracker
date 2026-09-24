import { z } from 'zod';

import { FieldLengths } from '@/constants/field-lengths';
import { Patterns } from '@/lib/patterns';

export const budgetFormSchema = z.object({
  amount: z.string().trim().min(1, 'Amount is required').max(FieldLengths.amountInput),
  categoryId: z.string().min(1, 'Choose a category'),
  currency: z.string().length(FieldLengths.currencyCode),
  month: z.string().regex(Patterns.isoMonth, 'Month must be YYYY-MM'),
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;

export const budgetRowSchema = z.object({
  amountMinor: z.number().int(),
  categoryId: z.string(),
  categoryName: z.string(),
  color: z.string(),
  currency: z.string(),
  groupId: z.string(),
  groupName: z.string(),
  icon: z.string(),
  id: z.string(),
  month: z.string(),
  spentMinor: z.number().int(),
});

export type BudgetRow = z.infer<typeof budgetRowSchema>;
