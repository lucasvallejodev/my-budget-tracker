import './cluster.scss';

import { ComponentProps } from 'react';

import { cn } from '@/lib/styles';

export type ClusterProps = ComponentProps<'div'> & { justify?: 'start' | 'end' | 'between' };

const JustifyClassNames: Record<NonNullable<ClusterProps['justify']>, string> = {
  between: 'cluster--between',
  end: 'cluster--end',
  start: '',
};

export function Cluster({ className, justify = 'start', ...props }: ClusterProps) {
  return <div className={cn('cluster', JustifyClassNames[justify], className)} {...props} />;
}
