import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatMoney } from '@coinkeeper/shared/lib/money';

import { type BudgetRow, currentMonth, QueryKeys } from '../use-finance-data';
import { BudgetOverview } from './budget-overview';

const MutationContextArgument = expect.anything();

vi.mock('@/app/(main)/actions', () => ({
  copyBudgetsAction: vi.fn(async () => ({ copied: 2 })),
  deleteBudgetAction: vi.fn(async () => {}),
  upsertBudgetAction: vi.fn(async () => ({})),
}));

vi.mock('recharts', async importOriginal => ({
  ...(await importOriginal<typeof import('recharts')>()),
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const month = currentMonth();

const rows: BudgetRow[] = [
  {
    amountMinor: 40000,
    categoryId: 'c-groceries',
    categoryName: 'Groceries',
    color: '#DC2626',
    currency: 'EUR',
    deletedAt: null,
    groupId: 'g-food',
    groupName: 'Food & Dining',
    icon: 'ShoppingCart',
    id: 'b-groceries',
    month,
    spentMinor: 12000,
  },
  {
    amountMinor: 5000,
    categoryId: 'c-coffee',
    categoryName: 'Coffee',
    color: '#DC2626',
    currency: 'EUR',
    deletedAt: null,
    groupId: 'g-food',
    groupName: 'Food & Dining',
    icon: 'Coffee',
    id: 'b-coffee',
    month,
    spentMinor: 6500,
  },
];

afterEach(cleanup);

function renderBudgets(data: BudgetRow[] = rows) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  client.setQueryData(['budgets', month], data);
  client.setQueryData([...QueryKeys.accounts, false], []);
  client.setQueryData(QueryKeys.settings, { primaryCurrency: 'EUR', showConvertedTotals: false });
  client.setQueryData([...QueryKeys.categories, false], []);

  return render(
    <QueryClientProvider client={client}>
      <BudgetOverview />
    </QueryClientProvider>
  );
}

describe('BudgetOverview', () => {
  it('renders one budget per category with totals and status badges', () => {
    renderBudgets();
    expect(screen.getByRole('heading', { name: 'Budgets' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Groceries' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Coffee' })).toBeTruthy();
    expect(screen.getByText('Total budget · EUR')).toBeTruthy();
    expect(screen.getByText(formatMoney(45000, 'EUR'))).toBeTruthy();
    expect(screen.getByText('On track')).toBeTruthy();
    expect(screen.getByText('Exceeded')).toBeTruthy();
    expect(screen.getByText('1 of 2 categories are within limits')).toBeTruthy();
    expect(
      screen.getByText(`Coffee exceeded its budget by ${formatMoney(1500, 'EUR')}`)
    ).toBeTruthy();
  });

  it('shows an empty state when the month has no budgets', () => {
    renderBudgets([]);
    expect(screen.getByRole('heading', { name: /No budgets for/ })).toBeTruthy();
  });

  it('confirms before deleting a budget and calls the action', async () => {
    const actions = await import('@/app/(main)/actions');

    renderBudgets();
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    expect(screen.getByRole('dialog', { name: 'Delete the Groceries budget?' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Delete budget' }));
    await vi.waitFor(() =>
      expect(actions.deleteBudgetAction).toHaveBeenCalledWith(
        'b-groceries',
        MutationContextArgument
      )
    );
  });

  it('copies last month’s budgets for the selected month', async () => {
    const actions = await import('@/app/(main)/actions');

    renderBudgets();
    fireEvent.click(screen.getByRole('button', { name: 'Copy last month' }));
    await vi.waitFor(() => expect(actions.copyBudgetsAction).toHaveBeenCalledWith(month));
  });
});
