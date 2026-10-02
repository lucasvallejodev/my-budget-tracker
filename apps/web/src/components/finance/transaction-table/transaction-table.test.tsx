import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SampleTransactions } from '../sample-data';
import { categoryLabel, describeTransaction } from '../transaction-labels';
import type { TransactionRow } from '../use-finance-data';
import { TransactionTable } from './transaction-table';

afterEach(cleanup);

const renderTable = (transactions: TransactionRow[]) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TransactionTable transactions={transactions} />
    </QueryClientProvider>
  );

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

  it('renders a lone transfer leg as one grey row that is not spending', () => {
    renderTable([leg({ amountMinor: -10500 })]);

    expect(screen.getByText('Transfer to Visa')).toBeTruthy();
    expect(screen.getByText('$105.00')).toBeTruthy();
    expect(screen.getByText('Not counted as spending')).toBeTruthy();
    expect(screen.queryByText('Needs review')).toBeNull();
    expect(screen.queryByText('Cleared')).toBeNull();
  });

  it('collapses both legs into one row from one account to the other', () => {
    renderTable([
      leg({
        accountName: 'Checking',
        amountMinor: -10500,
        id: 'out',
      }),
      leg({
        accountName: 'Visa',
        amountMinor: 10500,
        id: 'in',
      }),
    ]);

    expect(screen.getByText('Checking → Visa')).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });
});

describe('TransactionTable', () => {
  it('groups rows by day and offers a category for uncategorized entries', () => {
    renderTable([
      leg({
        amountMinor: -2399,
        date: '2026-09-28',
        id: 'unsorted',
        kind: 'standard',
        needsReview: true,
        originalPayee: 'MKTPLACE*7731',
        transferId: null,
      }),
      {
        ...SampleTransactions[0],
        date: '2026-09-27',
        id: 'known',
      },
    ]);

    expect(screen.getByRole('heading', { name: /28 Sep/ })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /27 Sep/ })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Category for MKTPLACE*7731: Categorize' })
    ).toBeTruthy();
  });

  it('folds split lines into a sub-list that opens with their categories and amounts', () => {
    renderTable([
      {
        ...SampleTransactions[0],
        categoryId: null,
        id: 'split',
        needsReview: false,
        splits: [
          {
            amountMinor: -500,
            categoryIcon: null,
            categoryId: 'food',
            categoryName: 'Groceries',
            groupColor: null,
            id: 'line-1',
            memo: '',
          },
          {
            amountMinor: -250,
            categoryIcon: null,
            categoryId: 'home',
            categoryName: 'Household',
            groupColor: null,
            id: 'line-2',
            memo: '',
          },
        ],
      },
    ]);

    const toggle = screen.getByRole('button', { name: 'Split into 2' });

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('list', { name: 'Split into 2 categories' })).toBeNull();

    fireEvent.click(toggle);

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('list', { name: 'Split into 2 categories' })).toBeTruthy();

    expect(screen.getByText('Groceries').closest('li')?.textContent).toBe('Groceries-$5.00');
    expect(screen.getByText('Household').closest('li')?.textContent).toBe('Household-$2.50');
    expect(screen.queryByRole('button', { name: /Categorize/ })).toBeNull();
  });
});
