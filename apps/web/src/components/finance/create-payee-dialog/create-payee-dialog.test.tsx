import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CreatePayeeDialog } from './create-payee-dialog';

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

describe('CreatePayeeDialog', () => {
  it('opens the create form from the "Create new" row', () => {
    renderWith(new QueryClient(), <CreatePayeeDialog />);

    fireEvent.click(screen.getByRole('button', { name: 'Create new' }));

    expect(screen.getByRole('dialog', { name: 'Create new payee' })).toBeTruthy();
    expect(screen.getByLabelText('Name')).toBeTruthy();
  });

  it('saves a chosen colour and icon, and emoji only when allowed', async () => {
    const actions = await import('@/api/mutations');
    const client = new QueryClient();

    client.setQueryData(['settings'], { allowEmoji: true, primaryCurrency: 'EUR' });
    renderWith(client, <CreatePayeeDialog />);
    fireEvent.click(screen.getByRole('button', { name: 'Create new' }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Corner Café' } });
    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.change(screen.getByLabelText('Emoji'), { target: { value: '☕' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await vi.waitFor(() =>
      expect(actions.createPayee).toHaveBeenCalledWith(
        expect.objectContaining({ icon: '☕', name: 'Corner Café' })
      )
    );
    expect(vi.mocked(actions.createPayee).mock.calls[0][0].color).toMatch(/^#[0-9A-F]{6}$/i);
  });
});
