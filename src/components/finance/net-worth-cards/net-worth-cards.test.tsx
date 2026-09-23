import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { formatMoney } from '@/lib/money';

import type { AccountSummary } from '../use-finance-data';
import { NetWorthCards } from './net-worth-cards';

afterEach(cleanup);

const bucket = {
  assetsMinor: 500000,
  currency: 'EUR',
  liabilitiesMinor: -100000,
  netMinor: 400000,
};

describe('NetWorthCards', () => {
  it('shows one card per currency with assets and debts', () => {
    render(<NetWorthCards buckets={[bucket]} accounts={[{ currency: 'EUR' } as AccountSummary]} />);

    expect(screen.getByText('1 account in EUR')).toBeTruthy();
    expect(screen.getByText(formatMoney(400000, 'EUR'))).toBeTruthy();
    expect(screen.getByText(`Owed ${formatMoney(100000, 'EUR')}`)).toBeTruthy();
  });

  it('invites to add an account without data', () => {
    render(<NetWorthCards buckets={[]} accounts={[]} />);

    expect(screen.getByText('Add an account to see your net worth.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Accounts' }).getAttribute('href')).toBe('/accounts');
  });
});
