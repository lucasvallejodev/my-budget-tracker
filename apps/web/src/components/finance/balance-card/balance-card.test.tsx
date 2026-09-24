import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { BalanceCard } from './balance-card';

afterEach(cleanup);

describe('BalanceCard', () => {
  it('renders the title, caption, value, details and actions', () => {
    render(
      <BalanceCard
        title="Net worth"
        label="EUR"
        caption="2 accounts in EUR"
        value="€5,000.00"
        details={<span>Assets €6,000.00</span>}
        actions={<button>View accounts</button>}
      />
    );

    expect(screen.getByRole('heading', { name: 'Net worth' })).toBeTruthy();
    expect(screen.getByText('EUR')).toBeTruthy();
    expect(screen.getByText('€5,000.00')).toBeTruthy();
    expect(screen.getByText('Assets €6,000.00')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'View accounts' })).toBeTruthy();
  });
});
