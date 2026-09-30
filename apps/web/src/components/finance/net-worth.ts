import type { AccountSummary, BalancePoint, Summary } from './use-finance-data';

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

export type NetWorthBucket = Summary['netWorth'][number];

export const netWorthAt = (
  balances: BalancePoint[],
  accounts: AccountSummary[],
  month: string
): NetWorthBucket[] => {
  const buckets = new Map<string, NetWorthBucket>();

  for (const point of balances) {
    if (point.month !== month) continue;

    const liability =
      accounts.find(account => account.id === point.accountId)?.classification === 'liability';

    const bucket = buckets.get(point.currency) ?? {
      assetsMinor: 0,
      currency: point.currency,
      liabilitiesMinor: 0,
      netMinor: 0,
    };

    buckets.set(point.currency, {
      ...bucket,
      assetsMinor: bucket.assetsMinor + (liability ? 0 : point.balanceMinor),
      liabilitiesMinor: bucket.liabilitiesMinor + (liability ? point.balanceMinor : 0),
      netMinor: bucket.netMinor + point.balanceMinor,
    });
  }

  return [...buckets.values()];
};
