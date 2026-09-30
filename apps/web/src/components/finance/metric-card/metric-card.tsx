import './metric-card.scss';

import { Avatar, MetricValue, Panel, Text } from '@/components/ui';
import { MetricKind, MetricKinds } from '@/constants/metrics';

export function MetricCard({
  detail,
  kind = 'total',
  label,
  negative,
  trend,
  value,
}: {
  detail?: string;
  kind?: MetricKind;
  label: string;
  negative?: boolean;
  trend?: string;
  value: string;
}) {
  const { color, icon: MetricIcon } = MetricKinds[kind];

  return (
    <Panel>
      <div className="metric-card__label">
        <Avatar color={color} size="small">
          <MetricIcon aria-hidden />
        </Avatar>
        {label}
      </div>
      <MetricValue size="small">{value}</MetricValue>
      {(trend || detail) && (
        <p className="metric-card__trend">
          {trend && (
            <Text as="span" tone={negative ? 'negative' : 'positive'}>
              {trend}
            </Text>
          )}
          {detail}
        </p>
      )}
    </Panel>
  );
}
