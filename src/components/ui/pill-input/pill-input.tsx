import './pill-input.scss';

import { ComponentProps } from 'react';

import { cn } from '@/lib/styles';

export function PillInput({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn('pill-input', className)} {...props} />;
}

export function PillSelect({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn('pill-input', className)} {...props} />;
}
