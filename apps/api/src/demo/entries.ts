import { ISO_MONTH_LENGTH } from '@coinkeeper/shared/constants/time';
import { convertMinor } from '@coinkeeper/shared/lib/money';
import { occurrencesBetween } from '@coinkeeper/shared/lib/recurrence';

import { addDays, dayOfMonth, lastDayOfMonth, previousWorkingDay } from './calendar';
import { SplitPurchases, YearlyPurchases } from './events';
import {
  type AccountKey,
  CARD_PAYMENT_DAY,
  CardPaymentMemo,
  Cleaner,
  DeletedDuplicate,
  DemoFxRate,
  type MonthlyItem,
  PAYDAY_MAX_DAYS_BEFORE_MONTH_END,
  PENDING_WITHIN_DAYS,
  Salary,
  SalaryBeforeRaise,
  type SplitItem,
  UsdTopUp,
  WaterBill,
} from './persona';
import { randomChance, randomInteger, randomPick } from './random';
import {
  MonthlyBills,
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
  deleted?: boolean;
  kind: 'standard';
  memo: string;
  payee: null | string;
  splits?: { amountMinor: number; category: string }[];
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

export type MonthContext = {
  key: (item: string) => string;
  month: string;
  offset: number;
  today: string;
};

const JitterDays = { max: 1, min: 0 } as const;
const MONTH_NUMBER_START = 5;
const MONTH_DIGITS = 2;
const DAY_NUMBER_START = ISO_MONTH_LENGTH + 1;
const DAYS_PER_WEEK = 7;
const MONTHS_PER_YEAR = 12;
const WATER_HISTORY_QUARTERS = 9;
const UtcMidnight = 'T00:00:00Z';

export const standard = (
  entry: Omit<StandardEntry, 'kind' | 'memo' | 'status'> & { memo?: string }
): StandardEntry => ({
  kind: 'standard',
  memo: '',
  status: 'cleared',
  ...entry,
});

export const transfer = (entry: Omit<TransferEntry, 'kind'>): TransferEntry => ({
  kind: 'transfer',
  ...entry,
});

export const monthOf = (isoDate: string): string => isoDate.slice(0, ISO_MONTH_LENGTH);

const isActive = (item: MonthlyItem, offset: number): boolean =>
  (item.activeFromOffset === undefined || offset >= item.activeFromOffset) &&
  (item.activeUntilOffset === undefined || offset <= item.activeUntilOffset);

const shiftMonth = (isoMonth: string, months: number): string => {
  const [year, month] = isoMonth.split('-').map(Number);
  const index = year * MONTHS_PER_YEAR + month - 1 + months;
  const monthNumber = String((index % MONTHS_PER_YEAR) + 1).padStart(MONTH_DIGITS, '0');

  return `${Math.floor(index / MONTHS_PER_YEAR)}-${monthNumber}`;
};

const latestDueDate = (day: number, today: string): string => {
  const thisMonth = dayOfMonth(monthOf(today), day);

  return thisMonth <= today ? thisMonth : dayOfMonth(shiftMonth(monthOf(today), -1), day);
};

const monthlyAmount = (context: MonthContext, item: MonthlyItem, date: string): number =>
  item.latestChargeMinor !== undefined && date >= latestDueDate(item.day, context.today)
    ? item.latestChargeMinor
    : randomInteger(context.key(item.memo), item.amountMinor[0], item.amountMinor[1]);

const monthlyEntries = (
  context: MonthContext,
  items: readonly MonthlyItem[],
  sign: number
): StandardEntry[] =>
  items
    .filter(item => isActive(item, context.offset))
    .map(item => {
      const date = dayOfMonth(context.month, item.day);

      return standard({
        account: item.account,
        amountMinor: sign * monthlyAmount(context, item, date),
        category: item.category,
        date,
        memo: item.memo,
        payee: item.payee,
      });
    });

const paydayOf = (context: MonthContext): string =>
  previousWorkingDay(
    addDays(
      lastDayOfMonth(context.month),
      -randomInteger(context.key('payday'), 0, PAYDAY_MAX_DAYS_BEFORE_MONTH_END)
    )
  );

const salaryEntry = (context: MonthContext): StandardEntry =>
  standard({
    account: 'everyday',
    date: paydayOf(context),
    ...Salary,
    amountMinor:
      context.offset <= SalaryBeforeRaise.untilOffset
        ? SalaryBeforeRaise.amountMinor
        : Salary.amountMinor,
  });

const usdTopUps = (context: MonthContext): TransferEntry[] => {
  if (Number(context.month.slice(MONTH_NUMBER_START)) % UsdTopUp.everyMonths) return [];

  return [
    transfer({
      amountFromMinor: UsdTopUp.amountMinor,
      amountToMinor: convertMinor(
        UsdTopUp.amountMinor,
        DemoFxRate.base,
        DemoFxRate.quote,
        DemoFxRate.rate
      ),
      date: dayOfMonth(context.month, UsdTopUp.day),
      from: 'everyday',
      memo: UsdTopUp.memo,
      to: 'usd',
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

const yearlyEntries = (context: MonthContext): StandardEntry[] =>
  YearlyPurchases.filter(
    item => item.month === Number(context.month.slice(MONTH_NUMBER_START))
  ).map(item =>
    standard({
      account: item.account,
      amountMinor: -randomInteger(context.key(item.memo), item.amountMinor[0], item.amountMinor[1]),
      category: item.category,
      date: dayOfMonth(context.month, item.day),
      memo: item.memo,
      payee: item.payee,
    })
  );

const splitEntry = (context: MonthContext, item: SplitItem): StandardEntry => {
  const lines = item.lines.map(line => ({
    amountMinor: -randomInteger(
      context.key(`${item.name} ${line.category}`),
      line.amountMinor[0],
      line.amountMinor[1]
    ),
    category: line.category,
  }));

  return standard({
    account: item.account,
    amountMinor: lines.reduce((total, line) => total + line.amountMinor, 0),
    category: lines[0].category,
    date: dayOfMonth(context.month, item.day),
    memo: item.memo,
    payee: item.payee,
    splits: lines,
  });
};

const splitEntries = (context: MonthContext): StandardEntry[] =>
  SplitPurchases.filter(item =>
    randomChance(context.key(`${item.name} happens`), item.probability)
  ).map(item => splitEntry(context, item));

export const entriesForMonth = (context: MonthContext): DemoEntry[] => [
  salaryEntry(context),
  ...monthlyEntries(context, MonthlyIncome, 1),
  ...monthlyEntries(context, MonthlyBills, -1),
  ...usdTopUps(context),
  ...variableEntries(context),
  ...oneOffEntries(context),
  ...yearlyEntries(context),
  ...splitEntries(context),
];

export const firstWeekdayOnOrAfter = (isoDate: string, weekday: number): string => {
  const current = new Date(`${isoDate}${UtcMidnight}`).getUTCDay();

  return addDays(isoDate, (weekday - current + DAYS_PER_WEEK) % DAYS_PER_WEEK);
};

export const cleanerEntries = (firstDate: string, today: string): StandardEntry[] => {
  const dates: string[] = [];

  for (
    let date = firstWeekdayOnOrAfter(firstDate, Cleaner.firstWeekday);
    date <= today;
    date = addDays(date, Cleaner.everyDays)
  ) {
    dates.push(date);
  }

  return dates.map(date =>
    standard({
      account: Cleaner.account,
      amountMinor: -Cleaner.amountMinor,
      category: Cleaner.category,
      date,
      memo: Cleaner.memo,
      payee: Cleaner.payee,
    })
  );
};

export const waterAnchorOf = (today: string): string => {
  const latest = addDays(today, -WaterBill.latestDueDaysAgo);
  const anchorMonth = shiftMonth(monthOf(latest), -WaterBill.everyMonths * WATER_HISTORY_QUARTERS);

  return dayOfMonth(anchorMonth, Number(latest.slice(DAY_NUMBER_START)));
};

export const waterEntries = (
  anchorDate: string,
  firstDate: string,
  today: string
): StandardEntry[] => {
  const latest = addDays(today, -WaterBill.latestDueDaysAgo);

  return occurrencesBetween(
    {
      anchorDate,
      cadence: 'monthly',
      interval: WaterBill.everyMonths,
    },
    firstDate,
    today
  )
    .filter(date => date < latest)
    .map(date =>
      standard({
        account: WaterBill.account,
        amountMinor: -WaterBill.amountMinor,
        category: WaterBill.category,
        date,
        memo: WaterBill.memo,
        payee: WaterBill.payee,
      })
    );
};

export const deletedDuplicate = (firstDate: string, today: string): StandardEntry => {
  const date = addDays(today, -DeletedDuplicate.daysAgo);

  return standard({
    account: DeletedDuplicate.account,
    amountMinor: DeletedDuplicate.amountMinor,
    category: DeletedDuplicate.category,
    date: date < firstDate ? firstDate : date,
    deleted: true,
    memo: DeletedDuplicate.memo,
    payee: DeletedDuplicate.payee,
  });
};

const cardSpendingIn = (entries: DemoEntry[], month: string): number =>
  entries
    .filter(entry => entry.kind === 'standard' && entry.account === 'creditCard')
    .filter(entry => monthOf(entry.date) === month)
    .reduce((total, entry) => total - (entry as StandardEntry).amountMinor, 0);

export const cardPayments = (entries: DemoEntry[], months: string[]): TransferEntry[] =>
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

export const unreviewedEntries = (today: string): StandardEntry[] =>
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

export const markRecentCardPending = (entry: DemoEntry, today: string): DemoEntry =>
  entry.kind === 'standard' &&
  entry.account === 'creditCard' &&
  entry.date >= addDays(today, -PENDING_WITHIN_DAYS)
    ? { ...entry, status: 'pending' }
    : entry;
