'use client';

import {
  Button,
  Page,
  PageHeading,
  Panel,
  QueryContent,
  SectionIntro,
  SectionTabs,
  Stack,
} from '@/components/ui';
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
  useRecurringSuggestions,
  useUpcoming,
} from '../use-finance-data';
import { LinkPaymentDialog } from './link-payment-dialog';
import { OccurrenceList } from './occurrence-list';
import { SeriesDialog } from './series-dialog';
import { SeriesList } from './series-list';
import { SubscriptionReview } from './subscription-review';
import { SuggestionsPanel } from './suggestions-panel';
import { type UpcomingSection, UpcomingSections, type UpcomingView } from './upcoming-sections';
import { useRecordDue } from './use-record-due';

type SeriesRequest = { initial?: RecurringFormValues; series?: RecurringSeriesRow };

type Dialogs = {
  editing: ReturnType<typeof useDialogState<SeriesRequest>>;
  linking: ReturnType<typeof useDialogState<Occurrence>>;
  recording: ReturnType<typeof useDialogState<Occurrence>>;
};

const sectionOf = (view: UpcomingView): UpcomingSection =>
  UpcomingSections.find(section => section.view === view) ?? UpcomingSections[0];

function DueSection({ dialogs }: { dialogs: Dialogs }) {
  const occurrences = useUpcoming(DEFAULT_UPCOMING_DAYS);

  return (
    <Panel>
      <QueryContent
        pending={occurrences.isPending}
        error={occurrences.isError}
        loading="Loading what is due…"
      >
        {() => (
          <OccurrenceList
            occurrences={occurrences.data ?? []}
            onLink={dialogs.linking.open}
            onRecord={dialogs.recording.open}
          />
        )}
      </QueryContent>
    </Panel>
  );
}

function RecurringSection({ dialogs }: { dialogs: Dialogs }) {
  const series = useRecurringSeries();

  return (
    <Panel>
      <QueryContent
        pending={series.isPending}
        error={series.isError}
        loading="Loading recurring payments…"
      >
        {() => (
          <SeriesList
            series={series.data ?? []}
            onEdit={item => dialogs.editing.open({ series: item })}
          />
        )}
      </QueryContent>
    </Panel>
  );
}

function ReviewSection() {
  const series = useRecurringSeries();

  return (
    <QueryContent
      pending={series.isPending}
      error={series.isError}
      loading="Loading recurring charges…"
    >
      {() => <SubscriptionReview series={series.data ?? []} />}
    </QueryContent>
  );
}

function SectionBody({ dialogs, view }: { dialogs: Dialogs; view: UpcomingView }) {
  if (view === 'recurring') return <RecurringSection dialogs={dialogs} />;
  if (view === 'subscriptions') return <ReviewSection />;

  if (view === 'suggestions') {
    return <SuggestionsPanel onReview={initial => dialogs.editing.open({ initial })} />;
  }

  return <DueSection dialogs={dialogs} />;
}

function useSectionCounts() {
  const occurrences = useUpcoming(DEFAULT_UPCOMING_DAYS);
  const suggestions = useRecurringSuggestions();

  const needsAction = (occurrences.data ?? []).filter(
    occurrence => occurrence.status === 'overdue' || occurrence.status === 'due'
  ).length;

  return { due: needsAction, suggestions: suggestions.data?.length ?? 0 };
}

const countOf = (
  view: UpcomingView,
  counts: ReturnType<typeof useSectionCounts>
): number | undefined => {
  if (view === 'due') return counts.due;
  if (view === 'suggestions') return counts.suggestions;

  return undefined;
};

export function Upcoming({ view = 'due' }: { view?: UpcomingView }) {
  useRecordDue();

  const counts = useSectionCounts();
  const section = sectionOf(view);

  const dialogs: Dialogs = {
    editing: useDialogState<SeriesRequest>(),
    linking: useDialogState<Occurrence>(),
    recording: useDialogState<Occurrence>(),
  };

  return (
    <Page>
      <PageHeading
        title="Upcoming"
        description="Payments that repeat: what is due, what they cost, and the ones found in your history."
        actions={<Button onClick={() => dialogs.editing.open({})}>New recurring payment</Button>}
      />
      <SectionTabs
        label="Upcoming sections"
        items={UpcomingSections.map(item => ({
          count: countOf(item.view, counts),
          current: item.view === view,
          href: item.path,
          label: item.label,
        }))}
      />
      <Stack gap="medium">
        <SectionIntro steps={section.steps}>{section.intro}</SectionIntro>
        <SectionBody dialogs={dialogs} view={view} />
      </Stack>
      {dialogs.editing.value && (
        <SeriesDialog
          initial={dialogs.editing.value.initial}
          series={dialogs.editing.value.series}
          onClose={dialogs.editing.close}
        />
      )}
      {dialogs.recording.value && (
        <TransactionDialog
          open
          preset={occurrencePreset(dialogs.recording.value)}
          onOpenChange={open => !open && dialogs.recording.close()}
        />
      )}
      {dialogs.linking.value && (
        <LinkPaymentDialog occurrence={dialogs.linking.value} onClose={dialogs.linking.close} />
      )}
    </Page>
  );
}
