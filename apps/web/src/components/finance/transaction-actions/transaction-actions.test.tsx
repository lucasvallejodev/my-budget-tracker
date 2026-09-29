import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SampleTransactions } from '../sample-data';
import { TransactionActions } from './transaction-actions';

vi.mock('@/api/mutations', () => ({ deleteTransaction: vi.fn(async () => ({})) }));
vi.mock('@/components/finance/transaction-dialog', () => ({
  duplicatePreset: (transaction: { memo: string }) => ({ memo: transaction.memo, mode: 'expense' }),
  TransactionDialog: ({ preset }: { preset?: { memo?: string } }) =>
    preset ? <p>New transaction copied from {preset.memo || 'a row'}</p> : null,
}));

afterEach(cleanup);

describe('TransactionActions', () => {
  it('opens the menu and the details dialog', () => {
    const [transaction] = SampleTransactions;

    render(
      <QueryClientProvider client={new QueryClient()}>
        <TransactionActions transaction={transaction} />
      </QueryClientProvider>
    );

    fireEvent.pointerDown(screen.getByRole('button', { name: /Actions for/ }), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.click(screen.getByRole('menuitem', { name: 'View details' }));

    expect(screen.getByRole('dialog', { name: 'Transaction details' })).toBeTruthy();
    expect(screen.getByText(transaction.id)).toBeTruthy();
  });

  it('opens a new transaction prefilled from the row when duplicating', () => {
    const [transaction] = SampleTransactions;

    render(
      <QueryClientProvider client={new QueryClient()}>
        <TransactionActions transaction={transaction} />
      </QueryClientProvider>
    );

    fireEvent.pointerDown(screen.getByRole('button', { name: /Actions for/ }), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Duplicate' }));

    expect(
      screen.getByText(`New transaction copied from ${transaction.memo || 'a row'}`)
    ).toBeTruthy();
  });
});
