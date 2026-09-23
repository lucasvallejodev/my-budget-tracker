import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

afterEach(cleanup);

it('shows the selected option in the trigger', () => {
  render(
    <Select value="EUR">
      <SelectTrigger aria-label="Currency">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="EUR">Euro</SelectItem>
          <SelectItem value="USD">Dollar</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );

  expect(screen.getByRole('combobox', { name: 'Currency' }).textContent).toContain('Euro');
});
