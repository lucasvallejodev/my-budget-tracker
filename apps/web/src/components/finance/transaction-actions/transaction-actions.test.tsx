import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createTemplate } from '@/api/mutations';

import { SampleTransactions } from '../sample-data';
import { TransactionActions } from './transaction-actions';

vi.mock('@/api/mutations', () => ({
  createTemplate: vi.fn(async () => ({})),
  deleteTransaction: vi.fn(async () => ({})),
}));
vi.mock('@/components/finance/transaction-dialog', () => ({
  duplicatePreset: (transaction: { accountId: string; memo: string }) => ({
    accountId: transaction.accountId,
    amount: '12.50',
    memo: transaction.memo,
    mode: 'expense',
  }),
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

  it('saves the row as a template named after its payee', async () => {
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
    fireEvent.click(screen.getByRole('menuitem', { name: 'Save as template' }));

    expect(screen.getByRole('textbox', { name: 'Template name' })).toHaveProperty(
      'value',
      transaction.payeeName
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save template' }));

    await waitFor(() =>
      expect(createTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: transaction.accountId,
          amount: '12.50',
          kind: 'standard',
          name: transaction.payeeName,
        })
      )
    );
  });
});
