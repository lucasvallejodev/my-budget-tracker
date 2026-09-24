import { z } from 'zod';

import { FieldLengths } from '@/constants/field-lengths';

export const settingsFormSchema = z.object({
  locale: z.string().min(FieldLengths.localeMin).max(FieldLengths.localeMax).optional(),
  primaryCurrency: z.string().length(FieldLengths.currencyCode).optional(),
  showConvertedTotals: z.boolean().optional(),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export const settingsSchema = z.object({
  locale: z.string(),
  primaryCurrency: z.string(),
  showConvertedTotals: z.boolean(),
});

export type UserSettings = z.infer<typeof settingsSchema>;
