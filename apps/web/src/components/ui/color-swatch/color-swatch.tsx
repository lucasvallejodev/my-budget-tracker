import './color-swatch.scss';

import { ComponentProps } from 'react';

import { cn } from '@/lib/styles';

export function ColorSwatch({
  className,
  color,
  style,
  ...props
}: ComponentProps<'span'> & { color: string }) {
  return (
    <span
      className={cn('color-swatch', className)}
      style={{ ...style, background: color }}
      {...props}
    />
  );
}
