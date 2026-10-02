import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Dialog, DialogContent, DialogTitle } from '../dialog';
import { DialogFormFooter, saveLabel } from './dialog-form';

afterEach(cleanup);

describe('saveLabel', () => {
  it('says Save when editing and the create label otherwise', () => {
    expect(saveLabel(true)).toBe('Save');
    expect(saveLabel(false, 'Create payee')).toBe('Create payee');
  });
});

describe('DialogFormFooter', () => {
  it('shows a spinner while pending and cancels', () => {
    const onCancel = vi.fn();

    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Payee</DialogTitle>
          <DialogFormFooter isPending onCancel={onCancel} submitLabel="Save" />
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByRole('img', { name: 'Saving' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('renders a secondary action before the buttons', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Transaction</DialogTitle>
          <DialogFormFooter
            isPending={false}
            onCancel={vi.fn()}
            secondaryAction={<button type="button">Save as template</button>}
            submitLabel="Create"
          />
        </DialogContent>
      </Dialog>
    );

    const names = screen.getAllByRole('button').map(button => button.textContent);

    expect(names.indexOf('Save as template')).toBeLessThan(names.indexOf('Cancel'));
  });
});
