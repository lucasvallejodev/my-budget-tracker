import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Logo } from './logo';

afterEach(cleanup);

describe('Logo', () => {
  it('links home', () => {
    render(<Logo />);

    expect(screen.getByRole('link', { name: 'CoinKeeper home' }).getAttribute('href')).toBe('/');
  });
});
