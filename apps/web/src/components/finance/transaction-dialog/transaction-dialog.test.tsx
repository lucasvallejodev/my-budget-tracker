import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTransaction } from '@/api/mutations';
import type { TemplateRow } from '@coinkeeper/shared/schema/templates';

import { SampleTransactions } from '../sample-data';
import { QueryKeys } from '../use-finance-data';
import { TransactionDialog } from './transaction-dialog';

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

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const Coffee: TemplateRow = {
  accountId: 'account-1',
  amountMinor: -250,
  categoryId: null,
  currency: 'EUR',
  deletedAt: null,
  direction: 'expense',
  id: '6f1c2f43-6a3c-4c33-9c39-7b8a1d8f2a10',
  kind: 'standard',
  lastUsedAt: null,
  memo: 'Morning',
  name: 'Coffee',
  payeeId: null,
  sortOrder: 0,
  transferAccountId: null,
  unavailableReason: null,
};

const Archived: TemplateRow = {
  ...Coffee,
  id: '0a7bd36a-63d7-4b7b-9a51-5ac0c1d7a0a2',
  name: 'Old card',
  unavailableReason: 'account_archived',
};

const withTemplates = (templates: TemplateRow[]) => {
  const client = new QueryClient();

  client.setQueryData(QueryKeys.templates, templates);
  client.setQueryData(
    [...QueryKeys.accounts, false],
    [
      {
        currency: 'EUR',
        id: 'account-1',
        name: 'Wallet',
      },
    ]
  );

  return client;
};

const renderWith = (client: QueryClient, view: ReactNode) =>
  render(<QueryClientProvider client={client}>{view}</QueryClientProvider>);

describe('TransactionDialog', () => {
  it('opens a new expense from its trigger', () => {
    renderWith(new QueryClient(), <TransactionDialog trigger={<button>Add</button>} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByRole('dialog', { name: 'New transaction' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Type' }).textContent).toContain('Expense');
  });

  it('fills the form from a template chip and records which template was used', async () => {
    renderWith(withTemplates([Coffee]), <TransactionDialog trigger={<button>Add</button>} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    fireEvent.click(screen.getByRole('button', { name: /Coffee/ }));

    expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveProperty('value', '2.50');

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() =>
      expect(createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'account-1',
          amount: '2.50',
          memo: 'Morning',
          templateId: Coffee.id,
        })
      )
    );
  });

  it('disables a template whose account was archived and links to Settings', () => {
    renderWith(withTemplates([Archived]), <TransactionDialog trigger={<button>Add</button>} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByRole('button', { name: /Old card/ })).toHaveProperty('disabled', true);
    expect(screen.getByRole('link', { name: 'Fix templates in Settings' })).toBeTruthy();
  });

  it('hides the template chips while editing', () => {
    renderWith(
      withTemplates([Coffee]),
      <TransactionDialog open transaction={SampleTransactions[0]} />
    );

    expect(screen.getByRole('dialog', { name: 'Edit transaction' })).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Templates' })).toBeNull();
  });
});
