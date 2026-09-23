import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChartFrame } from './chart-frame';

afterEach(cleanup);

describe('ChartFrame', () => {
  it('exposes a labelled image when given a label', () => {
    render(<ChartFrame label="Spent: €10.00">chart</ChartFrame>);

    expect(screen.getByRole('img', { name: 'Spent: €10.00' })).toBeTruthy();
  });

  it('stays a plain container without a label', () => {
    render(<ChartFrame>chart</ChartFrame>);

    expect(screen.queryByRole('img')).toBeNull();
  });
});
