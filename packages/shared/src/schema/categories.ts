import { z } from 'zod';

import { FieldLengths } from '../constants/field-lengths';
import { hexColorSchema, iconSchema } from './common';
import { CategoryKindValues } from './enums';

export const categoryGroupFormSchema = z.object({
  color: hexColorSchema,
  kind: z.enum(CategoryKindValues),
  name: z.string().trim().min(1, 'Name is required').max(FieldLengths.name),
});

export type CategoryGroupFormValues = z.infer<typeof categoryGroupFormSchema>;

export const categoryFormSchema = z.object({
  groupId: z.string().min(1, 'Choose a group'),
  icon: iconSchema,
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

export const categoryGroupPatchSchema = categoryGroupFormSchema.partial();

export const categoryPatchSchema = categoryFormSchema.partial();

export const archiveCategorySchema = z.object({ moveToId: z.uuid().optional() });

export type ArchiveCategoryValues = z.infer<typeof archiveCategorySchema>;

export const categoryGroupSchema = z.object({
  archivedAt: z.string().nullable(),
  color: z.string(),
  id: z.string(),
  isSystem: z.boolean(),
  kind: z.enum(CategoryKindValues),
  name: z.string(),
  sortOrder: z.number().int(),
});

export type CategoryGroup = z.infer<typeof categoryGroupSchema>;

export const categorySchema = z.object({
  archivedAt: z.string().nullable(),
  groupId: z.string(),
  icon: z.string(),
  id: z.string(),
  name: z.string(),
  sortOrder: z.number().int(),
});

export type Category = z.infer<typeof categorySchema>;
