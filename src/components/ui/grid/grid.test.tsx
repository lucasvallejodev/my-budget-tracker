import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Grid } from './grid';

afterEach(cleanup);

describe('Grid', () => {
  it('renders its children', () => {
    render(<Grid>Metric</Grid>);

    expect(screen.getByText('Metric')).toBeTruthy();
  });
});
