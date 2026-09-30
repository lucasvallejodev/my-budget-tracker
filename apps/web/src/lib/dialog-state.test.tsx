import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useDialogState } from './dialog-state';

afterEach(cleanup);

function Example() {
  const dialog = useDialogState<{ name: string }>();

  return (
    <>
      <button type="button" onClick={() => dialog.open({ name: 'Groceries' })}>
        Edit
      </button>
      {dialog.value && (
        <div role="dialog" aria-label={dialog.value.name}>
          <button type="button" autoFocus onClick={dialog.close}>
            Close
          </button>
        </div>
      )}
    </>
  );
}

describe('useDialogState', () => {
  it('opens with a value and returns focus to the opener on close', async () => {
    render(<Example />);

    const opener = screen.getByRole('button', { name: 'Edit' });

    opener.focus();
    fireEvent.click(opener);

    expect(screen.getByRole('dialog', { name: 'Groceries' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(opener));
  });

  it('closes quietly when there is no opener to return to', async () => {
    const outside = document.createElement('button');

    document.body.append(outside);

    const { result } = renderHook(() => useDialogState<string>());

    outside.focus();
    act(() => result.current.open('first'));
    outside.remove();
    act(() => result.current.close());

    await waitFor(() => expect(result.current.value).toBeNull());
    expect(document.activeElement).toBe(document.body);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    svg.setAttribute('tabindex', '0');
    document.body.append(svg);
    svg.focus();
    act(() => result.current.open('second'));
    act(() => result.current.close());

    expect(result.current.value).toBeNull();
    act(() => result.current.close());
    svg.remove();
  });
});
