'use client';
import * as R from '@radix-ui/react-popover';
import { ComponentProps } from 'react';
import { cn } from '@/lib/styles';
import s from './controls.module.scss';
export const Popover = R.Root;
export const PopoverTrigger = R.Trigger;
export function PopoverContent({
  className,
  sideOffset = 8,
  ...props
}: ComponentProps<typeof R.Content>) {
  return (
    <R.Portal>
      <R.Content sideOffset={sideOffset} className={cn(s.popover, className)} {...props} />
    </R.Portal>
  );
}
