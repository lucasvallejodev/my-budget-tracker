import './metric-value.scss';

import { ReactNode } from 'react';

import { cn } from '@/lib/styles';

export type MetricValueSize = 'default' | 'fluid' | 'small';

const SizeClassNames: Record<MetricValueSize, string> = {
  default: '',
  fluid: 'metric-value--fluid',
  small: 'metric-value--small',
};

export function MetricValue({
  children,
  size = 'default',
}: {
  children: ReactNode;
  size?: MetricValueSize;
}) {
  return <div className={cn('metric-value', SizeClassNames[size])}>{children}</div>;
}
