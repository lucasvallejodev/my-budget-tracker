'use client';

import * as RadixPopover from '@radix-ui/react-popover';
import { ComponentProps } from 'react';

import { cn } from '@/lib/styles';

import styles from './controls.module.scss';
import { useDialogDepth } from './dialog';
import { layerZIndex, PopoverZIndex } from './layers';

export const Popover = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;

export function PopoverContent({
  className,
  sideOffset = 8,
  style,
  ...props
}: ComponentProps<typeof RadixPopover.Content>) {
  const depth = useDialogDepth();

  return (
    <RadixPopover.Portal>
      <RadixPopover.Content
        sideOffset={sideOffset}
        className={cn(styles.popover, className)}
        {...props}
        style={{ ...style, zIndex: layerZIndex(PopoverZIndex, depth) }}
      />
    </RadixPopover.Portal>
  );
}
