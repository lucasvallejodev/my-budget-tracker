import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { currentMonth, monthLabel, shiftMonth } from '../use-finance-data';
import { MonthPicker } from './month-picker';

afterEach(cleanup);

describe('MonthPicker', () => {
  it('moves back a month and cannot go past the current one', () => {
    const onChange = vi.fn();
    const month = currentMonth();

    render(<MonthPicker month={month} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));

    expect(onChange).toHaveBeenCalledWith(shiftMonth(month, -1));
    expect(screen.getByText(monthLabel(month))).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Next month' }).disabled).toBe(
      true
    );
  });
});
