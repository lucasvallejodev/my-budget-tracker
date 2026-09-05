import { Transaction } from '../transaction-table';
export const sampleTransactions: Transaction[] = Array.from({ length: 18 }, (_, i) => ({
  id: `DEMO-${String(i + 1).padStart(3, '0')}`,
  description: [
    'Salary Payment',
    'Groceries',
    'Streaming subscription',
    'Transfer',
    'Coffee',
    'Train ticket',
  ][i % 6],
  category: ['Income', 'Food', 'Subscription', 'Bank', 'Food', 'Transport'][i % 6],
  type: i % 6 === 0 ? 'INCOME' : 'EXPENSE',
  amount: i % 6 === 0 ? 6500 : 25 + i * 14,
  date: `2026-09-${String(28 - i).padStart(2, '0')}`,
  status: i % 5 === 0 ? 'Pending' : i % 7 === 0 ? 'Failed' : 'Completed',
}));
export const sampleCashFlow = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map(
  (label, i) => ({
    label,
    income: [4500, 5200, 4800, 7000, 4600, 5900, 5600, 5100][i],
    expense: [3000, 3500, 4100, 4500, 3500, 4000, 3800, 3200][i],
  })
);
export const sampleExpenses = [
  { name: 'Rent', value: 750 },
  { name: 'Food', value: 980 },
  { name: 'Bills', value: 557 },
  { name: 'Transportation', value: 264 },
  { name: 'Entertainment', value: 154 },
];
export const sampleCards = [
  { id: 'sample-1', name: 'Alex Morgan', lastFour: '2588', expires: '12/28' },
  {
    id: 'sample-2',
    name: 'Alex Morgan',
    lastFour: '9412',
    expires: '04/29',
    network: 'Mastercard',
  },
];
