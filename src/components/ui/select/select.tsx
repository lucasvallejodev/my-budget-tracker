'use client';

import './select.scss';

import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { ComponentProps } from 'react';

import { cn } from '@/lib/styles';

import { layerZIndex, PopoverZIndex, useDialogDepth } from '../dialog';

export const Select = RadixSelect.Root;
export const SelectValue = RadixSelect.Value;
export const SelectGroup = RadixSelect.Group;

export function SelectLabel(props: ComponentProps<typeof RadixSelect.Label>) {
  return <RadixSelect.Label className="select__label" {...props} />;
}

export function SelectTrigger({
  children,
  className,
  ...props
}: ComponentProps<typeof RadixSelect.Trigger>) {
  return (
    <RadixSelect.Trigger className={cn('select__trigger', className)} {...props}>
      {children}
      <RadixSelect.Icon>
        <ChevronDown size={16} />
      </RadixSelect.Icon>
    </RadixSelect.Trigger>
  );
}

export function SelectContent({
  children,
  className,
  style,
  ...props
}: ComponentProps<typeof RadixSelect.Content>) {
  const depth = useDialogDepth();

  return (
    <RadixSelect.Portal>
      <RadixSelect.Content
        className={cn('select__content', className)}
        position="popper"
        sideOffset={5}
        style={{ ...style, zIndex: layerZIndex(PopoverZIndex, depth) }}
        {...props}
      >
        <RadixSelect.Viewport>{children}</RadixSelect.Viewport>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  );
}

export function SelectItem({ children, ...props }: ComponentProps<typeof RadixSelect.Item>) {
  return (
    <RadixSelect.Item className="select__item" {...props}>
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
      <RadixSelect.ItemIndicator>
        <Check size={14} />
      </RadixSelect.ItemIndicator>
    </RadixSelect.Item>
  );
}
