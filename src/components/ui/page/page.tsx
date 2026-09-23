import './page.scss';

import { ComponentProps } from 'react';

import { cn } from '@/lib/styles';

export function Page({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('page', className)} {...props} />;
}
