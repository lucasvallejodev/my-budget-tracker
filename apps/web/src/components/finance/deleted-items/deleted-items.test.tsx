import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SampleTransactions } from '../sample-data';
import { QueryKeys } from '../use-finance-data';
import { DeletedItems } from './deleted-items';

vi.mock('@/api/mutations', () => ({
  restoreAccount: vi.fn(async () => ({})),
  restoreExchangeRate: vi.fn(async () => ({})),
  restoreRule: vi.fn(async () => ({})),
  restoreTransaction: vi.fn(async () => ({})),
}));

afterEach(cleanup);

const [sample] = SampleTransactions;
const deletedTransaction = { ...sample, deletedAt: '2026-09-20T10:00:00.000Z' };

const renderScreen = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  client.setQueryData(QueryKeys.deleted('transactions'), [deletedTransaction]);
  client.setQueryData(QueryKeys.deleted('accounts'), []);
  client.setQueryData(QueryKeys.deleted('rules'), [
    {
      categoryId: 'c1',
      categoryName: 'Groceries',
      deletedAt: '2026-09-19T10:00:00.000Z',
      id: 'rule-1',
      name: 'Mercadona',
      pattern: 'MERCADONA',
      priority: 0,
    },
  ]);
  client.setQueryData(QueryKeys.deleted('exchange-rates'), []);

  return render(
    <QueryClientProvider client={client}>
      <DeletedItems />
    </QueryClientProvider>
  );
};

describe('DeletedItems', () => {
  it('lists deleted transactions and restores one', async () => {
    const api = await import('@/api/mutations');

    renderScreen();
    expect(screen.getByRole('heading', { name: 'Deleted items' })).toBeTruthy();

    const [restore] = screen.getAllByRole('button', { name: /^Restore / });

    fireEvent.click(restore);
    await vi.waitFor(() =>
      expect(vi.mocked(api.restoreTransaction).mock.calls[0][0]).toMatchObject({
        id: deletedTransaction.id,
      })
    );
  });

  it('switches to other kinds of deleted items', async () => {
    const api = await import('@/api/mutations');

    renderScreen();
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Accounts' }), { button: 0 });
    expect(screen.getByRole('heading', { name: 'No deleted accounts' })).toBeTruthy();
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Rules' }), { button: 0 });
    fireEvent.click(screen.getByRole('button', { name: 'Restore Mercadona' }));
    await vi.waitFor(() => expect(vi.mocked(api.restoreRule).mock.calls[0][0]).toBe('rule-1'));
  });
});
