import './table.scss';

import { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/styles';

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="table">
      <table className="table__grid">{children}</table>
    </div>
  );
}

export function TableRow({ className, ...props }: ComponentProps<'tr'>) {
  return <tr className={cn('table__row', className)} {...props} />;
}

export function TableHeaderCell({ className, ...props }: ComponentProps<'th'>) {
  return <th scope="col" className={cn('table__header-cell', className)} {...props} />;
}

export function TableCell({ className, ...props }: ComponentProps<'td'>) {
  return <td className={cn('table__cell', className)} {...props} />;
}
