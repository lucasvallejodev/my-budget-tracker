import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { QueryKeys } from '@/components/finance';

import { ApplicationShell } from './application-shell';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/accounts/visa',
  useRouter: () => ({ push }),
}));

afterEach(cleanup);

const renderShell = () => {
  const client = new QueryClient();

  client.setQueryData(QueryKeys.summary(), { needsReviewCount: 2 });

  return render(
    <QueryClientProvider client={client}>
      <ApplicationShell>Page content</ApplicationShell>
    </QueryClientProvider>
  );
};

const mainNavigation = () => within(screen.getByRole('navigation', { name: 'Main navigation' }));

describe('ApplicationShell', () => {
  it('groups the navigation and marks the section of the current page', () => {
    renderShell();

    const navigation = mainNavigation();

    expect(navigation.getByText('Money')).toBeTruthy();
    expect(navigation.getByText('Plan')).toBeTruthy();
    expect(navigation.getByRole('link', { name: /Home/ }).getAttribute('href')).toBe('/');
    expect(navigation.getByRole('link', { name: /Accounts/ }).getAttribute('aria-current')).toBe(
      'page'
    );
    expect(navigation.getByRole('link', { name: /Home/ }).getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('main').textContent).toBe('Page content');
  });

  it('shows how many transactions wait for review and no account list', () => {
    renderShell();

    expect(mainNavigation().getByRole('link', { name: /Review/ }).textContent).toContain('2');
    expect(screen.queryByRole('link', { name: /Visa/ })).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Account menu' })).toHaveLength(1);
  });

  it('searches transactions from the header and focuses search with Ctrl+K', () => {
    renderShell();

    const search = screen.getByRole('textbox', { name: 'Search transactions' });

    fireEvent.keyDown(window, { ctrlKey: true, key: 'k' });

    expect(document.activeElement).toBe(search);

    fireEvent.change(search, { target: { value: 'rent' } });
    fireEvent.submit(screen.getByRole('search'));

    expect(push).toHaveBeenCalledWith('/transactions?q=rent');
  });

  it('offers a global New transaction button', () => {
    renderShell();

    expect(screen.getByRole('button', { name: 'New transaction' })).toBeTruthy();
  });

  it('offers a bottom tab bar whose More button opens the navigation drawer', async () => {
    renderShell();

    const tabs = within(screen.getByRole('navigation', { name: 'Quick navigation' }));

    expect(tabs.getByRole('link', { name: 'Activity' }).getAttribute('href')).toBe('/transactions');
    expect(tabs.getByRole('button', { name: 'Add transaction' })).toBeTruthy();

    const more = tabs.getByRole('button', { name: 'More' });

    expect(more.className).toContain('tab-bar__item--current');
    expect(more.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(more);

    const drawer = screen.getByRole('dialog', { name: 'Navigation' });

    expect(more.getAttribute('aria-expanded')).toBe('true');
    await waitFor(() =>
      expect(document.activeElement).toBe(within(drawer).getByRole('link', { name: 'Accounts' }))
    );

    fireEvent.keyDown(drawer, { key: 'Escape' });

    await waitFor(() => expect(document.activeElement).toBe(more));
  });

  it('reads the review count as words', () => {
    renderShell();

    expect(mainNavigation().getByRole('link', { name: 'Review, 2 to review' })).toBeTruthy();
  });
});
