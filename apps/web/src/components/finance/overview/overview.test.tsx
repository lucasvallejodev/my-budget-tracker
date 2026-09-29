import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { cloneElement, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatCompactMoney, formatExchangeRate, formatMoney } from '@coinkeeper/shared/lib/money';

import { currentMonth, monthLabel, QueryKeys, shiftMonth, type Summary } from '../use-finance-data';
import { Overview } from './overview';

vi.mock('@/api/mutations', () => ({
  createAccount: vi.fn(async () => ({})),
  createPayee: vi.fn(async () => ({})),
  createTransaction: vi.fn(async () => ({})),
  createTransfer: vi.fn(async () => ({})),
  updateAccount: vi.fn(async () => ({})),
  updatePayee: vi.fn(async () => ({})),
  updateTransaction: vi.fn(async () => ({})),
  updateTransfer: vi.fn(async () => ({})),
}));

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
const InverseManualRate = 1 / 1.13;

const month = currentMonth();
const previous = shiftMonth(month, -1);

const summary = (forMonth: string, spending: number): Summary => ({
  accounts: [],
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
  converted: null,
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

afterEach(cleanup);

function renderOverview(analytics = false, converted: Summary['converted'] = null) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  client.setQueryData(QueryKeys.summary(month), { ...summary(month, 120000), converted });
  client.setQueryData(QueryKeys.summary(previous), summary(previous, 45000));
  client.setQueryData(QueryKeys.transactions({ limit: '6' }), []);
  client.setQueryData([...QueryKeys.accounts, false], []);
  client.setQueryData(QueryKeys.payees, []);
  client.setQueryData([...QueryKeys.categories, false], []);

  return render(
    <QueryClientProvider client={client}>
      <Overview analytics={analytics} />
    </QueryClientProvider>
  );
}

describe('Overview', () => {
  it('renders per-currency metrics, the review notice and the net worth card', () => {
    renderOverview();
    expect(screen.getByRole('heading', { name: 'Dashboard Overview' })).toBeTruthy();
    expect(screen.getByText('Income · EUR')).toBeTruthy();
    expect(screen.getByText(formatMoney(300000, 'EUR'))).toBeTruthy();
    expect(screen.getByText('Savings rate · EUR')).toBeTruthy();
    expect(screen.getByText('60%')).toBeTruthy();
    expect(screen.getByText(/2 transactions need a category/)).toBeTruthy();
    expect(screen.getByText(formatMoney(480000, 'EUR'))).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Recent Transactions' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New transaction' })).toBeTruthy();
  });

  it('moves to the previous month and shows that month’s summary', () => {
    renderOverview();
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Next month' }).disabled).toBe(
      true
    );
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByRole('group', { name: 'Month' }).textContent).toContain(
      monthLabel(previous)
    );
    expect(screen.getAllByText(formatMoney(45000, 'EUR')).length).toBeGreaterThan(0);
    expect(screen.getByText('85%')).toBeTruthy();
  });

  it('hides the recent transactions panel in analytics mode', () => {
    renderOverview(true);
    expect(screen.getByRole('heading', { name: 'Analytics' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Recent Transactions' })).toBeNull();
  });

  it('labels the cash flow axis in compact currency instead of minor units', () => {
    renderOverview();
    expect(screen.getAllByText(formatCompactMoney(300000, 'EUR')).length).toBeGreaterThan(0);
    expect(screen.queryByText('300000')).toBeNull();
  });

  it('rounds exchange rates derived from an inverse manual rate', () => {
    renderOverview(false, {
      asOf: month,
      currency: 'EUR',
      incomeMinor: 300000,
      missing: [],
      netWorthMinor: 480000,
      rates: [
        {
          currency: 'USD',
          date: '2026-09-01',
          rate: InverseManualRate,
          source: 'manual',
        },
      ],
      spendingMinor: 120000,
    });

    const pageText = document.body.textContent;

    expect(pageText).toContain(
      `1 USD = ${formatExchangeRate(InverseManualRate)} EUR from 2026-09-01`
    );
    expect(pageText).not.toContain(String(InverseManualRate));
  });
});
