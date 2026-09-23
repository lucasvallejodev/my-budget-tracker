import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CreatePayeeDialog } from './create-payee-dialog';

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

describe('CreatePayeeDialog', () => {
  it('opens the create form from the "Create new" row', () => {
    renderWith(new QueryClient(), <CreatePayeeDialog />);

    fireEvent.click(screen.getByRole('button', { name: 'Create new' }));

    expect(screen.getByRole('dialog', { name: 'Create new payee' })).toBeTruthy();
    expect(screen.getByLabelText('Name')).toBeTruthy();
  });
});
