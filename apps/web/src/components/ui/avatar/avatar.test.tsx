import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Avatar } from './avatar';

afterEach(cleanup);

describe('Avatar', () => {
  it('tints the avatar with the given colour and hides it from assistive technology', () => {
    render(<Avatar color="#DC2626">icon</Avatar>);

    const avatar = screen.getByText('icon');

    expect(avatar.style.getPropertyValue('--avatar-color')).toBe('#DC2626');
    expect(avatar.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps the neutral tint without a colour', () => {
    render(<Avatar>icon</Avatar>);

    expect(screen.getByText('icon').getAttribute('style')).toBeNull();
  });

  it('draws accounts as small rounded squares', () => {
    render(
      <Avatar shape="square" size="small">
        icon
      </Avatar>
    );

    expect(screen.getByText('icon').className).toBe('avatar avatar--square avatar--small');
  });

  it('paints a solid fill and names a labelled avatar', () => {
    render(
      <Avatar fill={{ background: '#E50914', foreground: '#FFFFFF' }} label="Netflix">
        N
      </Avatar>
    );

    const avatar = screen.getByRole('img', { name: 'Netflix' });

    expect(avatar.className).toContain('avatar--filled');
    expect(avatar.style.getPropertyValue('--avatar-background')).toBe('#E50914');
  });
});
