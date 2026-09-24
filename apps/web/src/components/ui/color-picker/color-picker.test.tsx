import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GroupColors } from '@/styles/theme';

import { ColorPicker } from './color-picker';

afterEach(cleanup);

describe('ColorPicker', () => {
  it('marks the current colour and reports a new one', () => {
    const onChange = vi.fn();
    const [first, second] = GroupColors;

    render(<ColorPicker value={first} onChange={onChange} />);

    expect(screen.getByRole('radio', { name: first }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('radio', { name: second }));
    expect(onChange).toHaveBeenCalledWith(second);
  });

  it('upper-cases a custom colour', () => {
    const onChange = vi.fn();

    render(<ColorPicker value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Custom colour'), { target: { value: '#abcdef' } });

    expect(onChange).toHaveBeenCalledWith('#ABCDEF');
  });
});
