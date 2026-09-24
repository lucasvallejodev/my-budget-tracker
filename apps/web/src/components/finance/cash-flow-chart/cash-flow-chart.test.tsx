import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('recharts', async importOriginal => ({
  ...(await importOriginal<typeof import('recharts')>()),
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

import { CashFlowChart } from './cash-flow-chart';

afterEach(cleanup);

describe('CashFlowChart', () => {
  it('renders the panel with its description and legend note', () => {
    render(<CashFlowChart description="Income vs spending · EUR" data={[]} />);

    expect(screen.getByRole('heading', { name: 'Cash Flow' })).toBeTruthy();
    expect(screen.getByText('Income vs spending · EUR')).toBeTruthy();
    expect(screen.getByText('Purple: income · Dashed: expenses')).toBeTruthy();
  });
});
