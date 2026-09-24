import './icon-tile.scss';

import { ReactNode } from 'react';

import { cn } from '@/lib/styles';

export function IconTile({ children, color }: { children: ReactNode; color?: string | null }) {
  return (
    <span
      className={cn('icon-tile', { 'icon-tile--filled': !!color })}
      style={color ? { background: color } : undefined}
    >
      {children}
    </span>
  );
}
