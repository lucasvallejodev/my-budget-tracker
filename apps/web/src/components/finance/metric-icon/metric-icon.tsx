import { Avatar } from '@/components/ui';
import { type MetricKind, MetricKinds } from '@/constants/metrics';

export function MetricIcon({ kind }: { kind: MetricKind }) {
  const { color, icon: KindIcon } = MetricKinds[kind];

  return (
    <Avatar color={color} size="small">
      <KindIcon />
    </Avatar>
  );
}
