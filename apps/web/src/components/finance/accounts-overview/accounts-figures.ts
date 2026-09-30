import { AccountGroups, accountTypeLabel, AccountTypes } from '@/constants/account';
import { getPercentage } from '@/lib/math';

import type { MonthTotal } from '../net-worth';
import type { AccountSummary, BalancePoint } from '../use-finance-data';

export type CurrencyAmount = {
  amountMinor: number;
  currency: string;
};

export type RangeChange = {
  changeMinor: number;
  percent: number | null;
};

export type AccountGroupFigures = {
  accounts: AccountSummary[];
  changes: CurrencyAmount[];
  label: string;
  liability: boolean;
  totals: CurrencyAmount[];
};

export type TypeSlice = {
  amountMinor: number;
  color: string;
  label: string;
  type: string;
};

export type BalanceSide = {
  slices: TypeSlice[];
  totalMinor: number;
};

export type BalancesByAccount = Map<string, BalancePoint[]>;

const AccountNumberVisibleDigits = 4;
const MaskedDigits = '••••';

export const isLiability = (account: AccountSummary): boolean =>
  account.classification === 'liability';

export const isActive = (account: AccountSummary): boolean => !account.archivedAt;

export const countLabel = (count: number, singular: string, plural = `${singular}s`): string =>
  `${count} ${count === 1 ? singular : plural}`;

export const currenciesOf = (accounts: AccountSummary[]): string[] => [
  ...new Set(accounts.map(account => account.currency)),
];

export const accountsDescription = (accounts: AccountSummary[]): string => {
  if (!accounts.length) return 'Your accounts and their balances, grouped by type.';

  const currencies = currenciesOf(accounts).length;

  return `${countLabel(accounts.length, 'account')} in ${countLabel(currencies, 'currency', 'currencies')}. Balances come from your ledger.`;
};

export const accountDetail = (account: AccountSummary): string => {
  const lastDigits = account.accountNumber?.slice(-AccountNumberVisibleDigits);

  return [
    account.institution || accountTypeLabel(account.type),
    account.currency,
    lastDigits ? `${MaskedDigits} ${lastDigits}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
};

export const sumByCurrency = (entries: CurrencyAmount[]): CurrencyAmount[] => {
  const totals = new Map<string, number>();

  for (const entry of entries) {
    totals.set(entry.currency, (totals.get(entry.currency) ?? 0) + entry.amountMinor);
  }

  return [...totals.entries()].map(([currency, amountMinor]) => ({ amountMinor, currency }));
};

export const seriesForRange = (series: MonthTotal[], months: number): MonthTotal[] =>
  series.slice(-(months + 1));

export const rangeChange = (series: MonthTotal[], currentMinor: number): RangeChange => {
  const startMinor = series[0]?.totalMinor ?? currentMinor;
  const changeMinor = currentMinor - startMinor;

  return {
    changeMinor,
    percent: startMinor ? getPercentage(changeMinor, Math.abs(startMinor)) : null,
  };
};

export const balancesByAccount = (balances: BalancePoint[]): BalancesByAccount => {
  const byAccount: BalancesByAccount = new Map();

  const chronological = balances.toSorted((left, right) => left.month.localeCompare(right.month));

  for (const point of chronological) {
    const points = byAccount.get(point.accountId) ?? [];

    points.push(point);
    byAccount.set(point.accountId, points);
  }

  return byAccount;
};

export const displayedBalance = (account: AccountSummary, balanceMinor: number): number =>
  isLiability(account) ? -balanceMinor : balanceMinor;

export const accountTrend = (account: AccountSummary, balances: BalancesByAccount): number[] =>
  (balances.get(account.id) ?? []).map(point => displayedBalance(account, point.balanceMinor));

export const monthChange = (
  account: AccountSummary,
  balances: BalancesByAccount,
  previousMonth: string
): number => {
  const points = balances.get(account.id);

  if (!points?.length) return 0;

  const previous = points.find(point => point.month === previousMonth)?.balanceMinor ?? 0;

  return account.balanceMinor - previous;
};

export const groupAccounts = (
  accounts: AccountSummary[],
  balances: BalancesByAccount,
  previousMonth: string
): AccountGroupFigures[] =>
  AccountGroups.flatMap(group => {
    const members = accounts.filter(account => (group.types as string[]).includes(account.type));

    if (!members.length) return [];

    const active = members.filter(isActive);
    const liability = members.every(isLiability);

    return [
      {
        accounts: members,
        changes: sumByCurrency(
          active.map(account => ({
            amountMinor: liability
              ? displayedBalance(account, monthChange(account, balances, previousMonth))
              : monthChange(account, balances, previousMonth),
            currency: account.currency,
          }))
        ),
        label: group.label,
        liability,
        totals: sumByCurrency(
          active.map(account => ({ amountMinor: account.balanceMinor, currency: account.currency }))
        ),
      },
    ];
  });

const sideOf = (accounts: AccountSummary[]): BalanceSide => {
  const slices = AccountTypes.flatMap(type => {
    const amountMinor = accounts
      .filter(account => account.type === type.value)
      .reduce((total, account) => total + displayedBalance(account, account.balanceMinor), 0);

    return amountMinor
      ? [
          {
            amountMinor,
            color: type.color,
            label: type.label,
            type: type.value,
          },
        ]
      : [];
  }).toSorted((left, right) => right.amountMinor - left.amountMinor);

  return {
    slices,
    totalMinor: slices.reduce((total, slice) => total + slice.amountMinor, 0),
  };
};

export const balanceSides = (
  accounts: AccountSummary[],
  currency: string
): { assets: BalanceSide; liabilities: BalanceSide } => {
  const held = accounts.filter(account => account.currency === currency && isActive(account));

  return {
    assets: sideOf(held.filter(account => !isLiability(account))),
    liabilities: sideOf(held.filter(isLiability)),
  };
};

export const paymentAccountFor = (
  card: AccountSummary,
  accounts: AccountSummary[]
): string | undefined => {
  const assets = accounts.filter(
    account => isActive(account) && !isLiability(account) && account.id !== card.id
  );

  return (assets.find(account => account.currency === card.currency) ?? assets[0])?.id;
};

export const accountHref = (accountId: string): string => `/accounts/${accountId}`;
