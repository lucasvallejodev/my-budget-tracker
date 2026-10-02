import { z } from 'zod';

import { FieldLengths } from '../constants/field-lengths';
import { Patterns } from '../lib/patterns';
import { deletedQuerySchema, isoMonthSchema } from './common';

export const budgetFormSchema = z.object({
  amount: z.string().trim().min(1, 'Amount is required').max(FieldLengths.amountInput),
  categoryId: z.string().min(1, 'Choose a category'),
  currency: z.string().length(FieldLengths.currencyCode),
  month: z.string().regex(Patterns.isoMonth, 'Month must be YYYY-MM'),
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;

export const budgetRowSchema = z.object({
  amountMinor: z.number().int(),
  billsDueMinor: z.number().int(),
  categoryId: z.string(),
  categoryName: z.string(),
  color: z.string(),
  currency: z.string(),
  deletedAt: z.string().nullable(),
  fixedSpentMinor: z.number().int(),
  groupId: z.string(),
  groupName: z.string(),
  icon: z.string(),
  id: z.string(),
  month: z.string(),
  spentMinor: z.number().int(),
});

export type BudgetRow = z.infer<typeof budgetRowSchema>;

export const budgetAmountSchema = budgetFormSchema.pick({ amount: true });

export const budgetKeyParamsSchema = z.object({
  categoryId: z.uuid(),
  currency: z.string().length(FieldLengths.currencyCode),
  month: isoMonthSchema,
});

export const budgetListQuerySchema = deletedQuerySchema.extend({ month: isoMonthSchema });

export const copyBudgetsSchema = z.object({ month: isoMonthSchema });

export const copyBudgetsResultSchema = z.object({ copied: z.number().int() });

export const budgetSuggestionSchema = z.object({
  amountMinor: z.number().int(),
  categoryId: z.string(),
  currency: z.string(),
  months: z.number().int(),
});

export type BudgetSuggestion = z.infer<typeof budgetSuggestionSchema>;

export const budgetSuggestionQuerySchema = z.object({ month: isoMonthSchema });
