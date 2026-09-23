import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DatePicker } from './date-picker';

afterEach(cleanup);

describe('DatePicker', () => {
  it('shows the selected date and clears it', () => {
    const onChange = vi.fn();

    render(<DatePicker label="From" value="2026-01-15" onChange={onChange} />);

    const trigger = screen.getByLabelText('From');

    expect(trigger.textContent).toContain('Jan 15, 2026');
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(onChange).toHaveBeenCalledWith('');
  });
});
