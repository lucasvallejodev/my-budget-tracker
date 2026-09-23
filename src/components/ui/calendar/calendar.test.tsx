import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import { Calendar } from './calendar';

afterEach(cleanup);

it('reports the chosen day', () => {
  const onSelect = vi.fn();

  render(<Calendar mode="single" defaultMonth={new Date(2026, 0, 1)} onSelect={onSelect} />);
  fireEvent.click(screen.getByRole('button', { name: /January 15/ }));

  expect(onSelect).toHaveBeenCalledOnce();
});
