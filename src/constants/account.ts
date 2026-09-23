export const AccountTypes = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit card' },
  { value: 'loan', label: 'Loan' },
  { value: 'investment', label: 'Investment' },
  { value: 'other', label: 'Other' },
] as const;

export type AccountTypeValue = (typeof AccountTypes)[number]['value'];

export const accountTypeLabel = (value: string): string =>
  AccountTypes.find(type => type.value === value)?.label ?? value;

export const AccountGroups: { label: string; types: AccountTypeValue[] }[] = [
  { label: 'Cash', types: ['checking', 'cash'] },
  { label: 'Savings & investments', types: ['savings', 'investment'] },
  { label: 'Credit cards', types: ['credit_card'] },
  { label: 'Loans', types: ['loan'] },
  { label: 'Other', types: ['other'] },
];
