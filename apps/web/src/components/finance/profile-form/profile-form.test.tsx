import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { QueryKeys } from '../use-finance-data';
import { ProfileForm } from './profile-form';

vi.mock('@/api/mutations', () => ({
  updateProfile: vi.fn(async (values: { email: string; name: string }) => ({
    createdAt: '2026-09-01T00:00:00.000Z',
    id: 'user-1',
    ...values,
  })),
}));

afterEach(cleanup);

const user = {
  createdAt: '2026-09-01T00:00:00.000Z',
  email: 'ada@example.com',
  id: 'user-1',
  name: 'Ada',
};

describe('ProfileForm', () => {
  it('saves the edited profile and updates the cached user', async () => {
    const api = await import('@/api/mutations');
    const client = new QueryClient();

    render(
      <QueryClientProvider client={client}>
        <ProfileForm user={user} />
      </QueryClientProvider>
    );

    const save = screen.getByRole<HTMLButtonElement>('button', { name: 'Save profile' });

    expect(save.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada Lovelace' } });
    fireEvent.click(save);

    await vi.waitFor(() =>
      expect(client.getQueryData(QueryKeys.me)).toMatchObject({ name: 'Ada Lovelace' })
    );
    expect(vi.mocked(api.updateProfile).mock.calls[0][0]).toEqual({
      email: 'ada@example.com',
      name: 'Ada Lovelace',
    });
  });
});
