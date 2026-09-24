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
      <div className="page-heading__text">
        <h1>{title}</h1>
        {description && <p className="page-heading__description">{description}</p>}
      </div>
      {actions && <Cluster className="page-heading__actions">{actions}</Cluster>}
    </header>
  );
}
