import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ComponentGallery } from './component-gallery';

vi.mock('recharts', async importOriginal => ({
  ...(await importOriginal<typeof import('recharts')>()),
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/finance/transaction-dialog', () => ({ TransactionDialog: () => null }));
vi.mock('@/api/mutations', () => ({ deleteTransaction: vi.fn() }));

afterEach(cleanup);

describe('ComponentGallery', () => {
  it('renders the sample dashboard and switches previews', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ComponentGallery />
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { name: 'Component Gallery' })).toBeTruthy();
    expect(screen.getByText('Monthly Income')).toBeTruthy();
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Budgets' }), { button: 0 });
    expect(screen.getByRole('heading', { name: 'Category budget (sample)' })).toBeTruthy();
  });
});
