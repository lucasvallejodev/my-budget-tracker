'use client';

import { Button, Page, PageHeading, Panel, QueryContent, Stack } from '@/components/ui';
import { useDialogState } from '@/lib/dialog-state';
import {
  DEFAULT_UPCOMING_DAYS,
  type RecurringFormValues,
} from '@coinkeeper/shared/schema/recurring';

import { occurrencePreset } from '../recurring-labels';
import { TransactionDialog } from '../transaction-dialog';
import {
  Occurrence,
  RecurringSeriesRow,
  useRecurringSeries,
  useUpcoming,
} from '../use-finance-data';
import { LinkPaymentDialog } from './link-payment-dialog';
import { OccurrenceList } from './occurrence-list';
import { SeriesDialog } from './series-dialog';
import { SeriesList } from './series-list';
import { SubscriptionReview } from './subscription-review';
import { SuggestionsPanel } from './suggestions-panel';
import { useRecordDue } from './use-record-due';

type SeriesRequest = { initial?: RecurringFormValues; series?: RecurringSeriesRow };

export function Upcoming() {
  useRecordDue();

  const occurrences = useUpcoming(DEFAULT_UPCOMING_DAYS);
  const series = useRecurringSeries();
  const editing = useDialogState<SeriesRequest>();
  const recording = useDialogState<Occurrence>();
  const linking = useDialogState<Occurrence>();

  return (
    <Page>
      <PageHeading
        title="Upcoming"
        description="Bills, subscriptions and income ahead, and what is still to pay this month."
      />
      <Stack>
        <Panel title={`Next ${DEFAULT_UPCOMING_DAYS} days`}>
          <QueryContent
            pending={occurrences.isPending}
            error={occurrences.isError}
            loading="Loading what is due…"
          >
            {() => (
              <OccurrenceList
                occurrences={occurrences.data ?? []}
                onLink={linking.open}
                onRecord={recording.open}
              />
            )}
          </QueryContent>
        </Panel>
        <Panel
          title="Recurring payments"
          action={<Button onClick={() => editing.open({})}>New recurring payment</Button>}
        >
          <QueryContent
            pending={series.isPending}
            error={series.isError}
            loading="Loading recurring payments…"
          >
            {() => (
              <SeriesList
                series={series.data ?? []}
                onEdit={item => editing.open({ series: item })}
              />
            )}
          </QueryContent>
        </Panel>
        <SubscriptionReview series={series.data ?? []} />
        <SuggestionsPanel onReview={initial => editing.open({ initial })} />
      </Stack>
      {editing.value && (
        <SeriesDialog
          initial={editing.value.initial}
          series={editing.value.series}
          onClose={editing.close}
        />
      )}
      {recording.value && (
        <TransactionDialog
          open
          preset={occurrencePreset(recording.value)}
          onOpenChange={open => !open && recording.close()}
        />
      )}
      {linking.value && <LinkPaymentDialog occurrence={linking.value} onClose={linking.close} />}
    </Page>
  );
}
