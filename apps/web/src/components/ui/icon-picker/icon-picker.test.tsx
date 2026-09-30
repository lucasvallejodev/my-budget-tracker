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

  it('accepts a single emoji when emoji are allowed', () => {
    const onChange = vi.fn();

    render(<IconPicker allowEmoji value="Wallet" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Emoji'), { target: { value: 'abc' } });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Emoji').getAttribute('aria-invalid')).toBe('true');

    fireEvent.change(screen.getByLabelText('Emoji'), { target: { value: '🛒' } });

    expect(onChange).toHaveBeenCalledWith('🛒');
  });

  it('hides the emoji field by default', () => {
    render(<IconPicker value="" onChange={vi.fn()} />);

    expect(screen.queryByLabelText('Emoji')).toBeNull();
  });
});
