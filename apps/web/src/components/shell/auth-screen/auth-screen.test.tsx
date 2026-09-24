import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AuthScreen } from './auth-screen';

afterEach(cleanup);

describe('AuthScreen', () => {
  it('shows the logo above the sign-in form', () => {
    render(<AuthScreen>Sign in form</AuthScreen>);

    expect(screen.getByRole('main').textContent).toContain('Sign in form');
    expect(screen.getByRole('link', { name: 'CoinKeeper home' })).toBeTruthy();
  });
});
