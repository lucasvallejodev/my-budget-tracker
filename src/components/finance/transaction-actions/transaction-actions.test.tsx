import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SampleTransactions } from '../sample-data';
import { TransactionActions } from './transaction-actions';

vi.mock('@/app/(main)/actions', () => ({ deleteTransactionAction: vi.fn(async () => ({})) }));
vi.mock('@/app/(main)/_components/transaction-dialog', () => ({ default: () => null }));

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
});
