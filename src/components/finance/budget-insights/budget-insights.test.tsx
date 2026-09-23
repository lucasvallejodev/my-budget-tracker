import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { BudgetInsights } from './budget-insights';

afterEach(cleanup);

describe('BudgetInsights', () => {
  it('lists every insight', () => {
    render(<BudgetInsights insights={['2 of 3 within limits', 'Food exceeded its budget']} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
