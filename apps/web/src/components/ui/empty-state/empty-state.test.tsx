import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { EmptyState } from './empty-state';

afterEach(cleanup);

describe('EmptyState', () => {
  it('renders the title, description and action', () => {
    render(
      <EmptyState title="No rules yet" description="Add one" action={<button>Add rule</button>} />
    );

    expect(screen.getByRole('heading', { name: 'No rules yet' })).toBeTruthy();
    expect(screen.getByText('Add one')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add rule' })).toBeTruthy();
  });
});
