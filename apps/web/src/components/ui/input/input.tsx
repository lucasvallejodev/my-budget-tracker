import './input.scss';

import { ComponentProps } from 'react';

import { cn } from '@/lib/styles';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn('input', className)} {...props} />;
}
