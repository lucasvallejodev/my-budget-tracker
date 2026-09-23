import './button.scss';

import { Slot } from '@radix-ui/react-slot';
import { ComponentProps } from 'react';

import { cn } from '@/lib/styles';

export type ButtonProps = ComponentProps<'button'> & {
  asChild?: boolean;
  size?: 'default' | 'sm' | 'icon';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
};

const VariantClassNames: Record<NonNullable<ButtonProps['variant']>, string> = {
  default: '',
  destructive: 'button--destructive',
  ghost: 'button--ghost',
  outline: 'button--outline',
  secondary: 'button--secondary',
};

const SizeClassNames: Record<NonNullable<ButtonProps['size']>, string> = {
  default: '',
  icon: 'button--icon',
  sm: 'button--sm',
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
      className={cn('button', VariantClassNames[variant], SizeClassNames[size], className)}
      {...props}
    />
  );
}
