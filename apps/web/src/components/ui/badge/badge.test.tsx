import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Badge } from './badge';

afterEach(cleanup);

describe('Badge', () => {
  it('renders its label with an optional icon', () => {
    render(
      <Badge tone="warning" icon={<svg data-testid="icon" />}>
        Needs review
      </Badge>
    );

    expect(screen.getByText('Needs review').textContent).toBe('Needs review');
    expect(screen.getByTestId('icon')).toBeTruthy();
  });
});
