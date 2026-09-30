import './stat.scss';

import { ArrowDown, ArrowUp } from 'lucide-react';
import { ReactNode } from 'react';

import { cn } from '@/lib/styles';

export type StatDelta = {
  good: boolean;
  label: string;
  rising: boolean;
};

export type StatSize = 'default' | 'hero' | 'large';

const SizeClassNames: Record<StatSize, string> = {
  default: '',
  hero: 'stat--hero',
  large: 'stat--large',
};

export function Stat({
  delta,
  label,
  leading,
  meta,
  size = 'default',
  value,
}: {
  delta?: StatDelta;
  label: ReactNode;
  leading?: ReactNode;
  meta?: ReactNode;
  size?: StatSize;
  value: ReactNode;
}) {
  const DeltaIcon = delta?.rising ? ArrowUp : ArrowDown;

  return (
    <div className={cn('stat', SizeClassNames[size])}>
      <div className="stat__label">
        {leading}
        {label}
      </div>
      <div className="stat__value">{value}</div>
      {(delta !== undefined || meta !== undefined) && (
        <div className="stat__meta">
          {delta && (
            <span className={cn('stat__delta', { 'stat__delta--bad': !delta.good })}>
              <DeltaIcon aria-hidden />
              {delta.label}
            </span>
          )}
          {meta}
        </div>
      )}
    </div>
  );
}
