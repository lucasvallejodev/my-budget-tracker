import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { cloneElement, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatMoney } from '@coinkeeper/shared/lib/money';

import {
  type AccountSummary,
  type BalancePoint,
  QueryKeys,
  type Summary,
} from '../use-finance-data';
import { AccountsOverview } from './accounts-overview';

vi.hoisted(() => {
  vi.useFakeTimers({ now: new Date(2026, 8, 20, 12), toFake: ['Date'] });
});

vi.mock('@/api/mutations', () => ({ setAccountArchived: vi.fn() }));
vi.mock('@/components/finance/create-account-dialog', () => ({ CreateAccountDialog: () => null }));
vi.mock('@/components/finance/transaction-dialog', () => ({ TransactionDialog: () => null }));

vi.mock('recharts', async importOriginal => ({
  ...(await importOriginal<typeof import('recharts')>()),
  ResponsiveContainer: ({
    children,
  }: {
    children: ReactElement<{ height: number; width: number }>;
  }) => cloneElement(children, { height: ChartHeight, width: ChartWidth }),
}));

const ChartWidth = 600;
const ChartHeight = 200;
const BalanceHistoryMonths = 13;

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const account = (overrides: Partial<AccountSummary>): AccountSummary =>
  ({
    accountNumber: null,
    archivedAt: null,
    balanceMinor: 10000,
    classification: 'asset',
    currency: 'EUR',
    id: 'checking',
    institution: 'Northbank',
    name: 'Everyday',
    type: 'checking',
    ...overrides,
  }) as AccountSummary;

const accounts = [
  account({ accountNumber: 'DE004821' }),
  account({
    balanceMinor: 7000,
    currency: 'USD',
    id: 'usd',
    name: 'Dollars',
  }),
  account({
    balanceMinor: -3000,
    classification: 'liability',
    id: 'card',
    name: 'Visa',
    type: 'credit_card',
  }),
];

const point = (
  accountId: string,
  month: string,
  balanceMinor: number,
  currency = 'EUR'
): BalancePoint => ({
  accountId,
  balanceMinor,
  currency,
  month,
});

const balances = [
  point('checking', '2026-07', 6000),
  point('checking', '2026-08', 8000),
  point('checking', '2026-09', 10000),
  point('card', '2026-08', -1000),
  point('card', '2026-09', -3000),
  point('usd', '2026-09', 7000, 'USD'),
];

const summary = {
  accounts,
  converted: {
    asOf: '2026-09-01',
    currency: 'EUR',
    netWorthMinor: 13300,
    rates: [
      {
        currency: 'USD',
        date: '2026-09-01',
        rate: 0.9,
      },
    ],
  },
  netWorth: [],
} as unknown as Summary;

const renderOverview = (data: AccountSummary[] = accounts) => {
  const client = new QueryClient();

  client.setQueryData([...QueryKeys.accounts, false], data);
  client.setQueryData(QueryKeys.balances(BalanceHistoryMonths), balances);
  client.setQueryData(QueryKeys.summary(), summary);
  client.setQueryData(QueryKeys.settings, { primaryCurrency: 'EUR' });
  client.setQueryData(QueryKeys.projections('2026-09-20', 30), [
    {
      accountId: 'checking',
      balanceMinor: 10000,
      currency: 'EUR',
      lowestMinor: -5000,
      lowestOn: '2026-10-01',
      projectedMinor: 40000,
      scheduledCount: 2,
      until: '2026-10-20',
    },
    {
      accountId: 'usd',
      balanceMinor: 7000,
      currency: 'USD',
      lowestMinor: 7000,
      lowestOn: null,
      projectedMinor: 7000,
      scheduledCount: 0,
      until: '2026-10-20',
    },
  ]);

  render(
    <QueryClientProvider client={client}>
      <AccountsOverview />
    </QueryClientProvider>
  );
};

const euros = (amountMinor: number) => formatMoney(amountMinor, 'EUR');

describe('AccountsOverview', () => {
  it('groups accounts with totals per currency and marks liabilities as owed', () => {
    renderOverview();

    expect(
      screen.getByText('3 accounts in 2 currencies. Balances come from your ledger.')
    ).toBeTruthy();

    const cash = screen.getByRole('heading', { name: 'Cash & checking' }).closest('section')!;

    expect(within(cash).getAllByText(euros(10000))).toHaveLength(2);
    expect(within(cash).getAllByText(formatMoney(7000, 'USD'))).toHaveLength(2);
    expect(within(cash).getByText(/this month/).textContent).toContain(`+${euros(2000)}`);
    expect(within(cash).getByText('Northbank · EUR · •••• 4821')).toBeTruthy();

    const cards = screen.getByRole('heading', { name: 'Credit cards' }).closest('section')!;

    expect(within(cards).getAllByText('owed')).toHaveLength(2);
    expect(within(cards).getByRole('button', { name: 'Pay card' })).toBeTruthy();
  });

  it('opens an account from its whole row', () => {
    renderOverview();

    expect(screen.getByRole('link', { name: /^Everyday/ }).getAttribute('href')).toBe(
      '/accounts/checking'
    );

    expect(screen.queryByRole('link', { name: 'View' })).toBeNull();
  });

  it('collapses a group', () => {
    renderOverview();

    const toggle = screen.getByRole('button', { name: 'Credit cards' });

    fireEvent.click(toggle);

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('switches the net worth range', () => {
    renderOverview();

    expect(
      screen.getByRole('img', { name: 'Net worth in EUR over the last 2 months' })
    ).toBeTruthy();
    expect(screen.getByText(`${euros(1000)} (17%)`)).toBeTruthy();

    fireEvent.click(screen.getByRole('radio', { name: '1M' }));

    expect(
      screen.getByRole('img', { name: 'Net worth in EUR over the last 1 month' })
    ).toBeTruthy();
    expect(screen.getByText('No change in 1 month')).toBeTruthy();
  });

  it('summarizes assets and liabilities by type', () => {
    renderOverview();

    expect(screen.getByRole('img', { name: 'Assets by type: Checking 100%' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Liabilities by type: Credit card 100%' })).toBeTruthy();

    fireEvent.click(screen.getByRole('radio', { name: 'Percent' }));

    expect(screen.getAllByText('100%')).toHaveLength(2);
  });

  it('shows the converted total with its rates', () => {
    renderOverview();

    expect(screen.getByText('≈ All in EUR')).toBeTruthy();
    expect(screen.getByText(euros(13300))).toBeTruthy();
    expect(screen.getByText(/Approximate, using your manual rates as of 2026-09-01/)).toBeTruthy();
  });

  it('offers to show archived accounts', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AccountsOverview />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show archived' }));

    expect(screen.getByRole('button', { name: 'Hide archived' })).toBeTruthy();
  });

  it('projects the balances of accounts with payments still due and warns before zero', () => {
    renderOverview();

    const projected = screen.getByText('Next 30 days').closest('section')!;

    expect(
      within(projected).getByText(`${euros(10000)} now → ${euros(40000)} by 20 Oct · 2 payments`)
    ).toBeTruthy();
    expect(within(projected).getByText('Below zero on 1 Oct')).toBeTruthy();
    expect(within(projected).queryByText('Dollars')).toBeNull();
  });
});
