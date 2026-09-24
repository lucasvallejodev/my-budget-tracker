import { z } from 'zod';

import { FieldLengths } from '../constants/field-lengths';
import { Patterns } from '../lib/patterns';
import { deletedQuerySchema, isoDateSchema } from './common';

const currencyCode = z.string().length(FieldLengths.currencyCode);

export const exchangeRateKeySchema = z.object({
  base: currencyCode,
  date: z.string().regex(Patterns.isoDate, 'Choose a date'),
  quote: currencyCode,
});

export type ExchangeRateKey = z.infer<typeof exchangeRateKeySchema>;

export const exchangeRateFormSchema = exchangeRateKeySchema.extend({
  rate: z.string().trim().min(1, 'Rate is required').max(FieldLengths.amountInput),
});

export type ExchangeRateFormValues = z.infer<typeof exchangeRateFormSchema>;

export const exchangeRateSchema = z.object({
  base: z.string(),
  date: z.string(),
  deletedAt: z.string().nullable(),
  quote: z.string(),
  rate: z.number(),
  source: z.string(),
});

export type ExchangeRateRow = z.infer<typeof exchangeRateSchema>;

export const exchangeRateBodySchema = exchangeRateFormSchema.pick({ rate: true });

export const exchangeRateListQuerySchema = deletedQuerySchema.extend({
  base: currencyCode.optional(),
  from: isoDateSchema.optional(),
  quote: currencyCode.optional(),
  to: isoDateSchema.optional(),
});
