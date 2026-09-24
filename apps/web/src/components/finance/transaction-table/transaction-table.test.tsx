import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SampleTransactions } from '../sample-data';
import { categoryLabel, describeTransaction } from '../transaction-labels';
import type { TransactionRow } from '../use-finance-data';
import { TransactionTable } from './transaction-table';

afterEach(cleanup);

const leg = (overrides: Partial<TransactionRow>): TransactionRow => ({
  ...SampleTransactions[1],
  categoryIcon: null,
  categoryId: null,
  categoryName: null,
  counterpartAccountId: 'visa',
  counterpartAccountName: 'Visa',
  groupColor: null,
  groupId: null,
  groupKind: null,
  groupName: null,
  id: 'leg',
  kind: 'transfer',
  needsReview: false,
  payeeId: null,
  payeeName: null,
  transferId: 'xfer',
  ...overrides,
});

describe('transfer legs', () => {
  it('describes each leg by its counterpart account and never as spending', () => {
    expect(describeTransaction(leg({ amountMinor: -10500 }))).toBe('Transfer to Visa');
    expect(
      describeTransaction(
        leg({
          accountName: 'Visa',
          amountMinor: 10500,
          counterpartAccountName: 'Checking',
        })
      )
    ).toBe('Transfer from Checking');
    expect(categoryLabel(leg({ amountMinor: -10500 }))).toBe('Transfer');
    expect(
      categoryLabel(
        leg({
          amountMinor: 100,
          kind: 'opening',
          transferId: null,
        })
      )
    ).toBe('Opening balance');
  });

  it('renders a transfer row with a signed amount and no review badge', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <TransactionTable transactions={[leg({ amountMinor: -10500 })]} />
      </QueryClientProvider>
    );
    expect(screen.getByText('Transfer to Visa')).toBeTruthy();
    expect(screen.getByText('-$105.00')).toBeTruthy();
    expect(screen.queryByText('Needs review')).toBeNull();
    expect(screen.getByText('Cleared')).toBeTruthy();
  });
});
