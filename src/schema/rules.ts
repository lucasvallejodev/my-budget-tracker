import { z } from 'zod';

import { FieldLengths } from '@/constants/field-lengths';

export const ruleFormSchema = z.object({
  categoryId: z.string().min(1, 'Choose a category'),
  name: z.string().max(FieldLengths.ruleName).optional(),
  pattern: z.string().trim().min(1, 'Pattern is required').max(FieldLengths.rulePattern),
});

export type RuleFormValues = z.infer<typeof ruleFormSchema>;

export const ruleRowSchema = z.object({
  categoryId: z.string(),
  categoryName: z.string().nullable(),
  id: z.string(),
  name: z.string(),
  pattern: z.string(),
  priority: z.number().int(),
});

export type RuleRow = z.infer<typeof ruleRowSchema>;
