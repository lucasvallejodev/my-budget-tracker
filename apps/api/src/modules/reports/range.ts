import { isoDateOfMonthStart } from '@coinkeeper/shared/lib/date-helpers';

import { monthRange } from '../ledger/service';

export type MonthSpan = {
  end: string;
  start: string;
};

export const monthsEndingAt = (month: string, months = 1): MonthSpan => ({
  end: monthRange(month).end,
  start: isoDateOfMonthStart(month, 1 - months),
});
