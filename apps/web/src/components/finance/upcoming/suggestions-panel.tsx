'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { createSeries } from '@/api/mutations';
import { Button, Cluster, ListRow, Panel } from '@/components/ui';
import { formatMoney } from '@coinkeeper/shared/lib/money';
import type { RecurringFormValues } from '@coinkeeper/shared/schema/recurring';

import { cadenceLabel, RecurringKindLabels } from '../recurring-labels';
import { dayMonthLabel } from '../transaction-labels';
import {
  RecurringSuggestion,
  useRecurringSuggestions,
  useRefreshFinance,
} from '../use-finance-data';
import { suggestionValues } from './series-form';

const describeSuggestion = (suggestion: RecurringSuggestion): string =>
  [
    RecurringKindLabels[suggestion.kind],
    cadenceLabel(suggestion.cadence, suggestion.interval),
    formatMoney(Math.abs(suggestion.amountMinor), suggestion.currency),
    `${suggestion.occurrences} payments, last ${dayMonthLabel(suggestion.lastDate)}`,
  ].join(' · ');

export function SuggestionsPanel({
  onReview,
}: {
  onReview: (values: RecurringFormValues) => void;
}) {
  const refresh = useRefreshFinance();
  const suggestions = useRecurringSuggestions();
  const items = suggestions.data ?? [];

  const add = useMutation({
    mutationFn: (suggestion: RecurringSuggestion) => createSeries(suggestionValues(suggestion)),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async series => {
      toast.success(`${series.name} added`);
      await refresh();
    },
  });

  if (!items.length) return null;

  return (
    <Panel
      title="Found in your history"
      description="Payments that repeat at a regular rhythm. Add them to follow what is due and to find forgotten subscriptions."
    >
      {items.map(suggestion => (
        <ListRow
          key={`${suggestion.payeeId}-${suggestion.currency}-${suggestion.kind}`}
          title={suggestion.payeeName}
          description={describeSuggestion(suggestion)}
        >
          <Cluster>
            <Button
              size="sm"
              variant="outline"
              disabled={add.isPending}
              aria-label={`Add ${suggestion.payeeName}`}
              onClick={() => add.mutate(suggestion)}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Review ${suggestion.payeeName} first`}
              onClick={() => onReview(suggestionValues(suggestion))}
            >
              Review
            </Button>
          </Cluster>
        </ListRow>
      ))}
    </Panel>
  );
}
