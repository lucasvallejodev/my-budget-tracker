import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SampleTransactions } from '../sample-data';
import { QueryKeys } from '../use-finance-data';
import { TransactionsPage } from './transactions-page';

vi.mock('../transaction-dialog', () => ({ TransactionDialog: () => null }));

afterEach(cleanup);

describe('TransactionsPage', () => {
  it('shows every month when started from a search and filters by the search text', () => {
    const client = new QueryClient();

    client.setQueryData(
      QueryKeys.transactions({ limit: '2000', month: undefined }),
      SampleTransactions
    );
    render(
      <QueryClientProvider client={client}>
        <TransactionsPage initialSearch="Salary" />
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Transactions' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Filter by month' })).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>('Search').value).toBe('Salary');
  });

  it('opens on the month and search given by a link', () => {
    const client = new QueryClient();

    client.setQueryData(QueryKeys.transactions({ limit: '2000', month: '2026-08' }), []);
    render(
      <QueryClientProvider client={client}>
        <TransactionsPage initialSearch="Groceries" initialMonth="2026-08" />
      </QueryClientProvider>
    );

    expect(screen.getByRole('button', { name: 'All months' })).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>('Search').value).toBe('Groceries');
  });
});
