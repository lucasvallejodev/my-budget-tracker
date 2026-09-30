import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Sparkline, sparklinePath } from './sparkline';

afterEach(cleanup);

describe('Sparkline', () => {
  it('draws a named line through the points, lowest at the bottom', () => {
    render(<Sparkline label="Net worth, last 6 months" points={[10, 20, 15]} />);

    expect(screen.getByRole('img', { name: 'Net worth, last 6 months' })).toBeTruthy();
    expect(sparklinePath([10, 20, 15])).toBe('M0.00 30.00 L50.00 2.00 L100.00 16.00');
  });

  it('draws a flat line for equal points and nothing for fewer than two', () => {
    expect(sparklinePath([5, 5])).toBe('M0.00 30.00 L100.00 30.00');
    expect(sparklinePath([5])).toBe('');

    const { container } = render(<Sparkline label="Empty" points={[]} />);

    expect(container.firstChild).toBeNull();
  });
});
