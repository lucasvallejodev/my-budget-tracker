import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { MetricIcon } from './metric-icon';

afterEach(cleanup);

describe('MetricIcon', () => {
  it('draws the icon of a metric kind on its tint', () => {
    const { container } = render(<MetricIcon kind="kept" />);
    const avatar = container.querySelector<HTMLElement>('.avatar');

    expect(avatar?.style.getPropertyValue('--avatar-color')).toBe('var(--color-metric-kept)');
    expect(avatar?.querySelector('svg')).toBeTruthy();
  });
});
