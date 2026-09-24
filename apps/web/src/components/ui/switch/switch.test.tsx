import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import { ToggleSwitch } from './switch';

afterEach(cleanup);

it('toggles and reports the new state', () => {
  const onCheckedChange = vi.fn();

  render(<ToggleSwitch aria-label="Converted totals" onCheckedChange={onCheckedChange} />);
  fireEvent.click(screen.getByRole('switch', { name: 'Converted totals' }));

  expect(onCheckedChange).toHaveBeenCalledWith(true);
});
