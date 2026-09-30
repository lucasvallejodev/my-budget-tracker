import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Skeleton, SkeletonText } from './skeleton';

afterEach(cleanup);

describe('Skeleton', () => {
  it('draws decorative placeholders in the shape asked for', () => {
    const { container } = render(<Skeleton shape="card" />);

    expect(container.firstElementChild?.className).toBe('skeleton skeleton--card');
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });

  it('announces what is loading behind placeholder lines', () => {
    const { container } = render(<SkeletonText label="Loading rules…" lines={4} />);

    expect(screen.getByRole('status').textContent).toBe('Loading rules…');
    expect(container.querySelectorAll('.skeleton')).toHaveLength(4);
  });
});
