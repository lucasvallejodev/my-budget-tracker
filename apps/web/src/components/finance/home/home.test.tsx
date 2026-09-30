import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { cloneElement, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatMoney } from '@coinkeeper/shared/lib/money';

import { compareWith } from '../comparisons';
import {
  type AccountSummary,
  type BudgetRow,
  currentMonth,
  QueryKeys,
  shiftMonth,
  type Summary,
} from '../use-finance-data';
import { Home } from './home';

vi.hoisted(() => {
  vi.useFakeTimers({ now: new Date(2026, 8, 20, 12), toFake: ['Date'] });
});

vi.mock('@/api/mutations', () => ({ categorizeTransaction: vi.fn() }));

vi.mock('recharts', async importOriginal => ({
  ...(await importOriginal<typeof import('recharts')>()),
  ResponsiveContainer: ({
    children,
  }: {
    children: ReactElement<{ height: number; width: number }>;
  }) => cloneElement(children, { height: ChartHeight, width: ChartWidth }),
}));

const ChartWidth = 600;
const ChartHeight = 300;

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const month = currentMonth();
const previous = shiftMonth(month, -1);

const account = { currency: 'EUR', id: 'checking' } as AccountSummary;

const summary = (
  forMonth: string,
  spending: number,
  converted: Summary['converted'] = null
): Summary => ({
  accounts: [account],
  breakdown: [
    {
      color: '#DC2626',
      currency: 'EUR',
      groupId: 'g1',
      groupName: 'Food & Dining',
      spentMinor: spending,
    },
  ],
  cashFlow: [
    {
      currency: 'EUR',
      incomeMinor: 300000,
      month: forMonth,
      spendingMinor: spending,
    },
  ],
  converted,
  month: forMonth,
  needsReviewCount: 2,
  netWorth: [
    {
      assetsMinor: 500000,
      currency: 'EUR',
      liabilitiesMinor: -20000,
      netMinor: 480000,
    },
  ],
  totals: [
    {
      currency: 'EUR',
      incomeMinor: 300000,
      spendingMinor: spending,
    },
  ],
});

const budget = {
  amountMinor: 30000,
  categoryId: 'c-groceries',
  categoryName: 'Groceries',
  color: '#DC2626',
  currency: 'EUR',
  groupName: 'Food & Dining',
  icon: 'ShoppingCart',
  id: 'b1',
  month: `${month}-01`,
  spentMinor: 31000,
} as BudgetRow;

function renderHome(converted: Summary['converted'] = null) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  client.setQueryData(QueryKeys.summary(month), summary(month, 120000, converted));
  client.setQueryData(QueryKeys.summary(previous), summary(previous, 150000));
  client.setQueryData(QueryKeys.budgets(month), [budget]);
  client.setQueryData(QueryKeys.balances(6, month), [
    {
      accountId: 'checking',
      balanceMinor: 450000,
      currency: 'EUR',
      month: previous,
    },
    {
      accountId: 'checking',
      balanceMinor: 480000,
      currency: 'EUR',
      month,
    },
  ]);
  client.setQueryData(QueryKeys.settings, {
    primaryCurrency: 'EUR',
    showConvertedTotals: !!converted,
  });
  client.setQueryData(
    QueryKeys.transactions({
      currency: 'EUR',
      limit: '6',
      month,
    }),
    []
  );

  return render(
    <QueryClientProvider client={client}>
      <Home />
    </QueryClientProvider>
  );
}

describe('Home', () => {
  it('leads with what is left to spend and compares the month with the last one', () => {
    renderHome();

    expect(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeTruthy();
    expect(screen.getByText(/Left to spend in/)).toBeTruthy();
    expect(screen.getByText(`of ${formatMoney(30000, 'EUR')} budgeted`)).toBeTruthy();
    expect(screen.getByText('20%', { selector: '.stat__delta' })).toBeTruthy();
    expect(screen.getByText(formatMoney(180000, 'EUR'))).toBeTruthy();
  });

  it('shows net worth with its change and what needs attention', () => {
    renderHome();

    expect(screen.getByText(formatMoney(480000, 'EUR'))).toBeTruthy();
    expect(screen.getByText(formatMoney(30000, 'EUR'), { selector: '.stat__delta' })).toBeTruthy();
    expect(screen.getByRole('link', { name: '2 transactions need a category' })).toBeTruthy();
    expect(
      screen.getByRole('link', { name: `Groceries is ${formatMoney(1000, 'EUR')} over budget` })
    ).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Budgets to watch' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Where your money went' })).toBeTruthy();
  });

  it('switches to the approximate converted view', () => {
    renderHome({
      asOf: '2026-09-19',
      currency: 'EUR',
      incomeMinor: 330000,
      missing: [],
      netWorthMinor: 500000,
      rates: [],
      spendingMinor: 130000,
    });

    fireEvent.click(screen.getByRole('radio', { name: '≈ All in EUR' }));

    expect(screen.getByRole('heading', { name: '≈ All in EUR' })).toBeTruthy();
    expect(screen.getByText(/Approximate, using your manual rates/)).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Where your money went' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'See EUR in detail' }));

    expect(screen.getByRole('heading', { name: 'Where your money went' })).toBeTruthy();
  });
});

describe('home figures', () => {
  it('describes a change against last month by whether it is good', () => {
    expect(compareWith(120, 150, 'August', false)).toEqual({
      delta: {
        good: true,
        label: '20%',
        rising: false,
      },
      meta: 'vs August',
    });
    expect(compareWith(100, 100, 'August', true)).toEqual({ meta: 'Same as August' });
    expect(compareWith(100, 0, 'August', true)).toEqual({ meta: 'Nothing in August' });
  });
});
