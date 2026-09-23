import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PromotionPanel } from './promotion-panel';

afterEach(cleanup);

describe('PromotionPanel', () => {
  it('links to its destination', () => {
    render(
      <PromotionPanel
        title="Your money, in focus"
        description="Explore your spending"
        href="/analytics"
        actionLabel="View analytics"
      />
    );

    expect(screen.getByRole('link', { name: 'View analytics' }).getAttribute('href')).toBe(
      '/analytics'
    );
  });
});
