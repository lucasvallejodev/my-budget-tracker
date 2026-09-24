export const AccountTypeValues = [
  'checking',
  'savings',
  'cash',
  'credit_card',
  'loan',
  'investment',
  'other',
] as const;

export const AccountClassificationValues = ['asset', 'liability'] as const;

export const CategoryKindValues = ['income', 'expense'] as const;

export const TransactionKindValues = ['standard', 'transfer', 'opening'] as const;

export const TransactionStatusValues = ['pending', 'cleared', 'reconciled'] as const;

export const TransactionDirectionValues = ['expense', 'income'] as const;

export type AccountType = (typeof AccountTypeValues)[number];

export type AccountClassification = (typeof AccountClassificationValues)[number];

export type CategoryKind = (typeof CategoryKindValues)[number];

export type TransactionKind = (typeof TransactionKindValues)[number];

export type TransactionStatus = (typeof TransactionStatusValues)[number];
