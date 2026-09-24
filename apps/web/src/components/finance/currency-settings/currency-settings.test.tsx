import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type ExchangeRateRow, QueryKeys } from '../use-finance-data';
import { CurrencySettings } from './currency-settings';

const MutationContextArgument = expect.anything();

vi.mock('@/app/(main)/actions', () => ({
  deleteExchangeRateAction: vi.fn(async () => {}),
  updateSettingsAction: vi.fn(async () => ({})),
  upsertExchangeRateAction: vi.fn(async () => ({})),
}));

const rates: ExchangeRateRow[] = [
  {
    base: 'USD',
    date: '2026-09-01',
    deletedAt: null,
    quote: 'EUR',
    rate: 0.92,
    source: 'manual',
  },
  {
    base: 'GBP',
    date: '2026-08-15',
    deletedAt: null,
    quote: 'EUR',
    rate: 1.17,
    source: 'manual',
  },
];

const currencies = [
  {
    code: 'EUR',
    isActive: true,
    minorUnits: 2,
    name: 'Euro',
    symbol: '€',
  },
  {
    code: 'USD',
    isActive: true,
    minorUnits: 2,
    name: 'US Dollar',
    symbol: '$',
  },
  {
    code: 'GBP',
    isActive: true,
    minorUnits: 2,
    name: 'Pound Sterling',
    symbol: '£',
  },
];

afterEach(cleanup);

function renderSettings(rateRows: ExchangeRateRow[] = rates) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  client.setQueryData(QueryKeys.settings, { primaryCurrency: 'EUR', showConvertedTotals: false });
  client.setQueryData(QueryKeys.currencies, currencies);
  client.setQueryData(QueryKeys.exchangeRates, rateRows);

  return render(
    <QueryClientProvider client={client}>
      <CurrencySettings />
    </QueryClientProvider>
  );
}

describe('CurrencySettings', () => {
  it('renders the primary currency, the toggle and the rate table', () => {
    renderSettings();
    expect(screen.getByRole('heading', { name: 'Primary currency' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Primary currency' }).textContent).toContain('EUR');
    expect(screen.getByRole('switch', { name: 'Show converted totals' })).toBeTruthy();
    expect(screen.getByText('1 USD → EUR')).toBeTruthy();
    expect(screen.getByText('1 GBP → EUR')).toBeTruthy();
    expect(screen.getByText('0.92')).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Save rate' }).disabled).toBe(
      true
    );
  });

  it('shows an empty state when there are no rates', () => {
    renderSettings([]);
    expect(screen.getByRole('heading', { name: 'No exchange rates yet' })).toBeTruthy();
  });

  it('saves the converted-totals preference when the switch is toggled', async () => {
    const actions = await import('@/app/(main)/actions');

    renderSettings();
    fireEvent.click(screen.getByRole('switch', { name: 'Show converted totals' }));
    await vi.waitFor(() =>
      expect(actions.updateSettingsAction).toHaveBeenCalledWith(
        { showConvertedTotals: true },
        MutationContextArgument
      )
    );
  });

  it('deletes a rate by its key', async () => {
    const actions = await import('@/app/(main)/actions');

    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Delete rate GBP to EUR from 2026-08-15' }));
    await vi.waitFor(() =>
      expect(actions.deleteExchangeRateAction).toHaveBeenCalledWith(
        rates[1],
        MutationContextArgument
      )
    );
  });
});
