import { z } from 'zod';

export const currencySchema = z.object({
  code: z.string(),
  isActive: z.boolean(),
  minorUnits: z.number().int(),
  name: z.string(),
  symbol: z.string(),
});

export type Currency = z.infer<typeof currencySchema>;
