import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SpendingRanking } from './spending-ranking';

afterEach(cleanup);

describe('SpendingRanking', () => {
  it('lists each name with its amount, share and a link to its transactions', () => {
    render(
      <SpendingRanking
        title="Top payees · EUR"
        format={value => `${value} EUR`}
        items={[
          {
            href: '/transactions?q=Market',
            name: 'Market',
            spentMinor: 6500,
            transactions: 2,
          },
          {
            href: '/transactions?q=Cafe',
            name: 'Cafe',
            spentMinor: 350,
            transactions: 1,
          },
        ]}
      />
    );

    expect(screen.getByRole('link', { name: 'Market' }).getAttribute('href')).toBe(
      '/transactions?q=Market'
    );
    expect(screen.getByText('6500 EUR')).toBeTruthy();
    expect(screen.getByText('2 transactions')).toBeTruthy();
    expect(screen.getByText('1 transaction')).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'Cafe spending' }).getAttribute('max')).toBe(
      '6500'
    );
  });

  it('shows an empty state without spending', () => {
    render(<SpendingRanking title="Top payees" format={String} items={[]} />);

    expect(screen.getByText('No spending this month')).toBeTruthy();
  });
});
