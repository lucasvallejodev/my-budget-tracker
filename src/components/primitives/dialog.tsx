'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { ComponentProps, createContext, useCallback, useContext, useEffect, useState } from 'react';

import { cn } from '@/lib/styles';

import styles from './controls.module.scss';
import { DialogContentZIndex, DialogOverlayZIndex, layerZIndex } from './layers';

type DialogLayerValue = {
  childrenOpen: number;
  depth: number;
  register: () => () => void;
};

const DialogLayer = createContext<DialogLayerValue>({
  childrenOpen: 0,
  depth: 0,
  register: () => () => undefined,
});

export function useDialogDepth() {
  return useContext(DialogLayer).depth;
}

export function Dialog({
  children,
  defaultOpen = false,
  onOpenChange,
  open: controlledOpen,
  ...props
}: ComponentProps<typeof RadixDialog.Root>) {
  const { depth: parentDepth, register: registerParent } = useContext(DialogLayer);
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const [childrenOpen, setChildrenOpen] = useState(0);
  const open = controlledOpen ?? localOpen;

  const register = useCallback(() => {
    setChildrenOpen(count => count + 1);

    return () => setChildrenOpen(count => count - 1);
  }, []);

  useEffect(() => {
    if (open) return registerParent();
  }, [open, registerParent]);

  return (
    <DialogLayer.Provider
      value={{
        childrenOpen,
        depth: parentDepth + 1,
        register,
      }}
    >
      <RadixDialog.Root
        {...props}
        open={open}
        onOpenChange={value => {
          setLocalOpen(value);
          onOpenChange?.(value);
        }}
      >
        {children}
      </RadixDialog.Root>
    </DialogLayer.Provider>
  );
}

export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;

export function DialogContent({
  children,
  className,
  style,
  ...props
}: ComponentProps<typeof RadixDialog.Content>) {
  const { childrenOpen, depth } = useContext(DialogLayer);
  const visibility = childrenOpen ? 'hidden' : 'visible';

  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay
        className={styles.overlay}
        style={{ visibility, zIndex: layerZIndex(DialogOverlayZIndex, depth) }}
      />
      <RadixDialog.Content
        aria-describedby={undefined}
        className={cn(styles.dialog, className)}
        {...props}
        style={{
          ...style,
          visibility,
          zIndex: layerZIndex(DialogContentZIndex, depth),
        }}
      >
        {children}
        <RadixDialog.Close className={styles.close} aria-label="Close dialog">
          <X size={20} />
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof RadixDialog.Title>) {
  return <RadixDialog.Title className={cn(styles.title, className)} {...props} />;
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof RadixDialog.Description>) {
  return <RadixDialog.Description className={cn(styles.description, className)} {...props} />;
}

export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn(styles.footer, className)} {...props} />;
}
