import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PageHeading } from './page-heading';

afterEach(cleanup);

describe('PageHeading', () => {
  it('renders the title, description and actions', () => {
    render(
      <PageHeading title="Budgets" description="Monthly limits" actions={<button>Add</button>} />
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Budgets' })).toBeTruthy();
    expect(screen.getByText('Monthly limits')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy();
  });
});
