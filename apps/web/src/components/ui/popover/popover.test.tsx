import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';

import { Popover, PopoverContent, PopoverTrigger } from './popover';

afterEach(cleanup);

it('opens its content from the trigger', () => {
  render(
    <Popover>
      <PopoverTrigger>Notifications</PopoverTrigger>
      <PopoverContent>All caught up</PopoverContent>
    </Popover>
  );

  fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));

  expect(screen.getByText('All caught up')).toBeTruthy();
});
