'use client';
import * as R from '@radix-ui/react-select';
import { ComponentProps } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/styles';
import s from './controls.module.scss';
export const Select = R.Root;
export const SelectValue = R.Value;
export const SelectGroup = R.Group;
export function SelectLabel(props: ComponentProps<typeof R.Label>) {
  return <R.Label className={s.label} {...props} />;
}
export function SelectTrigger({ className, children, ...props }: ComponentProps<typeof R.Trigger>) {
  return (
    <R.Trigger className={cn(s.selectTrigger, className)} {...props}>
      {children}
      <R.Icon>
        <ChevronDown size={16} />
      </R.Icon>
    </R.Trigger>
  );
}
export function SelectContent({ children, className, ...props }: ComponentProps<typeof R.Content>) {
  return (
    <R.Portal>
      <R.Content
        className={cn(s.selectContent, className)}
        position="popper"
        sideOffset={5}
        {...props}
      >
        <R.Viewport>{children}</R.Viewport>
      </R.Content>
    </R.Portal>
  );
}
export function SelectItem({ children, ...props }: ComponentProps<typeof R.Item>) {
  return (
    <R.Item className={s.selectItem} {...props}>
      <R.ItemText>{children}</R.ItemText>
      <R.ItemIndicator>
        <Check size={14} />
      </R.ItemIndicator>
    </R.Item>
  );
}
