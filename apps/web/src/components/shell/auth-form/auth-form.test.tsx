import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthForm, safeNextPath } from './auth-form';

const replace = vi.fn();
const refresh = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh, replace }) }));
vi.mock('@/api/mutations', () => ({
  signIn: vi.fn(async () => ({ email: 'ada@example.com' })),
  signUp: vi.fn(async () => ({ email: 'ada@example.com' })),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderForm = (mode: 'sign-in' | 'sign-up', next?: string) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthForm mode={mode} next={next} />
    </QueryClientProvider>
  );

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('AuthForm', () => {
  it('signs in and goes to the page that asked for it', async () => {
    const api = await import('@/api/mutations');

    renderForm('sign-in', '/transactions');
    type('Email', 'ada@example.com');
    type('Password', 'correct horse battery staple');
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/transactions'));
    expect(vi.mocked(api.signIn).mock.calls[0][0]).toEqual({
      email: 'ada@example.com',
      password: 'correct horse battery staple',
    });
    expect(screen.getByRole('link', { name: 'Create one' }).getAttribute('href')).toBe(
      '/sign-up?next=%2Ftransactions'
    );
  });

  it('shows the error the API returns', async () => {
    const api = await import('@/api/mutations');

    vi.mocked(api.signIn).mockRejectedValueOnce(new Error('The email or password is incorrect'));
    renderForm('sign-in');
    type('Email', 'ada@example.com');
    type('Password', 'wrong');
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect((await screen.findByRole('alert')).textContent).toBe(
      'The email or password is incorrect'
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it('checks the repeated password before creating the account', async () => {
    const api = await import('@/api/mutations');

    renderForm('sign-up');
    type('Email', 'ada@example.com');
    type('Password', 'correct horse battery staple');
    type('Repeat the password', 'something else entirely');
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('The passwords do not match')).toBeTruthy();
    expect(api.signUp).not.toHaveBeenCalled();

    type('Repeat the password', 'correct horse battery staple');
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
    expect(vi.mocked(api.signUp).mock.calls[0][0]).toEqual({
      email: 'ada@example.com',
      name: '',
      password: 'correct horse battery staple',
    });
  });

  it('only follows local next paths', () => {
    expect(safeNextPath('/budgets?month=2026-09')).toBe('/budgets?month=2026-09');
    expect(safeNextPath('//evil.example')).toBe('/');
    expect(safeNextPath('https://evil.example')).toBe('/');
    expect(safeNextPath(undefined)).toBe('/');
  });
});
