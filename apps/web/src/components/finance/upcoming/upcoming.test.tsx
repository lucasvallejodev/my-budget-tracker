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
import type { UpcomingView } from './upcoming-sections';

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

const renderUpcoming = (view: UpcomingView = 'due') => {
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
      <Upcoming view={view} />
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
  it('splits the page into sections with counts and explains the current one', async () => {
    renderUpcoming();

    const tabs = screen.getByRole('navigation', { name: 'Upcoming sections' });

    expect(
      within(tabs).getByRole('link', { name: 'What is due 2' }).getAttribute('aria-current')
    ).toBe('page');
    expect(within(tabs).getByRole('link', { name: 'Found in your history 1' })).toBeTruthy();
    expect(screen.getByText(/matched and marked paid automatically/)).toBeTruthy();
    expect(screen.getByText(/Record: you paid it/)).toBeTruthy();
    await waitFor(() => expect(recordDuePayments).toHaveBeenCalledWith(today));
  });

  it('groups what is due under headed groups and totals what is still to pay', () => {
    renderUpcoming();

    expect(screen.getByText('€25.98')).toBeTruthy();

    const overdue = screen.getByRole('region', { name: 'Overdue' });

    expect(within(overdue).getByText('Phone')).toBeTruthy();
    expect(within(overdue).getByText(/no matching payment was found/)).toBeTruthy();
    expect(
      within(screen.getByRole('region', { name: 'Due soon' })).getByText('Streaming')
    ).toBeTruthy();
    expect(within(screen.getByRole('region', { name: 'Paid' })).getByText('Rent')).toBeTruthy();
  });

  it('records an occurrence through a prefilled transaction', () => {
    renderUpcoming();

    fireEvent.click(
      screen.getByRole('button', { name: 'Record payment: Streaming on 2026-10-15' })
    );

    expect(screen.getByRole('dialog', { name: 'New transaction' })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveProperty('value', '12.99');
  });

  it('marks a paid occurrence as not paid', async () => {
    renderUpcoming();

    fireEvent.click(screen.getByRole('button', { name: 'Not paid: Rent on 2026-10-01' }));

    await waitFor(() => expect(unlinkOccurrence).toHaveBeenCalledWith('series-rent', '2026-10-01'));
  });

  it('lists recurring payments grouped by kind', () => {
    renderUpcoming('recurring');

    const bills = screen.getByRole('region', { name: 'Bills' });

    expect(within(bills).getByText('Monthly · €1,000.00 · next 1 Nov')).toBeTruthy();
    expect(screen.getByText(/Each one knows how often it happens/)).toBeTruthy();
  });

  it('adds a suggestion found in history', async () => {
    renderUpcoming('suggestions');

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

  it('opens the recurring payment form from any section', () => {
    renderUpcoming('subscriptions');

    fireEvent.click(screen.getByRole('button', { name: 'New recurring payment' }));

    expect(screen.getByRole('dialog', { name: 'New recurring payment' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Repeats' }).textContent).toContain('Monthly');
  });

  it('reviews recurring charges with their yearly cost and price change, and pauses one', async () => {
    renderUpcoming('subscriptions');

    expect(screen.getByText('€1,000.00 a month, €12,000.00 a year')).toBeTruthy();
    expect(screen.getByText('Up 5 %')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Pause Rent' }));

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
