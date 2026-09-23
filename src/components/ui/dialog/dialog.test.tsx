import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Dialog, DialogContent, DialogTitle, DialogTrigger, useDialogDepth } from './dialog';
import { layerZIndex } from './layers';

afterEach(cleanup);

function Depth() {
  return <span>depth {useDialogDepth()}</span>;
}

describe('Dialog', () => {
  it('opens from its trigger and exposes the nesting depth', () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Edit budget</DialogTitle>
          <Depth />
        </DialogContent>
      </Dialog>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('dialog', { name: 'Edit budget' })).toBeTruthy();
    expect(screen.getByText('depth 1')).toBeTruthy();
  });

  it('raises nested layers above their parent', () => {
    expect(layerZIndex(80, 2)).toBeGreaterThan(layerZIndex(80, 1));
  });
});
