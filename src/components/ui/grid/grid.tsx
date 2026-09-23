import './grid.scss';

import { ComponentProps } from 'react';

import { cn } from '@/lib/styles';

export function Grid({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('grid', className)} {...props} />;
}
