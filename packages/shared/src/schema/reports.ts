import { z } from 'zod';

import { FieldLengths } from '../constants/field-lengths';
import { accountSummarySchema } from './accounts';
import { isoMonthSchema } from './common';

export const currencyTotalsSchema = z.object({
  currency: z.string(),
  incomeMinor: z.number().int(),
  spendingMinor: z.number().int(),
});

export type CurrencyTotals = z.infer<typeof currencyTotalsSchema>;

export const groupSliceSchema = z.object({
  color: z.string(),
  currency: z.string(),
  groupId: z.string().nullable(),
  groupName: z.string(),
  spentMinor: z.number().int(),
});

export type GroupSlice = z.infer<typeof groupSliceSchema>;

export const netWorthBucketSchema = z.object({
  assetsMinor: z.number().int(),
  currency: z.string(),
  liabilitiesMinor: z.number().int(),
  netMinor: z.number().int(),
});

export type NetWorthBucket = z.infer<typeof netWorthBucketSchema>;

export const convertedTotalsSchema = z.object({
  asOf: z.string(),
  currency: z.string(),
  incomeMinor: z.number().int(),
  missing: z.array(z.string()),
  netWorthMinor: z.number().int(),
  rates: z.array(
    z.object({
      currency: z.string(),
      date: z.string(),
      rate: z.number(),
      source: z.string(),
    })
  ),
  spendingMinor: z.number().int(),
});

export type ConvertedTotals = z.infer<typeof convertedTotalsSchema>;

export const cashPointSchema = z.object({
  currency: z.string(),
  incomeMinor: z.number().int(),
  month: z.string(),
  spendingMinor: z.number().int(),
});

export type CashPoint = z.infer<typeof cashPointSchema>;

export const summarySchema = z.object({
  accounts: z.array(accountSummarySchema),
  breakdown: z.array(groupSliceSchema),
  cashFlow: z.array(cashPointSchema),
  converted: convertedTotalsSchema.nullable(),
  month: z.string(),
  needsReviewCount: z.number().int(),
  netWorth: z.array(netWorthBucketSchema),
  totals: z.array(currencyTotalsSchema),
});

export type Summary = z.infer<typeof summarySchema>;

const MAX_CASH_FLOW_MONTHS = 24;

export const BreakdownDimensionValues = ['group', 'category'] as const;

const cashFlowMonthsSchema = z.coerce.number().int().min(1).max(MAX_CASH_FLOW_MONTHS);

export const summaryQuerySchema = z.object({
  cashFlowMonths: cashFlowMonthsSchema.optional(),
  month: isoMonthSchema.optional(),
});

export const monthQuerySchema = z.object({ month: isoMonthSchema });

export const breakdownQuerySchema = monthQuerySchema.extend({
  by: z.enum(BreakdownDimensionValues).default('group'),
  currency: z.string().length(FieldLengths.currencyCode).optional(),
});

export const cashFlowQuerySchema = monthQuerySchema.extend({
  months: cashFlowMonthsSchema.optional(),
});

export const categorySliceSchema = z.object({
  categoryId: z.string().nullable(),
  categoryName: z.string(),
  color: z.string(),
  groupId: z.string().nullable(),
  groupName: z.string(),
  icon: z.string(),
  spentMinor: z.number().int(),
});

export type CategorySlice = z.infer<typeof categorySliceSchema>;
