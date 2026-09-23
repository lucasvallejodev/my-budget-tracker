import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Notice } from './notice';

afterEach(cleanup);

describe('Notice', () => {
  it('renders a status message', () => {
    render(<Notice role="status">Preview only</Notice>);

    expect(screen.getByRole('status').textContent).toBe('Preview only');
  });
});
