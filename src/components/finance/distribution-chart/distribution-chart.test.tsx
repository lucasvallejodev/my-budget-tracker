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
});
