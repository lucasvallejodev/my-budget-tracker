import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type PayeeRow, QueryKeys } from '../use-finance-data';
import { PayeePicker } from './payee-picker';

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

describe('PayeePicker', () => {
  it('lists payees and reports the choice', () => {
    const client = new QueryClient();
    const onChange = vi.fn();

    client.setQueryData(QueryKeys.payees, [{ id: 'grocer', name: 'Grocer' } as PayeeRow]);
    renderWith(client, <PayeePicker onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Select payees' }));
    fireEvent.click(screen.getByText('Grocer'));

    expect(onChange).toHaveBeenCalledWith('grocer');
  });
});
