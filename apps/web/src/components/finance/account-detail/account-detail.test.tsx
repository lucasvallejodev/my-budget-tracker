import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatMoney } from '@coinkeeper/shared/lib/money';

import { type AccountSummary, QueryKeys } from '../use-finance-data';
import { AccountDetail } from './account-detail';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock('@/app/(main)/actions', () => ({
  archiveAccountAction: vi.fn(async () => {}),
  createAccountAction: vi.fn(async () => ({})),
  createPayeeAction: vi.fn(async () => ({})),
  createTransactionAction: vi.fn(async () => ({})),
  createTransferAction: vi.fn(async () => ({})),
  updateAccountAction: vi.fn(async () => ({})),
  updatePayeeAction: vi.fn(async () => ({})),
  updateTransactionAction: vi.fn(async () => ({})),
  updateTransferAction: vi.fn(async () => ({})),
}));

const base: AccountSummary = {
  accountNumber: '12345678',
  archivedAt: null,
  balanceMinor: 250000,
  classification: 'asset',
  color: null,
  countsInSpending: true,
  currency: 'EUR',
  deletedAt: null,
  icon: null,
  id: 'a-checking',
  institution: 'Example Bank',
  name: 'Main checking',
  notes: 'Salary lands here.',
  transactionCount: 3,
  type: 'checking',
};

const accounts: AccountSummary[] = [
  base,
  {
    ...base,
    accountNumber: null,
    balanceMinor: -45000,
    classification: 'liability',
    id: 'a-card',
    institution: null,
    name: 'Travel card',
    notes: null,
    transactionCount: 1,
    type: 'credit_card',
  },
];

afterEach(() => {
  cleanup();
  push.mockClear();
});

function renderDetail(accountId: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  client.setQueryData([...QueryKeys.accounts, true], accounts);
  client.setQueryData([...QueryKeys.accounts, false], accounts);
  client.setQueryData(QueryKeys.transactions({ accountId, limit: '2000' }), []);
  client.setQueryData(QueryKeys.payees, []);
  client.setQueryData([...QueryKeys.categories, false], []);
  client.setQueryData(QueryKeys.currencies, []);
  client.setQueryData(QueryKeys.settings, { primaryCurrency: 'EUR', showConvertedTotals: false });

  return render(
    <QueryClientProvider client={client}>
      <AccountDetail accountId={accountId} />
    </QueryClientProvider>
  );
}

describe('AccountDetail', () => {
  it('renders an asset account with its balance, details and notes', () => {
    renderDetail('a-checking');
    expect(screen.getByRole('heading', { name: 'Main checking' })).toBeTruthy();
    expect(screen.getByText('Example Bank · EUR')).toBeTruthy();
    expect(screen.getByText('Balance')).toBeTruthy();
    expect(screen.getByText(formatMoney(250000, 'EUR'))).toBeTruthy();
    expect(screen.getByText('3 transactions')).toBeTruthy();
    expect(screen.getByText('Account ending in 5678')).toBeTruthy();
    expect(screen.getByText('Salary lands here.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Pay card' })).toBeNull();
  });

  it('shows the amount owed and a pay button for a liability', () => {
    renderDetail('a-card');
    expect(screen.getByText('Amount owed')).toBeTruthy();
    expect(screen.getAllByText(formatMoney(45000, 'EUR')).length).toBeGreaterThan(0);
    expect(screen.getByText('Credit card · EUR')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Pay card' })).toBeTruthy();
    expect(screen.getByText(/Liability: spending on this account/)).toBeTruthy();
  });

  it('archives the account and navigates back to the list', async () => {
    const actions = await import('@/app/(main)/actions');

    renderDetail('a-checking');
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    await vi.waitFor(() =>
      expect(actions.archiveAccountAction).toHaveBeenCalledWith('a-checking', true)
    );
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/accounts'));
  });

  it('shows a not-found state for an unknown account', () => {
    renderDetail('missing');
    expect(screen.getByRole('heading', { name: 'Account not found' })).toBeTruthy();
  });
});
