import { Colors } from '@/styles/theme';
import { TransactionRow } from './use-finance-data';

const SampleBase: Omit<
  TransactionRow,
  | 'id'
  | 'payeeName'
  | 'categoryName'
  | 'categoryIcon'
  | 'groupName'
  | 'groupColor'
  | 'groupKind'
  | 'amountMinor'
  | 'date'
  | 'status'
  | 'needsReview'
> = {
  accountId: 'demo-account',
  accountName: 'Demo checking',
  accountCurrency: 'USD',
  categoryId: 'demo-category',
  groupId: 'demo-group',
  payeeId: 'demo-payee',
  currency: 'USD',
  kind: 'standard',
  transferId: null,
  counterpartAccountId: null,
  counterpartAccountName: null,
  excluded: false,
  memo: '',
  importId: null,
  originalPayee: null,
};

const SampleRows = [
  ['Salary Payment', 'Salary', 'Banknote', 'Income', Colors.group.green, 'income'],
  ['Groceries', 'Groceries', 'ShoppingCart', 'Food & Dining', Colors.group.red, 'expense'],
  ['Streaming subscription', 'Streaming', 'Tv', 'Entertainment', Colors.group.purple, 'expense'],
  ['Bank fee', 'Bank fees', 'Landmark', 'Financial', Colors.group.slate, 'expense'],
  ['Coffee', 'Coffee', 'Coffee', 'Food & Dining', Colors.group.red, 'expense'],
  ['Train ticket', 'Public transit', 'BusFront', 'Transportation', Colors.group.orange, 'expense'],
] as const;

export const SampleTransactions: TransactionRow[] = Array.from({ length: 18 }, (_, i) => {
  const [payeeName, categoryName, categoryIcon, groupName, groupColor, groupKind] =
    SampleRows[i % 6];

  return {
    ...SampleBase,
    id: `DEMO-${String(i + 1).padStart(3, '0')}`,
    payeeName,
    categoryName,
    categoryIcon,
    groupName,
    groupColor,
    groupKind,
    amountMinor: i % 6 === 0 ? 650000 : -(2500 + i * 1400),
    date: `2026-09-${String(28 - i).padStart(2, '0')}`,
    status: i % 5 === 0 ? 'pending' : i % 7 === 0 ? 'reconciled' : 'cleared',
    needsReview: i % 7 === 3,
  };
});
export const SampleCashFlow = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map(
  (label, i) => ({
    label,
    income: [4500, 5200, 4800, 7000, 4600, 5900, 5600, 5100][i],
    expense: [3000, 3500, 4100, 4500, 3500, 4000, 3800, 3200][i],
  })
);
export const SampleExpenses = [
  { name: 'Rent', value: 750 },
  { name: 'Food', value: 980 },
  { name: 'Bills', value: 557 },
  { name: 'Transportation', value: 264 },
  { name: 'Entertainment', value: 154 },
];
export const SampleCards = [
  {
    id: 'sample-1',
    name: 'Alex Morgan',
    lastFour: '2588',
    expires: '12/28',
  },
  {
    id: 'sample-2',
    name: 'Alex Morgan',
    lastFour: '9412',
    expires: '04/29',
    network: 'Mastercard',
  },
];
