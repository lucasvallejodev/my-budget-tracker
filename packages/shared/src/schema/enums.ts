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

export const RecurringKindValues = ['bill', 'subscription', 'income', 'other'] as const;

export const RecurringCadenceValues = ['weekly', 'monthly', 'yearly'] as const;

export const RecurringRecordModeValues = ['match_only', 'create_pending'] as const;

export const RecurringSourceValues = ['manual', 'detected'] as const;

export const RecurringStatusValues = ['active', 'paused', 'ended'] as const;

export type AccountType = (typeof AccountTypeValues)[number];

export type AccountClassification = (typeof AccountClassificationValues)[number];

export type CategoryKind = (typeof CategoryKindValues)[number];

export type TransactionKind = (typeof TransactionKindValues)[number];

export type TransactionStatus = (typeof TransactionStatusValues)[number];

export type TransactionDirection = (typeof TransactionDirectionValues)[number];

export type RecurringKind = (typeof RecurringKindValues)[number];

export type RecurringCadence = (typeof RecurringCadenceValues)[number];

export type RecurringRecordMode = (typeof RecurringRecordModeValues)[number];

export type RecurringSource = (typeof RecurringSourceValues)[number];

export type RecurringStatus = (typeof RecurringStatusValues)[number];
