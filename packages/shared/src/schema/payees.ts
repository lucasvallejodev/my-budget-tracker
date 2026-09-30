import { z } from 'zod';

import { FieldLengths } from '../constants/field-lengths';
import { hexColorSchema, iconSchema } from './common';

export const payeeFormSchema = z.object({
  color: hexColorSchema.nullable().optional(),
  defaultCategoryId: z.string().optional(),
  icon: iconSchema.nullable().optional(),
  name: z.string().trim().min(1, 'Name is required').max(FieldLengths.payeeName),
});

export type PayeeFormValues = z.infer<typeof payeeFormSchema>;

export const updatePayeeSchema = payeeFormSchema.partial().extend({ id: z.string().min(1) });

export type UpdatePayeeValues = z.infer<typeof updatePayeeSchema>;

export const payeeSchema = z.object({
  archivedAt: z.string().nullable(),
  color: z.string().nullable(),
  defaultCategoryId: z.string().nullable(),
  icon: z.string().nullable(),
  id: z.string(),
  name: z.string(),
});

export type PayeeRow = z.infer<typeof payeeSchema>;

export const payeePatchSchema = payeeFormSchema.partial();

export type PayeePatchValues = z.infer<typeof payeePatchSchema>;
