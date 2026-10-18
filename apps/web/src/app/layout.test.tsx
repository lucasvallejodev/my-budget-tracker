import { isValidElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import RootLayout from './layout';

vi.mock('next/font/google', () => ({
  Outfit: () => ({ variable: 'outfit-variable' }),
}));

describe('RootLayout', () => {
  it('exposes the Outfit font variable on the html element', () => {
    const page = RootLayout({ children: null });

    expect(isValidElement<{ className: string }>(page)).toBe(true);
    expect(page.props.className).toBe('outfit-variable');
  });
});
