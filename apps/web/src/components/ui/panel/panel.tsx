import './panel.scss';

import { ReactNode } from 'react';

import { cn } from '@/lib/styles';

export function Panel({
  action,
  children,
  className,
  description,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: string;
  title?: string;
}) {
  return (
    <section className={cn('panel', className)}>
      {title && (
        <div className="panel__head">
          <div>
            <h2>{title}</h2>
            {description && <p className="panel__description">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
