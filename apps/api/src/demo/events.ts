import type { AccountKey, SplitItem, YearlyItem } from './persona';

export const YearlyPurchases: readonly YearlyItem[] = [
  {
    account: 'everyday',
    amountMinor: [18_000, 18_000],
    category: 'Home insurance',
    day: 15,
    memo: 'Home contents insurance',
    month: 3,
    payee: 'SafeNest Insurance',
  },
  {
    account: 'creditCard',
    amountMinor: [26_000, 34_000],
    category: 'Flights',
    day: 4,
    memo: 'Summer holiday',
    month: 7,
    payee: 'SkyHop Airlines',
  },
  {
    account: 'creditCard',
    amountMinor: [52_000, 68_000],
    category: 'Lodging',
    day: 12,
    memo: 'Summer holiday',
    month: 8,
    payee: 'Seaside Villas',
  },
  {
    account: 'creditCard',
    amountMinor: [6000, 12_000],
    category: 'Vacation activities',
    day: 14,
    memo: 'Summer holiday',
    month: 8,
    payee: 'Island Tours',
  },
  {
    account: 'creditCard',
    amountMinor: [8900, 8900],
    category: 'Subscriptions',
    day: 9,
    memo: 'Yearly membership',
    month: 10,
    payee: 'BoxDrop Prime',
  },
  {
    account: 'creditCard',
    amountMinor: [12_000, 22_000],
    category: 'Gifts',
    day: 18,
    memo: 'Christmas presents',
    month: 12,
    payee: 'Giftology',
  },
  {
    account: 'creditCard',
    amountMinor: [6000, 9000],
    category: 'Celebrations',
    day: 30,
    memo: "New Year's Eve dinner",
    month: 12,
    payee: 'The Brass Tap',
  },
];

export const SplitPurchases: readonly SplitItem[] = [
  {
    account: 'everyday',
    day: 26,
    lines: [
      { amountMinor: [6000, 9500], category: 'Groceries' },
      { amountMinor: [1500, 3500], category: 'Home & garden' },
    ],
    memo: 'Big monthly shop',
    name: 'big shop',
    payee: 'Greenleaf Market',
    probability: 1,
  },
  {
    account: 'creditCard',
    day: 22,
    lines: [
      { amountMinor: [1500, 4000], category: 'Clothing' },
      { amountMinor: [1000, 3000], category: 'General merchandise' },
      { amountMinor: [500, 1500], category: 'Personal care' },
    ],
    memo: 'Megastore run',
    name: 'megastore',
    payee: 'MegaMart',
    probability: 0.35,
  },
];

export type DemoTemplate = {
  account?: AccountKey;
  amountMinor: null | number;
  category?: string;
  kind: 'standard' | 'transfer';
  name: string;
  payee?: string;
  to?: AccountKey;
};

export const DemoTemplates: readonly DemoTemplate[] = [
  {
    account: 'cash',
    amountMinor: -320,
    category: 'Coffee',
    kind: 'standard',
    name: 'Coffee',
    payee: 'Corner Café',
  },
  {
    account: 'cash',
    amountMinor: null,
    category: 'Groceries',
    kind: 'standard',
    name: 'Bakery',
    payee: 'Village Bakery',
  },
  {
    account: 'everyday',
    amountMinor: null,
    category: 'Groceries',
    kind: 'standard',
    name: 'Groceries',
    payee: 'Greenleaf Market',
  },
  {
    account: 'creditCard',
    amountMinor: -1800,
    category: 'Personal care',
    kind: 'standard',
    name: 'Haircut',
    payee: 'Fade & Co Barbers',
  },
  {
    account: 'everyday',
    amountMinor: 50_000,
    kind: 'transfer',
    name: 'Monthly savings',
    to: 'savings',
  },
  {
    account: 'everyday',
    amountMinor: 10_000,
    kind: 'transfer',
    name: 'Cash withdrawal',
    to: 'cash',
  },
];

export const DeletedTemplate: DemoTemplate = {
  account: 'creditCard',
  amountMinor: -2900,
  category: 'Fitness',
  kind: 'standard',
  name: 'Old yoga pass',
  payee: 'PulseFit Gym',
};
