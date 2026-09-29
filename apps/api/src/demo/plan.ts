import { ISO_MONTH_LENGTH } from '@coinkeeper/shared/constants/time';
import { convertMinor } from '@coinkeeper/shared/lib/money';

import {
  addDays,
  dayOfMonth,
  lastDayOfMonth,
  monthsEndingAt,
  previousWorkingDay,
} from './calendar';
import {
  type AccountKey,
  CARD_PAYMENT_DAY,
  CardPaymentMemo,
  CashWithdrawal,
  DEMO_HISTORY_MONTHS,
  DemoAccounts,
  DemoFxRate,
  type MonthlyItem,
  PAYDAY_MAX_DAYS_BEFORE_MONTH_END,
  PENDING_WITHIN_DAYS,
  Salary,
  SavingsTransfer,
  UsdTopUp,
} from './persona';
import { randomChance, randomInteger, randomPick } from './random';
import {
  MonthlyBills,
  MonthlyBudgets,
  MonthlyIncome,
  OneOffPurchases,
  UnreviewedPurchases,
  VariableSpending,
} from './spending';

export type StandardEntry = {
  account: AccountKey;
  amountMinor: number;
  bankDescription?: string;
  category: null | string;
  date: string;
  kind: 'standard';
  memo: string;
  payee: null | string;
  status: 'cleared' | 'pending';
};

export type TransferEntry = {
  amountFromMinor: number;
  amountToMinor?: number;
  date: string;
  from: AccountKey;
  kind: 'transfer';
  memo: string;
  to: AccountKey;
};

export type DemoEntry = StandardEntry | TransferEntry;

export type DemoPlan = {
  budgets: { amountMinor: number; category: string; month: string }[];
  entries: DemoEntry[];
  firstDate: string;
  months: string[];
  openingDate: string;
  today: string;
};

type MonthContext = {
  key: (item: string) => string;
  month: string;
  offset: number;
};

const JitterDays = { max: 1, min: 0 } as const;

const standard = (
  entry: Omit<StandardEntry, 'kind' | 'memo' | 'status'> & { memo?: string }
): StandardEntry => ({
  kind: 'standard',
  memo: '',
  status: 'cleared',
  ...entry,
});

const transfer = (entry: Omit<TransferEntry, 'kind'>): TransferEntry => ({
  kind: 'transfer',
  ...entry,
});

const monthOf = (isoDate: string): string => isoDate.slice(0, ISO_MONTH_LENGTH);

const isActive = (item: MonthlyItem, offset: number): boolean =>
  (item.activeFromOffset === undefined || offset >= item.activeFromOffset) &&
  (item.activeUntilOffset === undefined || offset <= item.activeUntilOffset);

const monthlyEntries = (
  context: MonthContext,
  items: readonly MonthlyItem[],
  sign: number
): StandardEntry[] =>
  items
    .filter(item => isActive(item, context.offset))
    .map(item =>
      standard({
        account: item.account,
        amountMinor:
          sign * randomInteger(context.key(item.memo), item.amountMinor[0], item.amountMinor[1]),
        category: item.category,
        date: dayOfMonth(context.month, item.day),
        memo: item.memo,
        payee: item.payee,
      })
    );

const paydayOf = (context: MonthContext): string =>
  previousWorkingDay(
    addDays(
      lastDayOfMonth(context.month),
      -randomInteger(context.key('payday'), 0, PAYDAY_MAX_DAYS_BEFORE_MONTH_END)
    )
  );

const salaryEntries = (context: MonthContext): DemoEntry[] => {
  const payday = paydayOf(context);

  const savingsMinor =
    randomInteger(context.key('savings'), SavingsTransfer.minSteps, SavingsTransfer.maxSteps) *
    SavingsTransfer.stepMinor;

  return [
    standard({
      account: 'everyday',
      date: payday,
      ...Salary,
    }),
    transfer({
      amountFromMinor: savingsMinor,
      date: addDays(payday, 1),
      from: 'everyday',
      memo: SavingsTransfer.memo,
      to: 'savings',
    }),
  ];
};

const transferEntries = (context: MonthContext): TransferEntry[] => {
  const topUpMinor =
    randomInteger(context.key('usd top-up'), UsdTopUp.minSteps, UsdTopUp.maxSteps) *
    UsdTopUp.stepMinor;

  return [
    transfer({
      amountFromMinor: topUpMinor,
      amountToMinor: convertMinor(topUpMinor, DemoFxRate.base, DemoFxRate.quote, DemoFxRate.rate),
      date: dayOfMonth(context.month, UsdTopUp.day),
      from: 'everyday',
      memo: UsdTopUp.memo,
      to: 'usd',
    }),
    transfer({
      amountFromMinor: CashWithdrawal.amountMinor,
      date: dayOfMonth(context.month, CashWithdrawal.day),
      from: 'everyday',
      memo: CashWithdrawal.memo,
      to: 'cash',
    }),
  ];
};

