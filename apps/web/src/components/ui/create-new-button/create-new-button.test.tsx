import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import { CreateNewButton } from './create-new-button';

afterEach(cleanup);

it('calls back when pressed', () => {
  const onClick = vi.fn();

  render(<CreateNewButton onClick={onClick} />);
  fireEvent.click(screen.getByRole('button', { name: 'Create new' }));

  expect(onClick).toHaveBeenCalledOnce();
});
