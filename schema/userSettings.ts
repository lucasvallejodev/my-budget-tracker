import { CURRENCIES } from '@/constants/currencies';
import { z } from 'zod';

export const userSettingsSchema = z.object({
  currency: z.custom((value: string) => {
    const found = CURRENCIES.find(currency => currency.value === value);
    if (!found) {
      throw new Error(`Invalid currency: ${value}}`);
    }
    return value;
  }),
});
