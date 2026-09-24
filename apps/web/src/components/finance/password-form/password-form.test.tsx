import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PasswordForm } from './password-form';

vi.mock('@/api/mutations', () => ({ changePassword: vi.fn(async () => undefined) }));

afterEach(cleanup);

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('PasswordForm', () => {
  it('requires a long matching password and sends only the two passwords', async () => {
    const api = await import('@/api/mutations');

    render(
      <QueryClientProvider client={new QueryClient()}>
        <PasswordForm />
      </QueryClientProvider>
    );

    type('Current password', 'old password value');
    type('New password', 'short');
    type('Repeat the new password', 'short');
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));

    expect(await screen.findByText('Use at least 12 characters')).toBeTruthy();
    expect(api.changePassword).not.toHaveBeenCalled();

    type('New password', 'a much longer password');
    type('Repeat the new password', 'a much longer password');
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));

    await vi.waitFor(() =>
      expect(vi.mocked(api.changePassword).mock.calls[0][0]).toEqual({
        currentPassword: 'old password value',
        newPassword: 'a much longer password',
      })
    );
  });
});
