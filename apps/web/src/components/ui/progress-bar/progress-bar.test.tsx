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

describe('ProgressBar tones', () => {
  it('colours the fill by tone and labels the marker', () => {
    const { container } = render(
      <ProgressBar
        label="Month"
        max={100}
        value={90}
        tone="danger"
        size="large"
        marker={93}
        markerLabel="Today"
      />
    );

    expect(container.firstElementChild?.className).toBe(
      'progress-bar progress-bar--danger progress-bar--large progress-bar--labelled'
    );
    expect(screen.getByText('Today').style.insetInlineStart).toBe('93%');
  });

  it('accepts a custom fill colour such as a category group colour', () => {
    const { container } = render(<ProgressBar label="Food" max={100} value={10} color="#DC2626" />);

    expect(
      (container.firstElementChild as HTMLElement).style.getPropertyValue('--progress-bar-fill')
    ).toBe('#DC2626');
  });

  it('keeps a marker label near the end inside the bar', () => {
    render(<ProgressBar label="Month" max={100} value={90} marker={100} markerLabel="Today" />);

    expect(screen.getByText('Today').className).toBe(
      'progress-bar__marker-label progress-bar__marker-label--end'
    );
  });
});
