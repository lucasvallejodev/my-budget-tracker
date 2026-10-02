'use client';

import { useMutation } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { deleteSeries, restoreSeries } from '@/api/mutations';
import { Badge, Button, EmptyState, ListRow, Stack } from '@/components/ui';
import { formatMoney } from '@coinkeeper/shared/lib/money';

import { cadenceLabel, RecurringKindGroups } from '../recurring-labels';
import { dayMonthLabel } from '../transaction-labels';
import { RecurringSeriesRow, useRefreshFinance } from '../use-finance-data';
import { ListGroup } from './list-group';

const ActionIconSize = 16;

const describeSeries = (series: RecurringSeriesRow): string =>
  [
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
        description="Add rent, salary or a subscription with New recurring payment, or start from Found in your history."
      />
    );
  }

  return (
    <Stack gap="medium">
      {RecurringKindGroups.map(group => {
        const items = series.filter(item => item.kind === group.kind);

        return (
          items.length > 0 && (
            <ListGroup key={group.kind} count={items.length} hint={group.hint} label={group.label}>
              {items.map(item => (
                <SeriesRow
                  key={item.id}
                  series={item}
                  onDelete={() => remove.mutate(item)}
                  onEdit={() => onEdit(item)}
                />
              ))}
            </ListGroup>
          )
        );
      })}
    </Stack>
  );
}

function SeriesRow({
  onDelete,
  onEdit,
  series,
}: {
  onDelete: () => void;
  onEdit: () => void;
  series: RecurringSeriesRow;
}) {
  return (
    <ListRow title={series.name} description={describeSeries(series)}>
      {series.status !== 'active' && (
        <Badge tone="neutral">{series.status === 'paused' ? 'Paused' : 'Ended'}</Badge>
      )}
      <Button variant="ghost" size="icon" aria-label={`Edit ${series.name}`} onClick={onEdit}>
        <Pencil size={ActionIconSize} />
      </Button>
      <Button variant="ghost" size="icon" aria-label={`Delete ${series.name}`} onClick={onDelete}>
        <Trash2 size={ActionIconSize} />
      </Button>
    </ListRow>
  );
}
