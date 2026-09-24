import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Stack } from './stack';

afterEach(cleanup);

describe('Stack', () => {
  it('renders its children in order', () => {
    render(
      <Stack gap="small">
        <span>First</span>
        <span>Second</span>
      </Stack>
    );

    expect(screen.getByText('First').nextSibling).toBe(screen.getByText('Second'));
  });
});
