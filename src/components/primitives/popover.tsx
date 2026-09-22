'use client';
import * as R from '@radix-ui/react-popover';
import { ComponentProps } from 'react';
import { cn } from '@/lib/styles';
import s from './controls.module.scss';
import { useDialogDepth } from './dialog';
export const Popover = R.Root;
export const PopoverTrigger = R.Trigger;
export function PopoverContent({
  className,
  sideOffset = 8,
  style,
  ...props
}: ComponentProps<typeof R.Content>) {
  const depth = useDialogDepth();
  return (
    <R.Portal>
      <R.Content
        sideOffset={sideOffset}
        className={cn(s.popover, className)}
        {...props}
        style={{ ...style, zIndex: 90 + depth * 20 }}
      />
    </R.Portal>
  );
}
