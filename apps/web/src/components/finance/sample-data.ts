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
  accountCurrency: 'USD',
  accountId: 'demo-account',
  accountName: 'Demo checking',
  categoryId: 'demo-category',
  counterpartAccountId: null,
  counterpartAccountName: null,
  currency: 'USD',
  excluded: false,
  groupId: 'demo-group',
  importId: null,
  kind: 'standard',
  memo: '',
  originalPayee: null,
  payeeId: 'demo-payee',
  transferId: null,
};

const SampleRows = [
  ['Salary Payment', 'Salary', 'Banknote', 'Income', Colors.group.green, 'income'],
  ['Groceries', 'Groceries', 'ShoppingCart', 'Food & Dining', Colors.group.red, 'expense'],
  ['Streaming subscription', 'Streaming', 'Tv', 'Entertainment', Colors.group.purple, 'expense'],
  ['Bank fee', 'Bank fees', 'Landmark', 'Financial', Colors.group.slate, 'expense'],
  ['Coffee', 'Coffee', 'Coffee', 'Food & Dining', Colors.group.red, 'expense'],
  ['Train ticket', 'Public transit', 'BusFront', 'Transportation', Colors.group.orange, 'expense'],
] as const;

const SampleTransactionCount = 18;
const PendingEveryNth = 5;
const ReconciledEveryNth = 7;
const NeedsReviewEveryNth = 7;
const NeedsReviewOffset = 3;
const SampleIncomeMinor = 650000;
const SampleExpenseBaseMinor = 2500;
const SampleExpenseStepMinor = 1400;
const SampleLatestDayOfMonth = 28;
const SampleMonthPrefix = '2026-09';
const DayOfMonthDigits = 2;
const SampleIdDigits = 3;

const sampleStatus = (index: number): 'pending' | 'reconciled' | 'cleared' => {
  if (index % PendingEveryNth === 0) return 'pending';
  if (index % ReconciledEveryNth === 0) return 'reconciled';

  return 'cleared';
};

const sampleAmountMinor = (index: number, isIncome: boolean): number =>
  isIncome ? SampleIncomeMinor : -(SampleExpenseBaseMinor + index * SampleExpenseStepMinor);

const sampleDate = (index: number): string =>
  `${SampleMonthPrefix}-${String(SampleLatestDayOfMonth - index).padStart(DayOfMonthDigits, '0')}`;

const sampleId = (index: number): string =>
  `DEMO-${String(index + 1).padStart(SampleIdDigits, '0')}`;

export const SampleTransactions: TransactionRow[] = Array.from(
  { length: SampleTransactionCount },
  (unused, index) => {
    const rowIndex = index % SampleRows.length;

    const [payeeName, categoryName, categoryIcon, groupName, groupColor, groupKind] =
      SampleRows[rowIndex];

    return {
      ...SampleBase,
      amountMinor: sampleAmountMinor(index, groupKind === 'income'),
      categoryIcon,
      categoryName,
      date: sampleDate(index),
      groupColor,
      groupKind,
      groupName,
      id: sampleId(index),
      needsReview: index % NeedsReviewEveryNth === NeedsReviewOffset,
      payeeName,
      status: sampleStatus(index),
    };
  }
);

export const SampleCashFlow = [
  {
    expense: 3000,
    income: 4500,
    label: 'Jan',
  },
  {
    expense: 3500,
    income: 5200,
    label: 'Feb',
  },
  {
    expense: 4100,
    income: 4800,
    label: 'Mar',
  },
  {
    expense: 4500,
    income: 7000,
    label: 'Apr',
  },
  {
    expense: 3500,
    income: 4600,
    label: 'May',
  },
  {
    expense: 4000,
    income: 5900,
    label: 'Jun',
  },
  {
    expense: 3800,
    income: 5600,
    label: 'Jul',
  },
  {
    expense: 3200,
    income: 5100,
    label: 'Aug',
  },
];

export const SampleExpenses = [
  { name: 'Rent', value: 750 },
  { name: 'Food', value: 980 },
  { name: 'Bills', value: 557 },
  { name: 'Transportation', value: 264 },
  { name: 'Entertainment', value: 154 },
];

export const SampleCards = [
  {
    expires: '12/28',
    id: 'sample-1',
    lastFour: '2588',
    name: 'Alex Morgan',
  },
  {
    expires: '04/29',
    id: 'sample-2',
    lastFour: '9412',
    name: 'Alex Morgan',
    network: 'Mastercard',
  },
];
