import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Text } from './text';

afterEach(cleanup);

describe('Text', () => {
  it('renders a paragraph by default', () => {
    render(<Text tone="muted">Sample data</Text>);

    expect(screen.getByText('Sample data').tagName).toBe('P');
  });

  it('renders the requested element', () => {
    render(<Text as="span">owed</Text>);

    expect(screen.getByText('owed').tagName).toBe('SPAN');
  });
});
