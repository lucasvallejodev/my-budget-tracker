import { balanceAccounts } from './balance';
import { addDays, monthsEndingAt } from './calendar';
import {
  cardPayments,
  cleanerEntries,
  deletedDuplicate,
  type DemoEntry,
  entriesForMonth,
  firstWeekdayOnOrAfter,
  markRecentCardPending,
  monthOf,
  unreviewedEntries,
  waterAnchorOf,
  waterEntries,
} from './entries';
import { type AccountKey, Cleaner, DEMO_HISTORY_MONTHS, DemoAccounts, Salary } from './persona';
import { MonthlyBudgets } from './spending';

export type { DemoEntry, StandardEntry, TransferEntry } from './entries';

export type DemoPlan = {
  budgets: { amountMinor: number; category: string; month: string }[];
  cleanerFirstDate: string;
  entries: DemoEntry[];
  firstDate: string;
  months: string[];
  openingDate: string;
  paydays: string[];
  today: string;
  waterAnchorDate: string;
};

const byDate = (left: DemoEntry, right: DemoEntry): number => left.date.localeCompare(right.date);

export const buildDemoPlan = (today: string): DemoPlan => {
  const months = monthsEndingAt(monthOf(today), DEMO_HISTORY_MONTHS + 1);
  const firstDate = `${months[0]}-01`;
  const inWindow = (entry: DemoEntry) => entry.date >= firstDate && entry.date <= today;
  const waterAnchorDate = waterAnchorOf(today);

  const monthly = [
    ...months.flatMap((month, index) =>
      entriesForMonth({
        key: item => `${month} ${item}`,
        month,
        offset: index - DEMO_HISTORY_MONTHS,
        today,
      })
    ),
    ...cleanerEntries(firstDate, today),
    ...waterEntries(waterAnchorDate, firstDate, today),
  ].filter(inWindow);

  const planned = [
    ...monthly,
    ...cardPayments(monthly, months),
    ...unreviewedEntries(today),
    deletedDuplicate(firstDate, today),
  ]
    .filter(inWindow)
    .map(entry => markRecentCardPending(entry, today))
    .sort(byDate);

  const entries = balanceAccounts(planned);

  return {
    budgets: months.flatMap(month => MonthlyBudgets.map(budget => ({ ...budget, month }))),
    cleanerFirstDate: firstWeekdayOnOrAfter(firstDate, Cleaner.firstWeekday),
    entries,
    firstDate,
    months,
    openingDate: addDays(firstDate, -1),
    paydays: entries.flatMap(entry =>
      entry.kind === 'standard' && entry.payee === Salary.payee ? [entry.date] : []
    ),
    today,
    waterAnchorDate,
  };
};

export const openingBalances = (): { account: AccountKey; amountMinor: number }[] =>
  (Object.keys(DemoAccounts) as AccountKey[]).map(account => ({
    account,
    amountMinor: DemoAccounts[account].openingBalanceMinor,
  }));
