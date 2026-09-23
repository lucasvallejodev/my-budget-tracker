import { z } from 'zod';

import { IconNames } from '@/components/icons/registry';
import { FieldLengths } from '@/constants/field-lengths';
import { Patterns } from '@/lib/patterns';

const hexColor = z.string().regex(Patterns.hexColor, 'Choose a colour');

export const categoryGroupFormSchema = z.object({
  color: hexColor,
  kind: z.enum(['income', 'expense']),
  name: z.string().trim().min(1, 'Name is required').max(FieldLengths.name),
});
export type CategoryGroupFormValues = z.infer<typeof categoryGroupFormSchema>;

export const categoryFormSchema = z.object({
  groupId: z.string().min(1, 'Choose a group'),
  icon: z.enum(IconNames),
  name: z.string().trim().min(1, 'Name is required').max(FieldLengths.name),
});
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
