import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { MetricValue } from './metric-value';

afterEach(cleanup);

describe('MetricValue', () => {
  it('renders the figure', () => {
    render(<MetricValue size="fluid">€1,200.00</MetricValue>);

    expect(screen.getByText('€1,200.00')).toBeTruthy();
  });
});
