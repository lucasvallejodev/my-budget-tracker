import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { LinkedAccount } from './linked-account';

afterEach(cleanup);

describe('LinkedAccount', () => {
  it('renders the account with its actions', () => {
    render(<LinkedAccount name="Checking" detail="Bank · EUR" actions={<button>View</button>} />);

    expect(screen.getByRole('heading', { name: 'Checking' })).toBeTruthy();
    expect(screen.getByText('Bank · EUR')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'View' })).toBeTruthy();
  });
});
