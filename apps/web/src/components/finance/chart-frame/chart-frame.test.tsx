import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChartFrame } from './chart-frame';

afterEach(cleanup);

describe('ChartFrame', () => {
  it('exposes a labelled image when given a label', () => {
    render(<ChartFrame label="Spent: €10.00">chart</ChartFrame>);

    expect(screen.getByRole('img', { name: 'Spent: €10.00' })).toBeTruthy();
  });

  it('hides the drawing and offers the numbers as a table when given data', () => {
    const { container } = render(
      <ChartFrame
        label="Income per month"
        data={{
          columns: ['Month', 'Income'],
          rows: [
            { label: 'Aug', values: ['€10.00'] },
            { label: 'Sep', values: ['€12.00'] },
          ],
        }}
      >
        chart
      </ChartFrame>
    );

    const table = screen.getByRole('table', { name: 'Income per month' });

    expect(table.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(screen.getByRole('rowheader', { name: 'Sep' })).toBeTruthy();
    expect(container.querySelector('.chart-frame__plot')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('stays a plain container without a label', () => {
    render(<ChartFrame>chart</ChartFrame>);

    expect(screen.queryByRole('img')).toBeNull();
  });
});
