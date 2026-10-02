'use client';

import { useMutation } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { deleteSeries, restoreSeries } from '@/api/mutations';
import { Badge, Button, EmptyState, ListRow } from '@/components/ui';
import { formatMoney } from '@coinkeeper/shared/lib/money';

import { cadenceLabel, RecurringKindLabels } from '../recurring-labels';
import { dayMonthLabel } from '../transaction-labels';
import { RecurringSeriesRow, useRefreshFinance } from '../use-finance-data';

const ActionIconSize = 16;

const describeSeries = (series: RecurringSeriesRow): string =>
  [
    RecurringKindLabels[series.kind],
    cadenceLabel(series.cadence, series.interval),
    formatMoney(Math.abs(series.amountMinor), series.currency),
    series.nextDueOn ? `next ${dayMonthLabel(series.nextDueOn)}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

export function SeriesList({
  onEdit,
  series,
}: {
  onEdit: (series: RecurringSeriesRow) => void;
  series: RecurringSeriesRow[];
}) {
  const refresh = useRefreshFinance();

  const remove = useMutation({
    mutationFn: (item: RecurringSeriesRow) => deleteSeries(item.id),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async (unused, item) => {
      toast.success(`${item.name} deleted`, {
        action: { label: 'Undo', onClick: () => void restoreSeries(item.id).then(refresh) },
      });
      await refresh();
    },
  });

  if (!series.length) {
    return (
      <EmptyState
        title="No recurring payments yet"
        description="Add rent, salary or a subscription to see what is coming."
      />
    );
  }

  return (
    <>
      {series.map(item => (
        <ListRow key={item.id} title={item.name} description={describeSeries(item)}>
          {item.status !== 'active' && (
            <Badge tone="neutral">{item.status === 'paused' ? 'Paused' : 'Ended'}</Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit ${item.name}`}
            onClick={() => onEdit(item)}
          >
            <Pencil size={ActionIconSize} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${item.name}`}
            onClick={() => remove.mutate(item)}
          >
            <Trash2 size={ActionIconSize} />
          </Button>
        </ListRow>
      ))}
    </>
  );
}
