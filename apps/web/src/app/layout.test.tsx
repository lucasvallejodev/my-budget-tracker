import { isValidElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import RootLayout from './layout';

vi.mock('next/font/google', () => ({
  Inter: () => ({ variable: 'inter-variable' }),
  Source_Serif_4: () => ({ variable: 'source-serif-variable' }),
}));

describe('RootLayout', () => {
  it('exposes the text and display font variables on the html element', () => {
    const page = RootLayout({ children: null });

    expect(isValidElement<{ className: string }>(page)).toBe(true);
    expect(page.props.className.split(' ')).toEqual(['inter-variable', 'source-serif-variable']);
  });
});
