import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type AccountSummary, QueryKeys } from '@/components/finance';

import { ApplicationShell } from './application-shell';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/budgets',
  useRouter: () => ({ push }),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const renderShell = () => {
  const client = new QueryClient();

  vi.stubGlobal('matchMedia', () => ({
    addEventListener: vi.fn(),
    matches: false,
    removeEventListener: vi.fn(),
  }));
  client.setQueryData(
    [...QueryKeys.accounts, false],
    [
      {
        balanceMinor: -5000,
        classification: 'liability',
        currency: 'EUR',
        id: 'visa',
        name: 'Visa',
        type: 'credit_card',
      } as AccountSummary,
    ]
  );

  return render(
    <QueryClientProvider client={client}>
      <ApplicationShell>Page content</ApplicationShell>
    </QueryClientProvider>
  );
};

describe('ApplicationShell', () => {
  it('marks the current route and lists accounts with their balance', () => {
    renderShell();

    expect(screen.getByRole('link', { name: /Budgets/ }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: /Visa/ }).getAttribute('href')).toBe('/accounts/visa');
    expect(screen.getByRole('main').textContent).toBe('Page content');
  });

  it('searches transactions from the header', () => {
    renderShell();

    fireEvent.change(screen.getByRole('textbox', { name: 'Search transactions' }), {
      target: { value: 'rent' },
    });
    fireEvent.submit(screen.getByRole('search'));

    expect(push).toHaveBeenCalledWith('/transactions?q=rent');
  });
});
