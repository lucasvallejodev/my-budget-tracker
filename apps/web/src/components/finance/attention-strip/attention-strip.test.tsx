import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AttentionStrip } from './attention-strip';

afterEach(cleanup);

describe('AttentionStrip', () => {
  it('links up to three items to the place that fixes them', () => {
    render(
      <AttentionStrip
        items={[
          {
            href: '/review',
            id: 'review',
            label: '2 transactions need a category',
            tone: 'brand',
          },
          {
            href: '/budgets',
            id: 'over',
            label: 'Groceries is €6.14 over budget',
            tone: 'danger',
          },
          {
            href: '/budgets',
            id: 'fast',
            label: '2 budgets are spending too fast',
            tone: 'warning',
          },
          {
            href: '/x',
            id: 'extra',
            label: 'Hidden',
            tone: 'brand',
          },
        ]}
      />
    );

    expect(screen.getByRole('navigation', { name: 'Needs attention' })).toBeTruthy();
    expect(
      screen.getByRole('link', { name: '2 transactions need a category' }).getAttribute('href')
    ).toBe('/review');
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  it('disappears when nothing needs attention', () => {
    const { container } = render(<AttentionStrip items={[]} />);

    expect(container.firstChild).toBeNull();
  });
});
