import './metric-value.scss';

import { ReactNode } from 'react';

import { cn } from '@/lib/styles';

export function MetricValue({
  children,
  size = 'default',
}: {
  children: ReactNode;
  size?: 'default' | 'fluid';
}) {
  return (
    <div className={cn('metric-value', { 'metric-value--fluid': size === 'fluid' })}>
      {children}
    </div>
  );
}
