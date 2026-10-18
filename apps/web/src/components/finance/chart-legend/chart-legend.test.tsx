import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChartLegend } from './chart-legend';

afterEach(cleanup);

describe('ChartLegend', () => {
  it('lists each series with a dot in its colour', () => {
    const { container } = render(
      <ChartLegend
        items={[
          { color: 'red', label: 'Income' },
          { color: 'blue', label: 'Spending' },
        ]}
      />
    );

    expect(screen.getAllByRole('listitem').map(item => item.textContent)).toEqual([
      'Income',
      'Spending',
    ]);
    expect(container.querySelector<HTMLElement>('.chart-legend__dot')?.style.background).toBe(
      'red'
    );
  });
});
