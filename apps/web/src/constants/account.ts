import {
  Banknote,
  CreditCard,
  HandCoins,
  Landmark,
  LucideIcon,
  PiggyBank,
  TrendingUp,
  Wallet,
} from 'lucide-react';

export const AccountTypes = [
  {
    color: 'var(--color-account-checking)',
    icon: Landmark,
    label: 'Checking',
    value: 'checking',
  },
  {
    color: 'var(--color-account-savings)',
    icon: PiggyBank,
    label: 'Savings',
    value: 'savings',
  },
  {
    color: 'var(--color-account-cash)',
    icon: Banknote,
    label: 'Cash',
    value: 'cash',
  },
  {
    color: 'var(--color-account-credit-card)',
    icon: CreditCard,
    label: 'Credit card',
    value: 'credit_card',
  },
  {
    color: 'var(--color-account-loan)',
    icon: HandCoins,
    label: 'Loan',
    value: 'loan',
  },
  {
    color: 'var(--color-account-investment)',
    icon: TrendingUp,
    label: 'Investment',
    value: 'investment',
  },
  {
    color: 'var(--color-account-other)',
    icon: Wallet,
    label: 'Other',
    value: 'other',
  },
] as const;

export type AccountTypeValue = (typeof AccountTypes)[number]['value'];

export type AccountTypeStyle = {
  color: string;
  icon: LucideIcon;
};

const OtherAccountType = AccountTypes[AccountTypes.length - 1];

export const accountTypeLabel = (value: string): string =>
  AccountTypes.find(type => type.value === value)?.label ?? value;

export const accountTypeStyle = (value: string): AccountTypeStyle =>
  AccountTypes.find(type => type.value === value) ?? OtherAccountType;

export const AccountGroups: { label: string; types: AccountTypeValue[] }[] = [
  { label: 'Cash & checking', types: ['checking', 'cash'] },
  { label: 'Savings & investments', types: ['savings', 'investment'] },
  { label: 'Credit cards', types: ['credit_card'] },
  { label: 'Loans', types: ['loan'] },
  { label: 'Other', types: ['other'] },
];
