import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { MetricCard } from './metric-card';

afterEach(cleanup);

describe('MetricCard', () => {
  it('renders the label, value, trend and detail', () => {
    render(<MetricCard label="Income" value="€1,000.00" trend="+5%" detail="Since last month" />);

    expect(screen.getByText('Income')).toBeTruthy();
    expect(screen.getByText('€1,000.00')).toBeTruthy();
    expect(screen.getByText('+5%')).toBeTruthy();
    expect(screen.getByText('Since last month')).toBeTruthy();
  });

  it('gives each metric kind its own tinted icon', () => {
    const { container } = render(<MetricCard kind="income" label="Income" value="€1.00" />);
    const tile = container.querySelector<HTMLElement>('.avatar');

    expect(tile?.style.getPropertyValue('--avatar-color')).toBe('var(--color-metric-income)');
  });

  it('omits the trend line without trend or detail', () => {
    render(<MetricCard label="Balance" value="€0.00" />);

    expect(screen.queryByText('Since last month')).toBeNull();
  });
});
