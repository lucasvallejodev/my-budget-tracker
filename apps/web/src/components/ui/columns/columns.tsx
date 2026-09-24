import './columns.scss';

import { ComponentProps } from 'react';

import { cn } from '@/lib/styles';

export function Columns({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('columns', className)} {...props} />;
}
