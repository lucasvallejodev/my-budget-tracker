import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FilterBar } from './filter-bar';

afterEach(cleanup);

describe('FilterBar', () => {
  it('renders its filters', () => {
    render(
      <FilterBar>
        <label>
          Search
          <input />
        </label>
      </FilterBar>
    );

    expect(screen.getByLabelText('Search')).toBeTruthy();
  });
});
