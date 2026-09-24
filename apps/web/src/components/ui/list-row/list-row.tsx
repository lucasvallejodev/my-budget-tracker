import './list-row.scss';

import { ReactNode } from 'react';

import { cn } from '@/lib/styles';

export function ListRow({
  children,
  className,
  description,
  leading,
  title,
}: {
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
  leading?: ReactNode;
  title: ReactNode;
}) {
  return (
    <div className={cn('list-row', className)}>
      <div className="list-row__main">
        {leading}
        <div>
          <h3>{title}</h3>
          {description && <p className="list-row__description">{description}</p>}
        </div>
      </div>
      {children && <div className="list-row__actions">{children}</div>}
    </div>
  );
}
