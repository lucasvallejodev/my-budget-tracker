import { formatExchangeRate } from '@coinkeeper/shared/lib/money';

import type { Summary } from './use-finance-data';

export const describeConversion = (converted: NonNullable<Summary['converted']>): string => {
  const base = `Approximate, using your manual rates as of ${converted.asOf}`;

  if (!converted.rates.length) return base;

  const rates = converted.rates
    .map(
      rate =>
        `1 ${rate.currency} = ${formatExchangeRate(rate.rate)} ${converted.currency} from ${rate.date}`
    )
    .join(', ');

  return `${base} (${rates})`;
};
