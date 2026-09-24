import { z } from 'zod';

import { FieldLengths } from '@/constants/field-lengths';
import { IconNames } from '@/constants/icon-names';
import { Patterns } from '@/lib/patterns';

import { CategoryKindValues } from './enums';

const hexColor = z.string().regex(Patterns.hexColor, 'Choose a colour');

export const categoryGroupFormSchema = z.object({
  color: hexColor,
  kind: z.enum(CategoryKindValues),
  name: z.string().trim().min(1, 'Name is required').max(FieldLengths.name),
});

export type CategoryGroupFormValues = z.infer<typeof categoryGroupFormSchema>;

export const categoryFormSchema = z.object({
  groupId: z.string().min(1, 'Choose a group'),
  icon: z.enum(IconNames),
  name: z.string().trim().min(1, 'Name is required').max(FieldLengths.name),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const categoryTreeSchema = z.object({
  archivedAt: z.string().nullable(),
  categories: z.array(
    z.object({
      archivedAt: z.string().nullable(),
      icon: z.string(),
      id: z.string(),
      name: z.string(),
      sortOrder: z.number().int(),
      transactionCount: z.number().int(),
    })
  ),
  color: z.string(),
  id: z.string(),
  isSystem: z.boolean(),
  kind: z.enum(CategoryKindValues),
  name: z.string(),
  sortOrder: z.number().int(),
});

export type CategoryTree = z.infer<typeof categoryTreeSchema>;
