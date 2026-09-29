import type { AccountType } from '@coinkeeper/shared/schema/enums';

export type AccountKey = 'cash' | 'creditCard' | 'everyday' | 'savings' | 'usd';

type AmountRange = readonly [min: number, max: number];

export type DemoAccount = {
  currency: string;
  institution?: string;
  name: string;
  openingBalanceMinor: number;
  type: AccountType;
};

export type MonthlyItem = {
  account: AccountKey;
  activeFromOffset?: number;
  activeUntilOffset?: number;
  amountMinor: AmountRange;
  category: string;
  day: number;
  memo: string;
  payee: string;
};

export type VariableItem = {
  account: AccountKey;
  amountMinor: AmountRange;
  category: string;
  days: readonly number[];
  name: string;
  payees: readonly string[];
  probability: number;
};

export type OneOffItem = {
  account: AccountKey;
  amountMinor: number;
  category: string;
  day: number;
  memo: string;
  monthOffset: number;
  payee: string;
};

export type UnreviewedItem = {
  account: AccountKey;
  amountMinor: number;
  bankDescription: string;
  daysAgo: number;
};

export const DemoUser = { name: 'Jhon Doe' } as const;

export const DEMO_HISTORY_MONTHS = 6;
export const PAYDAY_MAX_DAYS_BEFORE_MONTH_END = 4;
export const PENDING_WITHIN_DAYS = 2;
export const CARD_PAYMENT_DAY = 4;

export const DemoFxRate = {
  base: 'EUR',
  quote: 'USD',
  rate: 1.13,
} as const;

export const DemoAccounts: Record<AccountKey, DemoAccount> = {
  cash: {
    currency: 'EUR',
    name: 'Cash',
    openingBalanceMinor: 4500,
    type: 'cash',
  },
  creditCard: {
    currency: 'EUR',
    institution: 'Northbank',
    name: 'Credit card',
    openingBalanceMinor: 0,
    type: 'credit_card',
  },
  everyday: {
    currency: 'EUR',
    institution: 'Northbank',
    name: 'Everyday account',
    openingBalanceMinor: 245_000,
    type: 'checking',
  },
  savings: {
    currency: 'EUR',
    institution: 'Northbank',
    name: 'Savings',
    openingBalanceMinor: 820_000,
    type: 'savings',
  },
  usd: {
    currency: 'USD',
    institution: 'Global Wallet',
    name: 'USD account',
    openingBalanceMinor: 64_000,
    type: 'checking',
  },
};

export const Salary = {
  amountMinor: 300_000,
  category: 'Salary',
  memo: 'Monthly salary',
  payee: 'Northwind Labs',
} as const;

export const SavingsTransfer = {
  maxSteps: 12,
  memo: 'Monthly savings',
  minSteps: 8,
  stepMinor: 5000,
} as const;

export const UsdTopUp = {
  day: 10,
  maxSteps: 14,
  memo: 'Top up the USD account',
  minSteps: 10,
  stepMinor: 1000,
} as const;

export const CashWithdrawal = {
  amountMinor: 10_000,
  day: 14,
  memo: 'ATM withdrawal',
} as const;

export const CardPaymentMemo = 'Credit card payment';
