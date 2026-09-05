'use client';
import * as R from '@radix-ui/react-dialog';
import { ComponentProps } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/styles';
import s from './controls.module.scss';
export const Dialog = R.Root;
export const DialogTrigger = R.Trigger;
export const DialogClose = R.Close;
export function DialogContent({ children, className, ...props }: ComponentProps<typeof R.Content>) {
  return (
    <R.Portal>
      <R.Overlay className={s.overlay} />
      <R.Content aria-describedby={undefined} className={cn(s.dialog, className)} {...props}>
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
