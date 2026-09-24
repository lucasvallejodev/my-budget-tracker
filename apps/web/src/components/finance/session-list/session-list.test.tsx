import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { QueryKeys } from '../use-finance-data';
import { describeDevice, SessionList } from './session-list';

vi.mock('@/api/mutations', () => ({ revokeSession: vi.fn(async () => undefined) }));

afterEach(cleanup);

const WindowsChrome =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

const session = (id: string, current: boolean, userAgent: string | null) => ({
  createdAt: '2026-09-01T00:00:00.000Z',
  current,
  expiresAt: '2026-10-01T00:00:00.000Z',
  id,
  ipAddress: '127.0.0.1',
  lastUsedAt: '2026-09-20T10:00:00.000Z',
  userAgent,
});

describe('SessionList', () => {
  it('marks this device and signs another one out', async () => {
    const api = await import('@/api/mutations');
    const client = new QueryClient();

    client.setQueryData(QueryKeys.sessions, [
      session('here', true, WindowsChrome),
      session('there', false, null),
    ]);
    render(
      <QueryClientProvider client={client}>
        <SessionList />
      </QueryClientProvider>
    );

    expect(screen.getByText('This device')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Chrome on Windows' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await vi.waitFor(() => expect(vi.mocked(api.revokeSession).mock.calls[0][0]).toBe('there'));
  });

  it('describes user agents in plain words', () => {
    expect(describeDevice(WindowsChrome)).toBe('Chrome on Windows');
    expect(describeDevice('Mozilla/5.0 (iPhone) Version/18 Mobile Safari/604.1')).toBe(
      'Safari on iPhone'
    );
    expect(describeDevice(null)).toBe('Unknown device');
  });
});
