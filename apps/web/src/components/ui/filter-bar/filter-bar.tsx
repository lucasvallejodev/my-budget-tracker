import './filter-bar.scss';

import { ReactNode } from 'react';

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="filter-bar">{children}</div>;
}
