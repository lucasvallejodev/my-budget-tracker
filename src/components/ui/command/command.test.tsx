import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from './command';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('filters items by the search text', () => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  Element.prototype.scrollIntoView = vi.fn();
  render(
    <Command>
      <CommandInput placeholder="Search payees…" />
      <CommandList>
        <CommandEmpty>No payees found.</CommandEmpty>
        <CommandItem value="Grocer">Grocer</CommandItem>
        <CommandItem value="Landlord">Landlord</CommandItem>
      </CommandList>
    </Command>
  );

  fireEvent.change(screen.getByLabelText('Search payees…'), { target: { value: 'land' } });

  expect(screen.queryByText('Grocer')).toBeNull();
  expect(screen.getByText('Landlord')).toBeTruthy();
});
