import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createSeries, recordDuePayments, unlinkOccurrence, updateSeries } from '@/api/mutations';
import { localIsoDate } from '@coinkeeper/shared/lib/date-helpers';
import type {
  Occurrence,
  RecurringSeriesRow,
  RecurringSuggestion,
} from '@coinkeeper/shared/schema/recurring';

import { QueryKeys } from '../use-finance-data';
import { Upcoming } from './upcoming';

vi.mock('@/api/mutations', () => ({
  createSeries: vi.fn(async (values: { name: string }) => ({ ...values, id: 'new-series' })),
  createTransaction: vi.fn(async () => ({})),
  deleteSeries: vi.fn(async () => {}),
  linkOccurrence: vi.fn(async () => ({})),
  recordDuePayments: vi.fn(async () => ({ created: 0 })),
  restoreSeries: vi.fn(async () => ({})),
  unlinkOccurrence: vi.fn(async () => {}),
  updateSeries: vi.fn(async () => ({})),
}));

const today = localIsoDate(new Date());

const occurrence = (overrides: Partial<Occurrence>): Occurrence => ({
  accountId: 'checking',
  amountMinor: -1299,
  categoryId: null,
  currency: 'EUR',
  dueOn: '2026-10-15',
  kind: 'subscription',
  name: 'Streaming',
  paidAmountMinor: null,
  payeeId: null,
  seriesId: 'series-stream',
  status: 'due',
  transactionId: null,
  ...overrides,
});

const Rent: RecurringSeriesRow = {
  accountId: 'checking',
  accountName: 'Checking',
  amountMaxMinor: -92500,
  amountMinMinor: -107500,
  amountMinor: -100000,
  anchorDate: '2026-01-01',
  cadence: 'monthly',
  categoryId: null,
  categoryName: null,
  currency: 'EUR',
  deletedAt: null,
  endDate: null,
  id: 'series-rent',
  interval: 1,
  kind: 'bill',
  lastPaidAmountMinor: -100000,
  lastPaidOn: '2026-10-01',
  matchWindowDays: 3,
  monthlyEquivalentMinor: -100000,
  name: 'Rent',
  nextDueOn: '2026-11-01',
  paidCount: 9,
  payeeId: null,
  payeeName: null,
  previousPaidAmountMinor: -95000,
  recordMode: 'match_only',
  source: 'manual',
  status: 'active',
};

const Music: RecurringSuggestion = {
  accountId: 'checking',
  amountMinor: -999,
  anchorDate: '2026-09-03',
  cadence: 'monthly',
  categoryId: null,
  currency: 'EUR',
  interval: 1,
  kind: 'subscription',
  lastDate: '2026-09-03',
  nextDueOn: '2026-10-03',
  occurrences: 4,
  payeeId: 'music',
  payeeName: 'MusicCo',
};

const renderUpcoming = () => {
  const client = new QueryClient();

  client.setQueryData(QueryKeys.upcoming(today, 30), [
    occurrence({
      dueOn: '2026-09-28',
      name: 'Phone',
      seriesId: 'series-phone',
      status: 'overdue',
    }),
    occurrence({}),
    occurrence({
      dueOn: '2026-10-01',
      name: 'Rent',
      paidAmountMinor: -100000,
      seriesId: 'series-rent',
      status: 'paid',
      transactionId: 'rent-october',
    }),
  ]);
  client.setQueryData(QueryKeys.recurring(today), [Rent]);
  client.setQueryData(QueryKeys.recurringSuggestions(today), [Music]);

  return render(
    <QueryClientProvider client={client}>
      <Upcoming />
    </QueryClientProvider>
  );
};

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('Upcoming', () => {
  it('groups what is due by status and totals what is still to pay', async () => {
    renderUpcoming();

    expect(screen.getByText('Still to pay: €25.98')).toBeTruthy();
    expect(within(screen.getByRole('region', { name: 'Overdue' })).getByText('Phone')).toBeTruthy();
    expect(
      within(screen.getByRole('region', { name: 'Due soon' })).getByText('Streaming')
    ).toBeTruthy();
    expect(within(screen.getByRole('region', { name: 'Paid' })).getByText('Rent')).toBeTruthy();
    await waitFor(() => expect(recordDuePayments).toHaveBeenCalledWith(today));
  });

  it('records an occurrence through a prefilled transaction', () => {
    renderUpcoming();

    const due = within(screen.getByRole('region', { name: 'Due soon' }));

    fireEvent.click(due.getByRole('button', { name: 'Record' }));

    expect(screen.getByRole('dialog', { name: 'New transaction' })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveProperty('value', '12.99');
  });

  it('marks a paid occurrence as not paid', async () => {
    renderUpcoming();

    fireEvent.click(screen.getByRole('button', { name: 'Not paid' }));

    await waitFor(() => expect(unlinkOccurrence).toHaveBeenCalledWith('series-rent', '2026-10-01'));
  });

  it('lists recurring payments and adds a suggestion found in history', async () => {
    renderUpcoming();

    expect(screen.getByText('Bill · Monthly · €1,000.00 · next 1 Nov')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Add MusicCo' }));

    await waitFor(() =>
      expect(createSeries).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: '9.99',
          anchorDate: '2026-10-03',
          kind: 'subscription',
          name: 'MusicCo',
          payeeId: 'music',
          source: 'detected',
        })
      )
    );
  });

  it('opens the recurring payment form', () => {
    renderUpcoming();

    fireEvent.click(screen.getByRole('button', { name: 'New recurring payment' }));

    expect(screen.getByRole('dialog', { name: 'New recurring payment' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Repeats' }).textContent).toContain('Monthly');
  });

  it('reviews recurring charges with their yearly cost and price change, and pauses one', async () => {
    renderUpcoming();

    const review = screen.getByText('Subscription review').closest('section')!;

    expect(within(review).getByText('€1,000.00 a month, €12,000.00 a year')).toBeTruthy();
    expect(within(review).getByText('Up 5 %')).toBeTruthy();

    fireEvent.click(within(review).getByRole('button', { name: 'Pause Rent' }));

    await waitFor(() =>
      expect(updateSeries).toHaveBeenCalledWith(
        'series-rent',
        expect.objectContaining({
          amount: '1000.00',
          name: 'Rent',
          status: 'paused',
        })
      )
    );
  });
});
