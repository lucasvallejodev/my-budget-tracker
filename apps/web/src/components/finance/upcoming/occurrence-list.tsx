'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { unlinkOccurrence } from '@/api/mutations';
import { Amount, Button, EmptyState, ListRow, Stack, Text } from '@/components/ui';
import { formatMoney } from '@coinkeeper/shared/lib/money';

import { OccurrenceStates, OccurrenceStatusOrder, RecurringKindLabels } from '../recurring-labels';
import { longDayLabel } from '../transaction-labels';
import { Occurrence, useRefreshFinance } from '../use-finance-data';
import { ListGroup } from './list-group';
import { stillToPay } from './upcoming-figures';

type OccurrenceActions = {
  onLink: (occurrence: Occurrence) => void;
  onRecord: (occurrence: Occurrence) => void;
};

function OccurrenceRow({
  occurrence,
  onLink,
  onRecord,
}: OccurrenceActions & { occurrence: Occurrence }) {
  const refresh = useRefreshFinance();

  const unlink = useMutation({
    mutationFn: () => unlinkOccurrence(occurrence.seriesId, occurrence.dueOn),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: refresh,
  });

  return (
    <ListRow
      title={occurrence.name}
      description={`${longDayLabel(occurrence.dueOn)} · ${RecurringKindLabels[occurrence.kind]}`}
    >
      <Amount
        amountMinor={occurrence.paidAmountMinor ?? occurrence.amountMinor}
        currency={occurrence.currency}
        signed
      />
      {occurrence.status === 'paid' ? (
        <Button
          size="sm"
          variant="ghost"
          aria-label={`Not paid: ${occurrence.name} on ${occurrence.dueOn}`}
          disabled={unlink.isPending}
          onClick={() => unlink.mutate()}
        >
          Not paid
        </Button>
      ) : (
        <>
          <Button
            size="sm"
            variant="outline"
            aria-label={`Record payment: ${occurrence.name} on ${occurrence.dueOn}`}
            onClick={() => onRecord(occurrence)}
          >
            Record
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Link a transaction: ${occurrence.name} on ${occurrence.dueOn}`}
            onClick={() => onLink(occurrence)}
          >
            Link
          </Button>
        </>
      )}
    </ListRow>
  );
}

export function OccurrenceList({
  occurrences,
  ...actions
}: OccurrenceActions & { occurrences: Occurrence[] }) {
  if (!occurrences.length) {
    return (
      <EmptyState
        title="Nothing expected in the next 30 days"
        description="Add your rent, salary and subscriptions under Recurring payments, or start from Found in your history."
      />
    );
  }

  const totals = stillToPay(occurrences);

  return (
    <Stack gap="medium">
      {totals.length > 0 && (
        <Text>
          <strong>Still to pay:</strong>{' '}
          {totals.map(total => formatMoney(total.amountMinor, total.currency)).join(' · ')}
        </Text>
      )}
      {OccurrenceStatusOrder.map(status => {
        const group = occurrences.filter(occurrence => occurrence.status === status);

        return (
          group.length > 0 && (
            <ListGroup
              key={status}
              count={group.length}
              hint={OccurrenceStates[status].hint}
              label={OccurrenceStates[status].label}
            >
              {group.map(occurrence => (
                <OccurrenceRow
                  key={`${occurrence.seriesId}-${occurrence.dueOn}`}
                  occurrence={occurrence}
                  {...actions}
                />
              ))}
            </ListGroup>
          )
        );
      })}
    </Stack>
  );
}
