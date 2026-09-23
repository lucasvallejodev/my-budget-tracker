import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import { Dialog, DialogClose, DialogContent, DialogTitle } from '../dialog';
import { EntityPicker } from './entity-picker';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('closes the picker, hides the parent, and restores its draft and focus after child dismissal', async () => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  render(
    <Dialog defaultOpen>
      <DialogContent>
        <DialogTitle>Transaction</DialogTitle>
        <input aria-label="Description" defaultValue="Saved draft" />
        <EntityPicker
          label="accounts"
          items={[]}
          pending={false}
          error={false}
          create={(_created, { onCloseAutoFocus, ...props }) => (
            <Dialog {...props}>
              <DialogContent onCloseAutoFocus={onCloseAutoFocus}>
                <DialogTitle>Create account</DialogTitle>
                <DialogClose>Cancel account</DialogClose>
              </DialogContent>
            </Dialog>
          )}
        />
      </DialogContent>
    </Dialog>
  );
  const parent = screen.getByRole('dialog', { name: 'Transaction' });
  const picker = screen.getByRole('button', { name: 'Select accounts' });

  fireEvent.click(picker);
  expect(screen.getByPlaceholderText('Search accounts…')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Create new' }));
  expect(screen.queryByPlaceholderText('Search accounts…')).toBeNull();
  expect(parent.style.visibility).toBe('hidden');
  expect(screen.getByRole('dialog', { name: 'Create account' }).style.visibility).toBe('visible');
  fireEvent.click(screen.getByRole('button', { name: 'Cancel account' }));
  await waitFor(() => expect(parent.style.visibility).toBe('visible'));
  expect(screen.getByLabelText<HTMLInputElement>('Description').value).toBe('Saved draft');
  await waitFor(() => expect(document.activeElement).toBe(picker));
});
