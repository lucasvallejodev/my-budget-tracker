import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Badge } from './badge';

afterEach(cleanup);

describe('Badge', () => {
  it('renders its label after a decorative dot', () => {
    render(<Badge tone="warning">Needs review</Badge>);

    expect(screen.getByText('Needs review').textContent).toBe('•Needs review');
  });
});
