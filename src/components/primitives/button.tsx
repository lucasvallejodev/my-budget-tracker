import { Slot } from '@radix-ui/react-slot';
import { ComponentProps } from 'react';

import { cn } from '@/lib/styles';

import styles from './controls.module.scss';

export type ButtonProps = ComponentProps<'button'> & {
  asChild?: boolean;
  size?: 'default' | 'sm' | 'icon';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
};

export function Button({
  asChild,
  className,
  size = 'default',
  type = 'button',
  variant = 'default',
  ...props
}: ButtonProps) {
  const Element = asChild ? Slot : 'button';

  return (
    <Element
      type={asChild ? undefined : type}
      className={cn(styles.button, styles[variant], styles[size], className)}
      {...props}
    />
  );
}
