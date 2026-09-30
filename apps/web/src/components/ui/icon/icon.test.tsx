import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';

import { Icon } from './icon';

afterEach(cleanup);

it('falls back to the help icon for unknown names', () => {
  const { container } = render(<Icon icon="NotAnIcon" />);

  expect(container.querySelector('svg')).toBeTruthy();
});

it('draws an emoji chosen instead of an icon', () => {
  const { container } = render(<Icon icon="🛒" size={18} />);

  expect(container.textContent).toBe('🛒');
  expect(container.querySelector('svg')).toBeNull();
});
