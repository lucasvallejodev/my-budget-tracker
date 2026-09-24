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

  it('omits the trend line without trend or detail', () => {
    render(<MetricCard label="Balance" value="€0.00" />);

    expect(screen.queryByText('Since last month')).toBeNull();
  });
});
