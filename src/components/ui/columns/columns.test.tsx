import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Columns } from './columns';

afterEach(cleanup);

describe('Columns', () => {
  it('renders the main and side columns', () => {
    render(
      <Columns>
        <div>Main</div>
        <div>Side</div>
      </Columns>
    );

    expect(screen.getByText('Main').parentElement).toBe(screen.getByText('Side').parentElement);
  });
});
