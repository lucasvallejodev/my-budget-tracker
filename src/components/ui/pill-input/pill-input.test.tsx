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

  it('renders a styled select showing the current option', () => {
    render(
      <PillSelect
        aria-label="Type"
        value=""
        options={[
          { label: 'All types', value: '' },
          { label: 'Income', value: 'INCOME' },
        ]}
      />
    );

    const trigger = screen.getByRole('combobox', { name: 'Type' });

    expect(trigger.textContent).toContain('All types');
    expect(trigger.className).toContain('select__trigger--pill');
  });
});
