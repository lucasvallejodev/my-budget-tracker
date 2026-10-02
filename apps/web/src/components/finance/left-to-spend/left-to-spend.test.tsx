import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { localIsoDate } from '@coinkeeper/shared/lib/date-helpers';

import { type LeftToSpend as Figures, QueryKeys } from '../use-finance-data';
import { LeftToSpend } from './left-to-spend';

const today = localIsoDate(new Date());

const September: Figures = {
  billsDueMinor: 100000,
  budgetedMinor: 40000,
  currency: 'EUR',
  daysLeft: 21,
  incomeMinor: 300000,
  leftMinor: 155000,
  month: '2026-09',
  perDayMinor: 7380,
  unbudgetedSpentMinor: 5000,
};

const renderWith = (figures: Figures) => {
  const client = new QueryClient();

  client.setQueryData(QueryKeys.leftToSpend('2026-09', 'EUR', today), figures);

  return render(
    <QueryClientProvider client={client}>
      <LeftToSpend currency="EUR" month="2026-09" />
    </QueryClientProvider>
  );
};

afterEach(cleanup);

describe('LeftToSpend', () => {
  it('shows what is free to spend, the daily allowance and how it is worked out', () => {
    renderWith(September);

    expect(screen.getByText('€1,550.00')).toBeTruthy();
    expect(screen.getByText('€73.80 a day for 21 days')).toBeTruthy();
    expect(screen.getByText('− €1,000.00')).toBeTruthy();
    expect(screen.getByText('Spending without a budget')).toBeTruthy();
    expect(screen.getByRole('link', { name: /What is due/ }).getAttribute('href')).toBe(
      '/upcoming'
    );
  });

  it('says when more is planned than came in', () => {
    renderWith({
      ...September,
      leftMinor: -2500,
      perDayMinor: 0,
    });

    expect(screen.getByText('€25.00 more is planned than came in')).toBeTruthy();
  });
});
