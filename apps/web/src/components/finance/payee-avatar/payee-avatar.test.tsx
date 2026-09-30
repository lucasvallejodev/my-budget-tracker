import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PayeeAvatar } from './payee-avatar';

afterEach(cleanup);

describe('PayeeAvatar', () => {
  it('draws the bundled logo of a known brand on its colour', () => {
    const { container } = render(<PayeeAvatar name="Netflix" />);
    const avatar = container.querySelector<HTMLElement>('.avatar');

    expect(avatar?.querySelector('path')).toBeTruthy();
    expect(avatar?.style.getPropertyValue('--avatar-background')).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('falls back to initials on a tint picked from the name', () => {
    const { container } = render(<PayeeAvatar name="Corner Café" size="small" />);
    const avatar = container.querySelector<HTMLElement>('.avatar');

    expect(avatar?.textContent).toBe('CC');
    expect(avatar?.style.getPropertyValue('--avatar-background')).toMatch(/^var\(--color-avatar-/);
  });

  it('uses the icon chosen for the payee, tinted in its colour', () => {
    const { container } = render(<PayeeAvatar name="Corner Café" icon="☕" color="#9333EA" />);
    const avatar = container.querySelector<HTMLElement>('.avatar');

    expect(avatar?.textContent).toBe('☕');
    expect(avatar?.style.getPropertyValue('--avatar-color')).toBe('#9333EA');
  });

  it('paints initials on the chosen colour', () => {
    const { container } = render(<PayeeAvatar name="Corner Café" color="#9333EA" />);

    expect(
      container.querySelector<HTMLElement>('.avatar')?.style.getPropertyValue('--avatar-background')
    ).toBe('#9333EA');
  });
});
