import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ColorSwatch } from './color-swatch';

afterEach(cleanup);

describe('ColorSwatch', () => {
  it('shows the colour and keeps its label', () => {
    render(<ColorSwatch color="#2563EB" aria-label="Colour #2563EB" />);

    expect(screen.getByLabelText('Colour #2563EB').style.background).toBeTruthy();
  });
});
