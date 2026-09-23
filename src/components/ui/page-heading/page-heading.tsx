import './page-heading.scss';

import { ReactNode } from 'react';

import { Cluster } from '../cluster';

export function PageHeading({
  actions,
  description,
  title,
}: {
  actions?: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <header className="page-heading">
      <div>
        <h1>{title}</h1>
        {description && <p className="page-heading__description">{description}</p>}
      </div>
      {actions && <Cluster>{actions}</Cluster>}
    </header>
  );
}
