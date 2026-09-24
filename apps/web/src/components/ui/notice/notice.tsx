import './notice.scss';

import { ComponentProps } from 'react';

import { cn } from '@/lib/styles';

export function Notice({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('notice', className)} {...props} />;
}
