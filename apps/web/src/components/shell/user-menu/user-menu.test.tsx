import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { QueryKeys } from '@/components/finance';

import { initialsOf, UserMenu } from './user-menu';

const replace = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), replace }) }));
vi.mock('@/api/mutations', () => ({ signOut: vi.fn(async () => undefined) }));

afterEach(cleanup);

const user = {
  createdAt: '2026-09-01T00:00:00.000Z',
  email: 'ada@example.com',
  id: 'user-1',
  name: 'Ada Lovelace',
};

const renderMenu = () => {
  const client = new QueryClient();

  client.setQueryData(QueryKeys.me, user);

  return render(
    <QueryClientProvider client={client}>
      <UserMenu showName />
    </QueryClientProvider>
  );
};

const openMenu = () =>
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Account menu' }), {
    button: 0,
    ctrlKey: false,
  });

describe('UserMenu', () => {
  it('shows who is signed in and links to settings and deleted items', () => {
    renderMenu();
    expect(screen.getByText('AL')).toBeTruthy();
    openMenu();
    expect(screen.getByText('ada@example.com')).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Settings' }).getAttribute('href')).toBe(
      '/settings'
    );
    expect(screen.getByRole('menuitem', { name: 'Deleted items' }).getAttribute('href')).toBe(
      '/settings/deleted'
    );
  });

  it('signs out and returns to the sign-in page', async () => {
    const api = await import('@/api/mutations');

    renderMenu();
    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/sign-in'));
    expect(api.signOut).toHaveBeenCalled();
  });

  it('builds initials from the name or the email', () => {
    expect(initialsOf({ email: 'ada@example.com', name: 'Ada Lovelace' })).toBe('AL');
    expect(initialsOf({ email: 'grace@example.com', name: null })).toBe('GR');
    expect(initialsOf(undefined)).toBe('?');
  });
});
