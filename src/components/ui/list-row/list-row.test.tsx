import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ListRow } from './list-row';

afterEach(cleanup);

describe('ListRow', () => {
  it('renders the title, description, leading content and actions', () => {
    render(
      <ListRow title="Groceries" description="12 transactions" leading={<span>icon</span>}>
        <button>Edit</button>
      </ListRow>
    );

    expect(screen.getByRole('heading', { name: 'Groceries' })).toBeTruthy();
    expect(screen.getByText('12 transactions')).toBeTruthy();
    expect(screen.getByText('icon')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
  });
});
