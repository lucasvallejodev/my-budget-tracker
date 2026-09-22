import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';
import { categoryLabel, describeTransaction, TransactionTable } from './transaction-table';
import { sampleTransactions } from './finance/sample-data';
import type { TransactionRow } from './finance/use-finance-data';

afterEach(cleanup);

const leg = (overrides: Partial<TransactionRow>): TransactionRow => ({
  ...sampleTransactions[1],
  id: 'leg',
  kind: 'transfer',
  transferId: 'xfer',
  categoryId: null,
  categoryName: null,
  categoryIcon: null,
  groupId: null,
  groupName: null,
  groupColor: null,
  groupKind: null,
  payeeId: null,
  payeeName: null,
  counterpartAccountId: 'visa',
  counterpartAccountName: 'Visa',
  needsReview: false,
  ...overrides,
});

describe('transfer legs', () => {
  it('describes each leg by its counterpart account and never as spending', () => {
    expect(describeTransaction(leg({ amountMinor: -10500 }))).toBe('Transfer to Visa');
    expect(
      describeTransaction(
        leg({ amountMinor: 10500, accountName: 'Visa', counterpartAccountName: 'Checking' })
      )
    ).toBe('Transfer from Checking');
    expect(categoryLabel(leg({ amountMinor: -10500 }))).toBe('Transfer');
    expect(categoryLabel(leg({ kind: 'opening', transferId: null, amountMinor: 100 }))).toBe(
      'Opening balance'
    );
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
