import './badge.scss';

import { ReactNode } from 'react';

import { cn } from '@/lib/styles';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral';

const ToneClassNames: Record<BadgeTone, string> = {
  danger: 'badge--danger',
  neutral: 'badge--neutral',
  success: '',
  warning: 'badge--warning',
};

export function Badge({ children, tone = 'success' }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span className={cn('badge', ToneClassNames[tone])}>
      <span aria-hidden="true">•</span>
      {children}
    </span>
  );
}
