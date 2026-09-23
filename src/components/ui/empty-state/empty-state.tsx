import './empty-state.scss';

import { Wallet } from 'lucide-react';
import { ReactNode } from 'react';

const EmptyStateIconSize = 30;

export function EmptyState({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <div className="empty-state">
      <Wallet size={EmptyStateIconSize} />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
