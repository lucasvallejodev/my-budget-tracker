import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('recharts', async importOriginal => ({
  ...(await importOriginal<typeof import('recharts')>()),
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

import { DistributionChart } from './distribution-chart';

afterEach(cleanup);

describe('DistributionChart', () => {
  it('describes every segment and lists it in the legend', () => {
    render(
      <DistributionChart
        title="Spending by group"
        format={value => `€${value}`}
        data={[
          { name: 'Food', value: 30 },
          { name: 'Rent', value: 70 },
        ]}
      />
    );

    expect(screen.getByRole('img', { name: 'Food: €30, Rent: €70' })).toBeTruthy();
    expect(screen.getByText('€70')).toBeTruthy();
  });

  it('shows an empty state without activity', () => {
    render(<DistributionChart data={[{ name: 'Food', value: 0 }]} />);

    expect(screen.getByText('No activity yet')).toBeTruthy();
  });

  it('links a legend entry to its transactions when the segment has a link', () => {
    render(
      <DistributionChart
        data={[
          {
            href: '/transactions?q=Food',
            name: 'Food',
            value: 30,
          },
          { name: 'Rent', value: 70 },
        ]}
      />
    );

    expect(screen.getByRole('link', { name: 'Food' }).getAttribute('href')).toBe(
      '/transactions?q=Food'
    );
    expect(screen.queryByRole('link', { name: 'Rent' })).toBeNull();
  });
});
