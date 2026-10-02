import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetPeriod, updateSettings } from '@/api/mutations';

import { currentMonth, QueryKeys } from '../use-finance-data';
import { BudgetPeriodSettings } from './budget-period-settings';

vi.mock('@/api/mutations', () => ({
  movePeriod: vi.fn(async () => ({})),
  resetPeriod: vi.fn(async () => ({})),
  updateSettings: vi.fn(async () => ({})),
}));

const renderSettings = () => {
  const client = new QueryClient();

  client.setQueryData(QueryKeys.settings, {
    allowEmoji: false,
    locale: 'en-US',
    periodRule: { day: 25, kind: 'fixed_day' },
    primaryCurrency: 'EUR',
    showConvertedTotals: false,
    weekendDays: [0, 6],
  });
  client.setQueryData(QueryKeys.period(currentMonth()), {
    days: 30,
    from: '2026-09-28',
    key: currentMonth(),
    moved: true,
    ruleFrom: '2026-09-25',
    to: '2026-10-22',
  });

  return render(
    <QueryClientProvider client={client}>
      <BudgetPeriodSettings />
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

describe('BudgetPeriodSettings', () => {
  it('shows the saved rule and saves it with the weekend days', async () => {
    renderSettings();

    expect(screen.getByRole('combobox', { name: 'Periods start' }).textContent).toContain(
      'On a fixed day of the month'
    );
    expect(screen.getByRole('combobox', { name: 'Day' }).textContent).toContain('Day 25');

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(updateSettings).toHaveBeenCalledWith({
        periodRule: { day: 25, kind: 'fixed_day' },
        weekendDays: [0, 6],
      })
    );
  });

  it('shows a moved period and puts the rule back', async () => {
    renderSettings();

    expect(screen.getByText(/28 Sep to 22 Oct \(moved from 25 Sep\)/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Use the rule again' }));

    await waitFor(() => expect(resetPeriod).toHaveBeenCalledWith(currentMonth()));
  });
});
