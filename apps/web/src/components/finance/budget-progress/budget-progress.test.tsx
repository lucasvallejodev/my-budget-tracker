import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { BudgetProgress } from './budget-progress';

afterEach(cleanup);

describe('BudgetProgress', () => {
  it('shows the share used and what remains', () => {
    render(<BudgetProgress spent={25} limit={100} format={value => `${value} left`} />);

    expect(screen.getByText('25% used')).toBeTruthy();
    expect(screen.getByText('75 left remaining')).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'Budget progress' }).getAttribute('value')).toBe(
      '25'
    );
  });

  it('caps the bar at 100 when over budget', () => {
    render(<BudgetProgress spent={150} limit={100} label="Food" />);

    expect(screen.getByRole('progressbar', { name: 'Food' }).getAttribute('value')).toBe('100');
  });
});
