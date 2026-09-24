import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { QueryKeys } from '../use-finance-data';
import { SettingsView } from './settings-view';

vi.mock('@/api/mutations', () => ({
  changePassword: vi.fn(async () => undefined),
  revokeSession: vi.fn(async () => undefined),
  updateProfile: vi.fn(async () => ({})),
}));

afterEach(cleanup);

function renderSettings(demo = false) {
  const client = new QueryClient();

  client.setQueryData(QueryKeys.me, {
    createdAt: '2026-09-01T00:00:00.000Z',
    email: 'ada@example.com',
    id: 'user-1',
    name: 'Ada Lovelace',
  });
  client.setQueryData(QueryKeys.sessions, []);

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
    expect(screen.getAllByRole('tab')).toHaveLength(11);
    expect(screen.getByRole('heading', { name: 'Profile Information' })).toBeTruthy();
    expect(screen.getByText('Signed in as Ada Lovelace')).toBeTruthy();
    expect(screen.queryByText(/Component preview/)).toBeNull();
  });

  it('edits the profile and offers password change, sessions and deleted items', () => {
    renderSettings();
    expect(screen.getByLabelText<HTMLInputElement>('Email').value).toBe('ada@example.com');
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Security' }), { button: 0 });
    expect(screen.getByRole('button', { name: 'Change password' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'No active sessions' })).toBeTruthy();
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Deleted items' }), { button: 0 });
    expect(screen.getByRole('link', { name: 'Open deleted items' }).getAttribute('href')).toBe(
      '/settings/deleted'
    );
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
    expect(screen.getByRole('button', { name: 'Preview photo control' })).toBeTruthy();
    expect(screen.queryByText(/Signed in as/)).toBeNull();
  });
});
