import './list-group.scss';

import { ReactNode } from 'react';

export function ListGroup({
  children,
  count,
  hint,
  label,
}: {
  children: ReactNode;
  count: number;
  hint: string;
  label: string;
}) {
  return (
    <section className="list-group" aria-label={label}>
      <header className="list-group__head">
        <h3 className="list-group__title">
          {label} <span className="list-group__count">{count}</span>
        </h3>
        <p className="list-group__hint">{hint}</p>
      </header>
      <div className="list-group__rows">{children}</div>
    </section>
  );
}
