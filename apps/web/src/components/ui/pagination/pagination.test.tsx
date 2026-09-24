import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Pagination } from './pagination';

afterEach(cleanup);

describe('Pagination', () => {
  it('moves between pages and disables the ends', () => {
    const onChange = vi.fn();

    render(<Pagination label="Table pagination" page={1} pages={3} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(onChange).toHaveBeenCalledWith(2);
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Previous' }).disabled).toBe(true);
    expect(screen.getByText('Page 1 of 3')).toBeTruthy();
  });

  it('uses icon buttons named after the item in the compact variant', () => {
    const onChange = vi.fn();

    render(
      <Pagination
        variant="compact"
        itemLabel="card"
        label="Cards"
        page={2}
        pages={2}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Previous card' }));

    expect(onChange).toHaveBeenCalledWith(1);
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Next card' }).disabled).toBe(
      true
    );
  });
});
