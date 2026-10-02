import type {
  RecurringCadence,
  RecurringKind,
  RecurringRecordMode,
} from '@coinkeeper/shared/schema/enums';

import { dayOfMonth, lastDayOfMonth } from './calendar';
import { type AccountKey, Cleaner, WaterBill } from './persona';
import type { DemoPlan } from './plan';

export type DemoSeries = {
  account: AccountKey;
  amountMinor: number;
  anchorDate: string;
  cadence: RecurringCadence;
  category: string;
  deleted?: boolean;
  interval: number;
  kind: RecurringKind;
  matchWindowDays?: number;
  name: string;
  payee: string;
  recordMode?: RecurringRecordMode;
};

const SALARY_MATCH_WINDOW_DAYS = 7;
const QUARTER_MONTHS = 3;
const FORTNIGHT_WEEKS = 2;
const INSURANCE_MONTH = '03';
const MEMBERSHIP_MONTH = '10';
const INSURANCE_DAY = 15;
const MEMBERSHIP_DAY = 9;
const NETFLIX_DAY = 5;
const SPOTIFY_DAY = 9;
const INTERNET_DAY = 15;
const PHONE_INSURANCE_DAY = 20;
const YEAR_LENGTH = 4;

const firstYearlyDate = (plan: DemoPlan, month: string, day: number): string => {
  const years = [...new Set(plan.months.map(item => item.slice(0, YEAR_LENGTH)))];

  return years
    .map(year => dayOfMonth(`${year}-${month}`, day))
    .find(date => date >= plan.firstDate)!;
};

const monthlySeries = (firstMonth: string): DemoSeries[] => [
  {
    account: 'everyday',
    amountMinor: -120_000,
    anchorDate: `${firstMonth}-01`,
    cadence: 'monthly',
    category: 'Rent / Mortgage',
    interval: 1,
    kind: 'bill',
    name: 'Rent',
    payee: 'Oakwood Lettings',
  },
  {
    account: 'everyday',
    amountMinor: 300_000,
    anchorDate: lastDayOfMonth(firstMonth),
    cadence: 'monthly',
    category: 'Salary',
    interval: 1,
    kind: 'income',
    matchWindowDays: SALARY_MATCH_WINDOW_DAYS,
    name: 'Salary',
    payee: 'Northwind Labs',
  },
  {
    account: 'creditCard',
    amountMinor: -1399,
    anchorDate: dayOfMonth(firstMonth, NETFLIX_DAY),
    cadence: 'monthly',
    category: 'Streaming',
    interval: 1,
    kind: 'subscription',
    name: 'Netflix',
    payee: 'Netflix',
  },
  {
    account: 'creditCard',
    amountMinor: -1199,
    anchorDate: dayOfMonth(firstMonth, SPOTIFY_DAY),
    cadence: 'monthly',
    category: 'Music',
    interval: 1,
    kind: 'subscription',
    name: 'Spotify',
    payee: 'Spotify',
  },
  {
    account: 'everyday',
    amountMinor: -2500,
    anchorDate: dayOfMonth(firstMonth, INTERNET_DAY),
    cadence: 'monthly',
    category: 'Internet & TV',
    interval: 1,
    kind: 'bill',
    name: 'Fibre internet',
    payee: 'FibreNet',
  },
];

const yearlySeries = (plan: DemoPlan): DemoSeries[] => [
  {
    account: 'everyday',
    amountMinor: -18_000,
    anchorDate: firstYearlyDate(plan, INSURANCE_MONTH, INSURANCE_DAY),
    cadence: 'yearly',
    category: 'Home insurance',
    interval: 1,
    kind: 'bill',
    name: 'Home contents insurance',
    payee: 'SafeNest Insurance',
  },
  {
    account: 'creditCard',
    amountMinor: -8900,
    anchorDate: firstYearlyDate(plan, MEMBERSHIP_MONTH, MEMBERSHIP_DAY),
    cadence: 'yearly',
    category: 'Subscriptions',
    interval: 1,
    kind: 'subscription',
    name: 'BoxDrop Prime',
    payee: 'BoxDrop Prime',
  },
];

const otherSeries = (plan: DemoPlan): DemoSeries[] => [
  {
    account: Cleaner.account,
    amountMinor: -Cleaner.amountMinor,
    anchorDate: plan.cleanerFirstDate,
    cadence: 'weekly',
    category: Cleaner.category,
    interval: FORTNIGHT_WEEKS,
    kind: 'bill',
    name: 'Cleaner',
    payee: Cleaner.payee,
  },
  {
    account: WaterBill.account,
    amountMinor: -WaterBill.amountMinor,
    anchorDate: plan.waterAnchorDate,
    cadence: 'monthly',
    category: WaterBill.category,
    interval: QUARTER_MONTHS,
    kind: 'bill',
    name: 'Water',
    payee: WaterBill.payee,
  },
  {
    account: 'creditCard',
    amountMinor: -299,
    anchorDate: plan.today,
    cadence: 'monthly',
    category: 'Subscriptions',
    interval: 1,
    kind: 'subscription',
    name: 'SkyVault storage',
    payee: 'SkyVault',
    recordMode: 'create_pending',
  },
  {
    account: 'everyday',
    amountMinor: -799,
    anchorDate: dayOfMonth(plan.months[0], PHONE_INSURANCE_DAY),
    cadence: 'monthly',
    category: 'Mobile phone',
    deleted: true,
    interval: 1,
    kind: 'bill',
    name: 'Old phone insurance',
    payee: 'Mobi Mobile',
  },
];

export const demoSeries = (plan: DemoPlan): DemoSeries[] => [
  ...monthlySeries(plan.months[0]),
  ...yearlySeries(plan),
  ...otherSeries(plan),
];
