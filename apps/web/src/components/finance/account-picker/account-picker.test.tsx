import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type AccountSummary, QueryKeys } from '../use-finance-data';
import { AccountPicker } from './account-picker';

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

const renderWith = (client: QueryClient, view: ReactNode) =>
  render(<QueryClientProvider client={client}>{view}</QueryClientProvider>);

describe('AccountPicker', () => {
  it('lists accounts with their currency and reports the choice', () => {
    const client = new QueryClient();
    const onChange = vi.fn();

    client.setQueryData(
      [...QueryKeys.accounts, false],
      [
        {
          currency: 'EUR',
          id: 'checking',
          name: 'Checking',
        } as AccountSummary,
      ]
    );
    renderWith(client, <AccountPicker onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Select accounts' }));
    fireEvent.click(screen.getByText('Checking · EUR'));

    expect(onChange).toHaveBeenCalledWith('checking');
  });
});
