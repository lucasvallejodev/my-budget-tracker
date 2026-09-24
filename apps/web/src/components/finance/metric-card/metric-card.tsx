import './metric-card.scss';

import { Wallet } from 'lucide-react';
import { ReactNode } from 'react';

import { IconTile, MetricValue, Panel, Text } from '@/components/ui';

const MetricIconSize = 20;

export function MetricCard({
  detail,
  icon = <Wallet size={MetricIconSize} />,
  label,
  negative,
  trend,
  value,
}: {
  detail?: string;
  icon?: ReactNode;
  label: string;
  negative?: boolean;
  trend?: string;
  value: string;
}) {
  return (
    <Panel>
      <div className="metric-card__label">
        <IconTile>{icon}</IconTile>
        {label}
      </div>
      <MetricValue>{value}</MetricValue>
      {(trend || detail) && (
        <p className="metric-card__trend">
          <Text as="span" tone={negative ? 'negative' : 'positive'}>
            {trend}
          </Text>
          {detail}
        </p>
      )}
    </Panel>
  );
}
