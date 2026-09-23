import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { IconTile } from './icon-tile';

afterEach(cleanup);

describe('IconTile', () => {
  it('paints the group colour behind the icon', () => {
    render(<IconTile color="#DC2626">icon</IconTile>);

    expect(screen.getByText('icon').style.background).toBeTruthy();
  });

  it('keeps the accent background without a colour', () => {
    render(<IconTile>icon</IconTile>);

    expect(screen.getByText('icon').getAttribute('style')).toBeNull();
  });
});
