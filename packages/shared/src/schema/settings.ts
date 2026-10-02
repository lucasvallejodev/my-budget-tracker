import { z } from 'zod';

import { FieldLengths } from '../constants/field-lengths';
import { isoDateSchema, isoMonthSchema } from './common';

export const MAX_PERIOD_DAY = 28;
export const MAX_WORKING_DAYS_BEFORE_END = 10;
export const DAYS_PER_WEEK = 7;
const SATURDAY = 6;

export const DefaultWeekendDays = [0, SATURDAY];

export const periodRuleSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('calendar') }),
  z.object({ day: z.number().int().min(1).max(MAX_PERIOD_DAY), kind: z.literal('fixed_day') }),
  z.object({
    kind: z.literal('before_month_end'),
    workingDays: z.number().int().min(0).max(MAX_WORKING_DAYS_BEFORE_END),
  }),
]);

export type PeriodRuleValues = z.infer<typeof periodRuleSchema>;

export const weekendDaysSchema = z
  .array(
    z
      .number()
      .int()
      .min(0)
      .max(DAYS_PER_WEEK - 1)
  )
  .max(DAYS_PER_WEEK - 1);

export const settingsFormSchema = z.object({
  allowEmoji: z.boolean().optional(),
  locale: z.string().min(FieldLengths.localeMin).max(FieldLengths.localeMax).optional(),
  periodRule: periodRuleSchema.optional(),
  primaryCurrency: z.string().length(FieldLengths.currencyCode).optional(),
  showConvertedTotals: z.boolean().optional(),
  weekendDays: weekendDaysSchema.optional(),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export const settingsSchema = z.object({
  allowEmoji: z.boolean(),
  locale: z.string(),
  periodRule: periodRuleSchema,
  primaryCurrency: z.string(),
  showConvertedTotals: z.boolean(),
  weekendDays: z.array(z.number().int()),
});

export type UserSettings = z.infer<typeof settingsSchema>;

export const periodSchema = z.object({
  days: z.number().int(),
  from: z.string(),
  key: z.string(),
  moved: z.boolean(),
  ruleFrom: z.string(),
  to: z.string(),
});

export type Period = z.infer<typeof periodSchema>;

export const movePeriodSchema = z.object({ startsOn: isoDateSchema });

export const periodParamsSchema = z.object({ month: isoMonthSchema });
