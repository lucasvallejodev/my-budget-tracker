import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type AccountSummary, QueryKeys } from '../use-finance-data';
import { AccountsOverview } from './accounts-overview';

vi.mock('@/components/finance/create-account-dialog', () => ({ CreateAccountDialog: () => null }));

afterEach(cleanup);

const account = (overrides: Partial<AccountSummary>): AccountSummary =>
  ({
    archivedAt: null,
    balanceMinor: 12000,
    classification: 'asset',
    currency: 'EUR',
    id: 'checking',
    institution: 'Bank',
    name: 'Checking',
    type: 'checking',
    ...overrides,
  }) as AccountSummary;

describe('AccountsOverview', () => {
  it('groups accounts and marks liabilities as owed', () => {
    const client = new QueryClient();

    client.setQueryData(
      [...QueryKeys.accounts, false],
      [
        account({}),
        account({
          classification: 'liability',
          id: 'visa',
          name: 'Visa',
          type: 'credit_card',
        }),
      ]
    );
    render(
      <QueryClientProvider client={client}>
        <AccountsOverview />
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { name: 'Checking' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Visa' })).toBeTruthy();
    expect(screen.getByText('owed')).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'View' })[0].getAttribute('href')).toBe(
      '/accounts/checking'
    );
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
});
