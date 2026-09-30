import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { cloneElement, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatMoney } from '@coinkeeper/shared/lib/money';

import { type AccountSummary, QueryKeys } from '../use-finance-data';
import { Analytics, type AnalyticsView } from './analytics';
import { incomeSplit } from './analytics-cash-flow';
import { stackedRows } from './analytics-spending';

const replace = vi.fn();
const push = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace }) }));

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
const Month = '2026-09';

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

const group = (groupName: string, spentMinor: number, month?: string) => ({
  color: '#DC2626',
  currency: 'EUR',
  groupId: groupName,
  groupName,
  spentMinor,
  ...(month ? { month } : {}),
});

function renderAnalytics(view: AnalyticsView) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const range = {
    currency: 'EUR',
    month: Month,
    months: 1,
  };

  const previous = { ...range, month: '2026-08' };

  client.setQueryData(QueryKeys.settings, { primaryCurrency: 'EUR', showConvertedTotals: false });
  client.setQueryData([...QueryKeys.accounts, false], [
    { currency: 'EUR', id: 'card' },
  ] as AccountSummary[]);
  client.setQueryData([...QueryKeys.accounts, true], [
    {
      currency: 'EUR',
      id: 'card',
      type: 'credit_card',
    },
  ] as AccountSummary[]);
  client.setQueryData(QueryKeys.cashFlow(Month, 6), [
    {
      currency: 'EUR',
      incomeMinor: 300000,
      month: '2026-08',
      spendingMinor: 200000,
    },
    {
      currency: 'EUR',
      incomeMinor: 300000,
      month: Month,
      spendingMinor: 150000,
    },
  ]);
  client.setQueryData(QueryKeys.breakdown('group', range), [
    group('Housing', 100000),
    group('Food', 50000),
  ]);
  client.setQueryData(QueryKeys.breakdown('group', previous), [
    group('Housing', 100000),
    group('Food', 90000),
  ]);
  client.setQueryData(QueryKeys.breakdown('groupByMonth', { ...range, months: 6 }), [
    group('Housing', 100000, Month),
    group('Food', 50000, Month),
  ]);
  client.setQueryData(QueryKeys.breakdown('category', range), []);
  client.setQueryData(QueryKeys.breakdown('payee', range), [
    {
      currency: 'EUR',
      id: 'p1',
      name: 'Netflix',
      spentMinor: 1599,
      transactions: 1,
    },
  ]);
  client.setQueryData(QueryKeys.breakdown('account', range), [
    {
      currency: 'EUR',
      id: 'card',
      name: 'Credit card',
      spentMinor: 50000,
      transactions: 9,
    },
  ]);

  return render(
    <QueryClientProvider client={client}>
      <Analytics view={view} params={{ month: Month }} />
    </QueryClientProvider>
  );
}

describe('Analytics', () => {
  it('shows the period figures with a comparison and tabs that keep the filters', () => {
    renderAnalytics('overview');

    expect(screen.getByRole('heading', { level: 1, name: 'Analytics' })).toBeTruthy();
    const tabs = within(screen.getByRole('navigation', { name: 'Analytics sections' }));

    expect(tabs.getByRole('link', { name: 'Spending' }).getAttribute('href')).toBe(
      '/analytics/spending?currency=EUR&month=2026-09'
    );
    expect(tabs.getByRole('link', { name: 'Overview' }).getAttribute('aria-current')).toBe('page');
    expect(
      screen.getAllByText(formatMoney(150000, 'EUR'), { selector: '.stat__value' })
    ).toHaveLength(2);
    expect(screen.getByText('25%', { selector: '.stat__delta' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Biggest changes' })).toBeTruthy();
  });

  it('keeps filter changes in the address', () => {
    renderAnalytics('overview');

    fireEvent.click(screen.getByRole('radio', { name: '3 months' }));

    expect(replace).toHaveBeenCalledWith('/analytics?currency=EUR&month=2026-09&range=3', {
      scroll: false,
    });
  });

  it('breaks spending down by group and opens a group', () => {
    renderAnalytics('spending');

    expect(screen.getByRole('heading', { name: 'Spending by group over time' })).toBeTruthy();

    const housing = screen.getByRole('button', { name: 'Housing' });

    fireEvent.click(housing);

    expect(housing.getAttribute('aria-expanded')).toBe('true');
  });

  it('splits income into where it went', () => {
    renderAnalytics('cash-flow');

    expect(screen.getByRole('heading', { name: 'Where each 100 of income went' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Cash flow per month' })).toBeTruthy();
  });

  it('ranks payees and accounts', () => {
    renderAnalytics('payees');

    expect(screen.getByRole('link', { name: 'Netflix' })).toBeTruthy();
    expect(screen.getByText('Credit card')).toBeTruthy();
  });
});

describe('analytics helpers', () => {
  it('stacks the largest groups per month', () => {
    const { data, series } = stackedRows(
      [
        { ...group('Housing', 100), month: '2026-08' },
        { ...group('Food', 50), month: Month },
      ],
      ['2026-08', Month],
      'EUR'
    );

    expect(series.map(item => item.key)).toEqual(['Housing', 'Food']);
    expect(data[0].Housing).toBe(100);
    expect(data[1].Food).toBe(50);
  });

  it('splits income per 100 and adds what was kept', () => {
    const segments = incomeSplit(
      {
        incomeMinor: 1000,
        keptMinor: 400,
        spendingMinor: 600,
      },
      [group('Housing', 600)],
      'EUR'
    );

    expect(segments.map(segment => [segment.name, segment.perHundred])).toEqual([
      ['Housing', 60],
      ['Kept', 40],
    ]);
    expect(
      incomeSplit(
        {
          incomeMinor: 0,
          keptMinor: 0,
          spendingMinor: 0,
        },
        [],
        'EUR'
      )
    ).toEqual([]);
  });
});
