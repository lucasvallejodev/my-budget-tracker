import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import { Menu, MenuContent, MenuItem, MenuTrigger } from './menu';

afterEach(cleanup);

it('runs the selected item', () => {
  const onSelect = vi.fn();

  render(
    <Menu open>
      <MenuTrigger>Actions</MenuTrigger>
      <MenuContent>
        <MenuItem onSelect={onSelect}>Edit</MenuItem>
      </MenuContent>
    </Menu>
  );
  fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));

  expect(onSelect).toHaveBeenCalledOnce();
});
