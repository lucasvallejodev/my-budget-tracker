import { z } from 'zod';

import { FieldLengths } from '../constants/field-lengths';
import { deletedQuerySchema } from './common';

export const ruleFormSchema = z.object({
  categoryId: z.string().min(1, 'Choose a category'),
  name: z.string().max(FieldLengths.ruleName).optional(),
  pattern: z.string().trim().min(1, 'Pattern is required').max(FieldLengths.rulePattern),
});

export type RuleFormValues = z.infer<typeof ruleFormSchema>;

export const ruleRowSchema = z.object({
  categoryId: z.string(),
  categoryName: z.string().nullable(),
  deletedAt: z.string().nullable(),
  id: z.string(),
  name: z.string(),
  pattern: z.string(),
  priority: z.number().int(),
});

export type RuleRow = z.infer<typeof ruleRowSchema>;

export const rulePatchSchema = ruleFormSchema.partial();

export type RulePatchValues = z.infer<typeof rulePatchSchema>;

export const ruleListQuerySchema = deletedQuerySchema;

export const applyRulesResultSchema = z.object({ updated: z.number().int() });
