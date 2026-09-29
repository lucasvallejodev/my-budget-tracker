import { cleanup, render, screen } from '@testing-library/react';
import { cloneElement, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('recharts', async importOriginal => ({
  ...(await importOriginal<typeof import('recharts')>()),
  ResponsiveContainer: ({
    children,
  }: {
    children: ReactElement<{ height: number; width: number }>;
  }) => cloneElement(children, { height: ChartHeight, width: ChartWidth }),
}));

import { formatCompactMoney } from '@coinkeeper/shared/lib/money';

import { CashFlowChart } from './cash-flow-chart';

const ChartWidth = 600;
const ChartHeight = 300;

afterEach(cleanup);

describe('CashFlowChart', () => {
  it('renders the panel with its description and legend note', () => {
    render(<CashFlowChart description="Income vs spending · EUR" data={[]} />);

    expect(screen.getByRole('heading', { name: 'Cash Flow' })).toBeTruthy();
    expect(screen.getByText('Income vs spending · EUR')).toBeTruthy();
    expect(screen.getByText('Purple: income · Dashed: expenses')).toBeTruthy();
  });

  it('labels the value axis with the tick formatter', () => {
    render(
      <CashFlowChart
        data={[
          {
            expense: 120000,
            income: 300000,
            label: 'Jan',
          },
        ]}
        formatTick={value => formatCompactMoney(value, 'EUR')}
      />
    );

    expect(screen.getByText(formatCompactMoney(300000, 'EUR'))).toBeTruthy();
    expect(screen.queryByText('300000')).toBeNull();
  });
});
