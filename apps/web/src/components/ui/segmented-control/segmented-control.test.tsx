import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SegmentedControl } from './segmented-control';

afterEach(cleanup);

const Options = [
  { label: 'EUR', value: 'EUR' },
  { label: 'USD', value: 'USD' },
  { label: '≈ All in EUR', value: 'converted' },
];

describe('SegmentedControl', () => {
  it('is a named radio group with one checked option', () => {
    render(<SegmentedControl label="Currency" options={Options} value="USD" onChange={vi.fn()} />);

    expect(screen.getByRole('radiogroup', { name: 'Currency' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'USD' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: 'EUR' }).getAttribute('tabindex')).toBe('-1');
  });

  it('changes by click and by arrow keys, wrapping around', () => {
    const onChange = vi.fn();

    render(<SegmentedControl label="Currency" options={Options} value="EUR" onChange={onChange} />);

    fireEvent.click(screen.getByRole('radio', { name: 'USD' }));
    expect(onChange).toHaveBeenLastCalledWith('USD');

    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith('converted');

    onChange.mockClear();
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'Tab' });
    expect(onChange).not.toHaveBeenCalled();
  });
});
