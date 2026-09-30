import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GroupColors } from '@/styles/theme';
import { paletteColorName } from '@coinkeeper/shared/lib/labels';

import { ColorPicker } from './color-picker';

afterEach(cleanup);

describe('ColorPicker', () => {
  it('marks the current colour and reports a new one', () => {
    const onChange = vi.fn();
    const [first, second] = GroupColors;

    render(<ColorPicker value={first} onChange={onChange} />);

    expect(
      screen.getByRole('radio', { name: paletteColorName(first) }).getAttribute('aria-checked')
    ).toBe('true');
    fireEvent.click(screen.getByRole('radio', { name: paletteColorName(second) }));
    expect(onChange).toHaveBeenCalledWith(second);
  });

  it('names colours in words and moves between them with the arrow keys', () => {
    const onChange = vi.fn();
    const [first, second] = GroupColors;

    render(<ColorPicker value={first} onChange={onChange} />);

    const current = screen.getByRole('radio', { name: 'Amber' });

    expect(current.getAttribute('tabindex')).toBe('0');
    expect(screen.getByRole('radio', { name: 'Blue' }).getAttribute('tabindex')).toBe('-1');

    fireEvent.keyDown(current, { key: 'ArrowRight' });

    expect(onChange).toHaveBeenCalledWith(second);
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Blue' }));
  });

  it('upper-cases a custom colour', () => {
    const onChange = vi.fn();

    render(<ColorPicker value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Custom colour'), { target: { value: '#abcdef' } });

    expect(onChange).toHaveBeenCalledWith('#ABCDEF');
  });
});
