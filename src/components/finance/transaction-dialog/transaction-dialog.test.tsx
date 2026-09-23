import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TransactionDialog } from './transaction-dialog';

vi.mock('@/app/(main)/actions', () => ({
  createAccountAction: vi.fn(async () => ({})),
  createPayeeAction: vi.fn(async () => ({})),
  createTransactionAction: vi.fn(async () => ({})),
  createTransferAction: vi.fn(async () => ({})),
  updateAccountAction: vi.fn(async () => ({})),
  updatePayeeAction: vi.fn(async () => ({})),
  updateTransactionAction: vi.fn(async () => ({})),
  updateTransferAction: vi.fn(async () => ({})),
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

const renderWith = (client: QueryClient, view: ReactNode) =>
  render(<QueryClientProvider client={client}>{view}</QueryClientProvider>);

describe('TransactionDialog', () => {
  it('opens a new expense from its trigger', () => {
    renderWith(new QueryClient(), <TransactionDialog trigger={<button>Add</button>} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByRole('dialog', { name: 'New transaction' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Type' }).textContent).toContain('Expense');
  });
});
