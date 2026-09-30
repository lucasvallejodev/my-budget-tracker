import { useRef, useState } from 'react';

export type DialogState<Value> = {
  close: () => void;
  open: (value: Value) => void;
  value: Value | null;
};

const focusedElement = (): HTMLElement | null =>
  document.activeElement instanceof HTMLElement ? document.activeElement : null;

const focusIfConnected = (element: HTMLElement): void => {
  if (element.isConnected) element.focus();
};

/**
 * Holds the value of a dialog that is rendered only while open, and gives focus back to the
 * control that opened it once it closes.
 *
 * @remarks
 * Radix returns focus to its own trigger, but dialogs mounted from state have none, so without
 * this focus falls to the page body. The opener is focused on the next frame, after the dialog
 * has unmounted, and only if it is still in the document.
 *
 * @returns The current `value` (`null` while closed), `open(value)` and `close()`.
 *
 * @example
 * ```tsx
 * const editing = useDialogState<{ group: Group }>();
 * <Button onClick={() => editing.open({ group })}>Edit</Button>
 * {editing.value && <GroupDialog group={editing.value.group} onClose={editing.close} />}
 * ```
 */
export const useDialogState = <Value>(): DialogState<Value> => {
  const [value, setValue] = useState<Value | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  const open = (next: Value): void => {
    opener.current = focusedElement();
    setValue(next);
  };

  const close = (): void => {
    const target = opener.current;

    opener.current = null;
    setValue(null);
    if (target) requestAnimationFrame((): void => focusIfConnected(target));
  };

  return {
    close,
    open,
    value,
  };
};
