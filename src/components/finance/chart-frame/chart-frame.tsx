import './chart-frame.scss';

import { ReactNode } from 'react';

export function ChartFrame({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="chart-frame" role={label ? 'img' : undefined} aria-label={label}>
      {children}
    </div>
  );
}
