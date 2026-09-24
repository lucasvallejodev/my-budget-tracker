import './balance-card.scss';

import { ReactNode } from 'react';

import { Cluster, MetricValue } from '@/components/ui';

export function BalanceCard({
  actions,
  caption,
  details,
  label,
  title,
  value,
}: {
  actions?: ReactNode;
  caption: ReactNode;
  details?: ReactNode;
  label?: string;
  title: string;
  value?: ReactNode;
}) {
  return (
    <section className="balance-card">
      <div className="balance-card__header">
        <h2>{title}</h2>
        {label && <span>{label}</span>}
      </div>
      <div>
        <p className="balance-card__caption">{caption}</p>
        {value !== undefined && <MetricValue size="fluid">{value}</MetricValue>}
      </div>
      {details && <div className="balance-card__details">{details}</div>}
      {actions && <Cluster>{actions}</Cluster>}
    </section>
  );
}
