import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Page } from './page';

afterEach(cleanup);

describe('Page', () => {
  it('can announce a loading state', () => {
    render(<Page role="status">Loading…</Page>);

    expect(screen.getByRole('status').textContent).toBe('Loading…');
  });
});
