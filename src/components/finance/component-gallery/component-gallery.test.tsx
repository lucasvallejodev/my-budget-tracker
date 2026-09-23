import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ComponentGallery } from './component-gallery';

vi.mock('recharts', async importOriginal => ({
  ...(await importOriginal<typeof import('recharts')>()),
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@clerk/nextjs', () => ({
  useClerk: () => ({ openUserProfile: vi.fn() }),
  useUser: () => ({ user: null }),
}));

vi.mock('@/components/finance/transaction-dialog', () => ({ TransactionDialog: () => null }));
vi.mock('@/app/(main)/actions', () => ({ deleteTransactionAction: vi.fn() }));

afterEach(cleanup);

describe('ComponentGallery', () => {
  it('renders the sample dashboard and opens a preview dialog', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ComponentGallery />
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { name: 'Component Gallery' })).toBeTruthy();
    expect(screen.getByText('$124,580.45')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Send ↗' }));
    expect(screen.getByRole('dialog', { name: 'Send — component preview' })).toBeTruthy();
  });
});
