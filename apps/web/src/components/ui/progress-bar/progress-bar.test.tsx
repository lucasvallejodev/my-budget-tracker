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

  it('draws an optional marker as a share of the maximum, hidden from assistive technology', () => {
    const { container } = render(
      <ProgressBar label="Food budget" max={400} value={300} marker={240} />
    );

    const marker = container.querySelector<HTMLElement>('.progress-bar__marker');

    expect(marker?.style.insetInlineStart).toBe('60%');
    expect(marker?.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps the marker inside the bar', () => {
    const { container } = render(<ProgressBar label="Food" max={100} value={10} marker={250} />);

    expect(
      container.querySelector<HTMLElement>('.progress-bar__marker')?.style.insetInlineStart
    ).toBe('100%');
  });
});
