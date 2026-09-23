import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PillInput, PillSelect } from './pill-input';

afterEach(cleanup);

describe('PillInput', () => {
  it('forwards input changes', () => {
    const onChange = vi.fn();

    render(<PillInput aria-label="Search" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'rent' } });

    expect(onChange).toHaveBeenCalledOnce();
  });

  it('renders a native select', () => {
    render(
      <PillSelect aria-label="Type">
        <option>Income</option>
      </PillSelect>
    );

    expect(screen.getByRole('combobox', { name: 'Type' })).toBeTruthy();
  });
});
