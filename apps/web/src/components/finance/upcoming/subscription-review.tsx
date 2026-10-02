'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { updateSeries } from '@/api/mutations';
import { Badge, Button, EmptyState, ListRow, Panel, Text } from '@/components/ui';
import { formatMoney } from '@coinkeeper/shared/lib/money';

import { dayMonthLabel } from '../transaction-labels';
import { RecurringSeriesRow, useRefreshFinance } from '../use-finance-data';
import { seriesDefaults } from './series-form';
import { monthlyCost, priceChangePercent, reviewOrder, yearlyCost } from './upcoming-figures';

const costText = (series: RecurringSeriesRow): string => {
  const monthly = -series.monthlyEquivalentMinor;

  const parts = [
    `${formatMoney(monthly, series.currency)} a month`,
    `${formatMoney(yearlyCost({ amountMinor: monthly, currency: series.currency }).amountMinor, series.currency)} a year`,
  ];

  if (series.lastPaidOn) parts.push(`last paid ${dayMonthLabel(series.lastPaidOn)}`);

  return parts.join(' · ');
};

function PriceChange({ series }: { series: RecurringSeriesRow }) {
  const change = priceChangePercent(series);

  if (change === null) return null;
  if (change > 0) return <Badge tone="warning">Up {change} %</Badge>;

  return <Badge tone="success">Down {-change} %</Badge>;
}

export function SubscriptionReview({ series }: { series: RecurringSeriesRow[] }) {
  const refresh = useRefreshFinance();
  const items = reviewOrder(series);
  const totals = monthlyCost(series);

  const toggle = useMutation({
    mutationFn: (item: RecurringSeriesRow) =>
      updateSeries(item.id, {
        ...seriesDefaults(item),
        status: item.status === 'paused' ? 'active' : 'paused',
      }),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async item => {
      toast.success(item.status === 'paused' ? `${item.name} paused` : `${item.name} resumed`);
      await refresh();
    },
  });

  if (!items.length) {
    return (
      <EmptyState
        title="No recurring charges to review"
        description="Recurring payments that take money out appear here once you add them."
      />
    );
  }

  return (
    <Panel>
      <Text>
        <strong>All active charges:</strong>{' '}
        {totals
          .map(
            total =>
              `${formatMoney(total.amountMinor, total.currency)} a month, ${formatMoney(yearlyCost(total).amountMinor, total.currency)} a year`
          )
          .join(' · ')}
      </Text>
      {items.map(item => (
        <ListRow key={item.id} title={item.name} description={costText(item)}>
          <PriceChange series={item} />
          {item.status === 'paused' && <Badge tone="neutral">Paused</Badge>}
          <Button
            size="sm"
            variant="ghost"
            disabled={toggle.isPending}
            aria-label={`${item.status === 'paused' ? 'Resume' : 'Pause'} ${item.name}`}
            onClick={() => toggle.mutate(item)}
          >
            {item.status === 'paused' ? 'Resume' : 'Pause'}
          </Button>
        </ListRow>
      ))}
    </Panel>
  );
}
