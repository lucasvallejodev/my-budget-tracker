'use client';
import * as R from '@radix-ui/react-dialog';
import { ComponentProps, createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/styles';
import s from './controls.module.scss';
const DialogLayer = createContext({
  depth: 0,
  childrenOpen: 0,
  register: (): (() => void) => () => {},
});
export function useDialogDepth() {
  return useContext(DialogLayer).depth;
}
export function Dialog({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
  ...props
}: ComponentProps<typeof R.Root>) {
  const { depth: parentDepth, register: registerParent } = useContext(DialogLayer);
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const [childrenOpen, setChildrenOpen] = useState(0);
  const open = controlledOpen ?? localOpen;
  const register = useCallback(() => {
    setChildrenOpen(n => n + 1);
    return () => setChildrenOpen(n => n - 1);
  }, []);
  useEffect(() => {
    if (open) return registerParent();
  }, [open, registerParent]);
  return (
    <DialogLayer.Provider value={{ depth: parentDepth + 1, childrenOpen, register }}>
      <R.Root
        {...props}
        open={open}
        onOpenChange={value => {
          setLocalOpen(value);
          onOpenChange?.(value);
        }}
      >
        {children}
      </R.Root>
    </DialogLayer.Provider>
  );
}
export const DialogTrigger = R.Trigger;
export const DialogClose = R.Close;
export function DialogContent({
  children,
  className,
  style,
  ...props
}: ComponentProps<typeof R.Content>) {
  const { depth, childrenOpen } = useContext(DialogLayer);
  const visibility = childrenOpen ? 'hidden' : 'visible';
  return (
    <R.Portal>
      <R.Overlay className={s.overlay} style={{ zIndex: 80 + depth * 20, visibility }} />
      <R.Content
        aria-describedby={undefined}
        className={cn(s.dialog, className)}
        {...props}
        style={{ ...style, zIndex: 81 + depth * 20, visibility }}
      >
        {children}
        <R.Close className={s.close} aria-label="Close dialog">
          <X size={20} />
        </R.Close>
      </R.Content>
    </R.Portal>
  );
}
export function DialogTitle({ className, ...props }: ComponentProps<typeof R.Title>) {
  return <R.Title className={cn(s.title, className)} {...props} />;
}
export function DialogDescription({ className, ...props }: ComponentProps<typeof R.Description>) {
  return <R.Description className={cn(s.description, className)} {...props} />;
}
export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn(s.footer, className)} {...props} />;
}
