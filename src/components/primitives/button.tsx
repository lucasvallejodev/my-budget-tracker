import { ComponentProps } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/styles';
import s from './controls.module.scss';

export type ButtonProps = ComponentProps<'button'> & {
  asChild?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'icon';
};

export function Button({
  asChild,
  variant = 'default',
  size = 'default',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const Element = asChild ? Slot : 'button';

  return (
    <Element
      type={asChild ? undefined : type}
      className={cn(s.button, s[variant], s[size], className)}
      {...props}
    />
  );
}
