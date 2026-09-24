import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Cluster } from './cluster';

afterEach(cleanup);

describe('Cluster', () => {
  it('forwards accessibility attributes', () => {
    render(
      <Cluster role="group" aria-label="Month">
        <button>Previous</button>
      </Cluster>
    );

    expect(screen.getByRole('group', { name: 'Month' })).toBeTruthy();
  });
});
