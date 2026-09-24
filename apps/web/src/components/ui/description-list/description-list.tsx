import './description-list.scss';

import { ReactNode } from 'react';

export function DescriptionList({ items }: { items: { detail: ReactNode; term: string }[] }) {
  return (
    <dl className="description-list">
      {items.map(item => (
        <div className="description-list__row" key={item.term}>
          <dt>{item.term}</dt>
          <dd className="description-list__detail">{item.detail}</dd>
        </div>
      ))}
    </dl>
  );
}
