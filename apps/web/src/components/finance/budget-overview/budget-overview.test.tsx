import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatMoney } from '@coinkeeper/shared/lib/money';
import { calendarPeriod } from '@coinkeeper/shared/lib/periods';

import { type BudgetRow, type CategorySlice, currentMonth, QueryKeys } from '../use-finance-data';
import { BudgetOverview } from './budget-overview';

vi.hoisted(() => {
  vi.useFakeTimers({ now: new Date(2026, 8, 25, 12), toFake: ['Date'] });
});

const MutationContextArgument = expect.anything();

vi.mock('@/api/mutations', () => ({
  copyBudgets: vi.fn(async () => ({ copied: 2 })),
  deleteBudget: vi.fn(async () => {}),
  upsertBudget: vi.fn(async () => ({})),
}));

vi.mock('recharts', async importOriginal => ({
  ...(await importOriginal<typeof import('recharts')>()),
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const month = currentMonth();

const rows: BudgetRow[] = [
  {
    amountMinor: 40000,
    billsDueMinor: 0,
    categoryId: 'c-groceries',
    categoryName: 'Groceries',
    color: '#DC2626',
    currency: 'EUR',
    deletedAt: null,
    fixedSpentMinor: 0,
    groupId: 'g-food',
    groupName: 'Food & Dining',
    icon: 'ShoppingCart',
    id: 'b-groceries',
    month,
    periodFrom: calendarPeriod(month).from,
    periodTo: calendarPeriod(month).to,
    spentMinor: 12000,
  },
  {
    amountMinor: 5000,
    billsDueMinor: 0,
    categoryId: 'c-coffee',
    categoryName: 'Coffee',
    color: '#DC2626',
    currency: 'EUR',
    deletedAt: null,
    fixedSpentMinor: 0,
    groupId: 'g-food',
    groupName: 'Food & Dining',
    icon: 'Coffee',
    id: 'b-coffee',
    month,
    periodFrom: calendarPeriod(month).from,
    periodTo: calendarPeriod(month).to,
    spentMinor: 6500,
  },
];

afterEach(cleanup);

function renderBudgets(data: BudgetRow[] = rows, breakdown: CategorySlice[] = []) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  client.setQueryData(['budgets', month], data);
  client.setQueryData([...QueryKeys.accounts, false], []);
  client.setQueryData(QueryKeys.settings, { primaryCurrency: 'EUR', showConvertedTotals: false });
  client.setQueryData([...QueryKeys.categories, false], []);
  client.setQueryData(QueryKeys.categoryBreakdown(month, 'EUR'), breakdown);
  client.setQueryData(QueryKeys.budgetSuggestions(month), [
    {
      amountMinor: 4100,
      billsDueMinor: 0,
      categoryId: 'c-groceries',
      currency: 'EUR',
      months: 3,
    },
  ]);

  return render(
    <QueryClientProvider client={client}>
      <BudgetOverview />
    </QueryClientProvider>
  );
}

const openMenu = (name: string) =>
  fireEvent.pointerDown(screen.getByRole('button', { name: `Actions for the ${name} budget` }), {
    button: 0,
    ctrlKey: false,
  });

describe('BudgetOverview', () => {
  it('leads with the month summary and groups budgets by status', () => {
    renderBudgets();
    expect(screen.getByRole('heading', { name: 'Budgets' })).toBeTruthy();
    expect(screen.getByText(/Left to spend in/)).toBeTruthy();
    expect(screen.getAllByText(formatMoney(45000, 'EUR')).length).toBeGreaterThan(0);
    expect(screen.getByRole('region', { name: 'Over budget' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'On track' })).toBeTruthy();
    expect(screen.getByText(`${formatMoney(1500, 'EUR')} over`)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Groceries' })).toBeTruthy();
  });

  it('shows the daily allowance for the current month', () => {
    renderBudgets();
    expect(screen.getByText(/a day for 6 days/)).toBeTruthy();
  });

  it('reorders budgets alphabetically', () => {
    renderBudgets();
    fireEvent.click(screen.getByRole('radio', { name: 'A–Z' }));

    const links = screen.getAllByRole('link').map(link => link.textContent);

    expect(links.indexOf('Coffee')).toBeLessThan(links.indexOf('Groceries'));
  });

  it('offers the average of recent months as the limit', () => {
    renderBudgets();
    openMenu('Groceries');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit budget' }));
    expect(
      screen.getByText(
        `You spent about ${formatMoney(4100, 'EUR')} a month over the last 3 months.`
      )
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: `Use ${formatMoney(4100, 'EUR')}` }));
    expect(screen.getByDisplayValue('41.00')).toBeTruthy();
  });

  it('lists spending without a budget with a suggested limit', () => {
    renderBudgets(rows, [
      {
        categoryId: 'c-rent',
        categoryName: 'Rent',
        color: '#7C3AED',
        groupId: 'g-home',
        groupName: 'Housing',
        icon: 'House',
        spentMinor: 120000,
      },
    ]);
    expect(screen.getByRole('heading', { name: 'Spending without a budget' })).toBeTruthy();
    expect(
      screen.getByRole('button', {
        name: `Add a ${formatMoney(120000, 'EUR')} budget for Rent`,
      })
    ).toBeTruthy();
  });

  it('shows an empty state when the month has no budgets', () => {
    renderBudgets([]);
    expect(screen.getByRole('heading', { name: /No EUR budgets for/ })).toBeTruthy();
  });

  it('confirms before deleting a budget and calls the action', async () => {
    const actions = await import('@/api/mutations');

    renderBudgets();
    openMenu('Groceries');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete budget' }));
    expect(screen.getByRole('dialog', { name: 'Delete the Groceries budget?' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Delete budget' }));
    await vi.waitFor(() =>
      expect(actions.deleteBudget).toHaveBeenCalledWith('b-groceries', MutationContextArgument)
    );
  });

  it('copies last month’s budgets for the selected month', async () => {
    const actions = await import('@/api/mutations');

    renderBudgets();
    fireEvent.click(screen.getByRole('button', { name: 'Copy last month' }));
    await vi.waitFor(() => expect(actions.copyBudgets).toHaveBeenCalledWith(month));
  });
});
