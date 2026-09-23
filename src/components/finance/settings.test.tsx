import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SettingsView } from './settings';

const openUserProfile = vi.fn();

vi.mock('@clerk/nextjs', () => ({
  useClerk: () => ({ openUserProfile }),
  useUser: () => ({
    user: {
      fullName: 'Ada Lovelace',
      primaryEmailAddress: { emailAddress: 'ada@example.com' },
    },
  }),
}));

afterEach(() => {
  cleanup();
  openUserProfile.mockClear();
});

function renderSettings(demo = false) {
  const client = new QueryClient();

  return render(
    <QueryClientProvider client={client}>
      <SettingsView demo={demo} />
    </QueryClientProvider>
  );
}

describe('SettingsView', () => {
  it('renders the section tabs and the signed-in profile panel', () => {
    renderSettings();
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeTruthy();
    expect(screen.getByRole('tablist', { name: 'Settings Sections' })).toBeTruthy();
    expect(screen.getAllByRole('tab')).toHaveLength(10);
    expect(screen.getByRole('heading', { name: 'Profile Information' })).toBeTruthy();
    expect(screen.getByText('Signed in as Ada Lovelace')).toBeTruthy();
    expect(screen.queryByText(/Component preview/)).toBeNull();
  });

  it('opens the Clerk profile from the profile actions', () => {
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Manage your profile' }));
    expect(openUserProfile).toHaveBeenCalledTimes(1);
  });

  it('switches sections when a tab is activated', () => {
    renderSettings();
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Data Management' }), { button: 0 });
    expect(screen.getByRole('heading', { name: 'Data Management' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Export as CSV' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Refresh cache' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Profile Information' })).toBeNull();
  });

  it('shows the demo notice and keeps account services untouched in demo mode', () => {
    renderSettings(true);
    expect(screen.getByText('Component preview — sample account information.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Preview photo control' }));
    expect(openUserProfile).not.toHaveBeenCalled();
    expect(screen.queryByText(/Signed in as/)).toBeNull();
  });
});
