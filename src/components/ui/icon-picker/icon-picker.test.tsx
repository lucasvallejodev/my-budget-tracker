import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { IconPicker } from './icon-picker';

afterEach(cleanup);

describe('IconPicker', () => {
  it('filters icons and reports the choice', () => {
    const onChange = vi.fn();

    render(<IconPicker value="Wallet" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Search icons'), { target: { value: 'wallet' } });
    fireEvent.click(screen.getByRole('option', { name: 'Wallet' }));

    expect(onChange).toHaveBeenCalledWith('Wallet');
    expect(screen.getByRole('option', { name: 'Wallet' }).getAttribute('aria-selected')).toBe(
      'true'
    );
  });

  it('says when nothing matches', () => {
    render(<IconPicker value="" onChange={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Search icons'), { target: { value: 'zzzz' } });

    expect(screen.getByText('No icons match.')).toBeTruthy();
  });
});
