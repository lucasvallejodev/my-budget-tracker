export const AccountTypes = [
  { label: 'Checking', value: 'checking' },
  { label: 'Savings', value: 'savings' },
  { label: 'Cash', value: 'cash' },
  { label: 'Credit card', value: 'credit_card' },
  { label: 'Loan', value: 'loan' },
  { label: 'Investment', value: 'investment' },
  { label: 'Other', value: 'other' },
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