const variableEntries = (context: MonthContext): StandardEntry[] =>
  VariableSpending.flatMap(item =>
    item.days
      .map(day => ({ day, key: context.key(`${item.name} ${day}`) }))
      .filter(({ key }) => randomChance(`${key} happens`, item.probability))
      .map(({ day, key }) =>
        standard({
          account: item.account,
          amountMinor: -randomInteger(key, item.amountMinor[0], item.amountMinor[1]),
          category: item.category,
          date: dayOfMonth(
            context.month,
            day + randomInteger(`${key} jitter`, JitterDays.min, JitterDays.max)
          ),
          payee: randomPick(`${key} payee`, item.payees),
        })
      )
  );

const oneOffEntries = (context: MonthContext): StandardEntry[] =>
  OneOffPurchases.filter(item => item.monthOffset === context.offset).map(item =>
    standard({
      account: item.account,
      amountMinor: item.amountMinor,
      category: item.category,
      date: dayOfMonth(context.month, item.day),
      memo: item.memo,
      payee: item.payee,
    })
  );

const entriesForMonth = (context: MonthContext): DemoEntry[] => [
  ...salaryEntries(context),
  ...monthlyEntries(context, MonthlyIncome, 1),
  ...monthlyEntries(context, MonthlyBills, -1),
  ...transferEntries(context),
  ...variableEntries(context),
  ...oneOffEntries(context),
];

const cardSpendingIn = (entries: DemoEntry[], month: string): number =>
  entries
    .filter(entry => entry.kind === 'standard' && entry.account === 'creditCard')
    .filter(entry => monthOf(entry.date) === month)
    .reduce((total, entry) => total - (entry as StandardEntry).amountMinor, 0);

const cardPayments = (entries: DemoEntry[], months: string[]): TransferEntry[] =>
  months.slice(1).flatMap((month, index) => {
    const amountFromMinor = cardSpendingIn(entries, months[index]);

    if (amountFromMinor <= 0) return [];

    return [
      transfer({
        amountFromMinor,
        date: dayOfMonth(month, CARD_PAYMENT_DAY),
        from: 'everyday',
        memo: CardPaymentMemo,
        to: 'creditCard',
      }),
    ];
  });

const unreviewedEntries = (today: string): StandardEntry[] =>
  UnreviewedPurchases.map(item => {
    const daysAgo = addDays(today, -item.daysAgo);

    return standard({
      account: item.account,
      amountMinor: item.amountMinor,
      bankDescription: item.bankDescription,
      category: null,
      date: monthOf(daysAgo) === monthOf(today) ? daysAgo : today,
      payee: null,
    });
  });

const markRecentCardPending = (entry: DemoEntry, today: string): DemoEntry =>
  entry.kind === 'standard' &&
  entry.account === 'creditCard' &&
  entry.date >= addDays(today, -PENDING_WITHIN_DAYS)
    ? { ...entry, status: 'pending' }
    : entry;

const byDate = (left: DemoEntry, right: DemoEntry): number => left.date.localeCompare(right.date);

export const buildDemoPlan = (today: string): DemoPlan => {
  const months = monthsEndingAt(monthOf(today), DEMO_HISTORY_MONTHS + 1);
  const firstDate = `${months[0]}-01`;
  const inWindow = (entry: DemoEntry) => entry.date >= firstDate && entry.date <= today;

  const monthly = months
    .flatMap((month, index) =>
      entriesForMonth({
        key: item => `${month} ${item}`,
        month,
        offset: index - DEMO_HISTORY_MONTHS,
      })
    )
    .filter(inWindow);

  const entries = [...monthly, ...cardPayments(monthly, months), ...unreviewedEntries(today)]
    .filter(inWindow)
    .map(entry => markRecentCardPending(entry, today))
    .sort(byDate);

  return {
    budgets: months.flatMap(month => MonthlyBudgets.map(budget => ({ ...budget, month }))),
    entries,
    firstDate,
    months,
    openingDate: addDays(firstDate, -1),
    today,
  };
};

export const openingBalances = (): { account: AccountKey; amountMinor: number }[] =>
  (Object.keys(DemoAccounts) as AccountKey[]).map(account => ({
    account,
    amountMinor: DemoAccounts[account].openingBalanceMinor,
  }));
