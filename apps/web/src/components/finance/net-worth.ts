import type { BalancePoint } from './use-finance-data';

export type MonthTotal = {
  label: string;
  month: string;
  totalMinor: number;
};

const MonthNames = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });

export const shortMonthLabel = (month: string): string =>
  MonthNames.format(new Date(`${month}-01T00:00:00Z`));

export const netWorthByMonth = (balances: BalancePoint[], currency: string): MonthTotal[] => {
  const totals = new Map<string, number>();

  for (const point of balances) {
    if (point.currency !== currency) continue;

    totals.set(point.month, (totals.get(point.month) ?? 0) + point.balanceMinor);
  }

  return [...totals.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, totalMinor]) => ({
      label: shortMonthLabel(month),
      month,
      totalMinor,
    }));
};
