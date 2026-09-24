import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import { Input } from './input';

afterEach(cleanup);

it('forwards value changes', () => {
  const onChange = vi.fn();

  render(<Input aria-label="Name" onChange={onChange} />);
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Rent' } });

  expect(onChange).toHaveBeenCalledOnce();
});
