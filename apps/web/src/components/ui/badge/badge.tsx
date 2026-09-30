import './badge.scss';

import { ReactNode } from 'react';

import { cn } from '@/lib/styles';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const ToneClassNames: Record<BadgeTone, string> = {
  danger: 'badge--danger',
  info: 'badge--info',
  neutral: 'badge--neutral',
  success: '',
  warning: 'badge--warning',
};

export function Badge({
  children,
  icon,
  tone = 'success',
}: {
  children: ReactNode;
  icon?: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span className={cn('badge', ToneClassNames[tone])}>
      {icon}
      {children}
    </span>
  );
}
