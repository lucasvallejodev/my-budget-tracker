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

const MAX_REPORT_MONTHS = 24;

export const BreakdownDimensionValues = ['group', 'category', 'payee', 'account'] as const;

export const BreakdownSplitValues = ['month'] as const;

const SplittableDimensions: readonly (typeof BreakdownDimensionValues)[number][] = [
  'group',
  'category',
];

const reportMonthsSchema = z.coerce.number().int().min(1).max(MAX_REPORT_MONTHS);

export const summaryQuerySchema = z.object({
  cashFlowMonths: reportMonthsSchema.optional(),
  month: isoMonthSchema.optional(),
});

export const monthQuerySchema = z.object({ month: isoMonthSchema });

export const breakdownQuerySchema = monthQuerySchema
  .extend({
    by: z.enum(BreakdownDimensionValues).default('group'),
    currency: z.string().length(FieldLengths.currencyCode).optional(),
    months: reportMonthsSchema.optional(),
    split: z.enum(BreakdownSplitValues).optional(),
  })
  .refine(query => !query.split || SplittableDimensions.includes(query.by), {
    message: 'Split by month only works with by=group or by=category',
    path: ['split'],
  });

export const cashFlowQuerySchema = monthQuerySchema.extend({
  months: reportMonthsSchema.optional(),
});

export const balancesQuerySchema = z.object({
  month: isoMonthSchema.optional(),
  months: reportMonthsSchema.optional(),
});

export const balancePointSchema = z.object({
  accountId: z.string(),
  balanceMinor: z.number().int(),
  currency: z.string(),
  month: z.string(),
});

export type BalancePoint = z.infer<typeof balancePointSchema>;

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

export const groupMonthSliceSchema = groupSliceSchema.extend({ month: z.string() });

export type GroupMonthSlice = z.infer<typeof groupMonthSliceSchema>;

export const categoryMonthSliceSchema = categorySliceSchema.extend({ month: z.string() });

export type CategoryMonthSlice = z.infer<typeof categoryMonthSliceSchema>;

export const rankingSliceSchema = z.object({
  currency: z.string(),
  id: z.string().nullable(),
  name: z.string(),
  spentMinor: z.number().int(),
  transactions: z.number().int(),
});

export type RankingSlice = z.infer<typeof rankingSliceSchema>;
