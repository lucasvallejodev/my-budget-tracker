import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ProgressBar } from './progress-bar';

afterEach(cleanup);

describe('ProgressBar', () => {
  it('exposes its value to assistive technology', () => {
    render(<ProgressBar label="Food budget" max={100} value={40} />);

    expect(screen.getByRole('progressbar', { name: 'Food budget' }).getAttribute('value')).toBe(
      '40'
    );
  });
});
