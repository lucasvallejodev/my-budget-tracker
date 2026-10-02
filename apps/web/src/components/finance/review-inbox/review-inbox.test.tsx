import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { categorizeTransaction, reopenReview } from '@/api/mutations';

import { SampleTransactions } from '../sample-data';
import { type CategoryTree, QueryKeys, type ReviewSuggestion } from '../use-finance-data';
import { ReviewInbox } from './review-inbox';

vi.mock('@/api/mutations', () => ({
  categorizeTransaction: vi.fn(async () => ({})),
  reopenReview: vi.fn(async () => ({})),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

const ReviewKey = QueryKeys.transactions({ limit: '500', needsReview: '1' });

const tree = [
  {
    archivedAt: null,
    categories: [
      {
        archivedAt: null,
        icon: 'ShoppingCart',
        id: 'groceries',
        name: 'Groceries',
      },
    ],
    color: '#DC2626',
    id: 'food',
    kind: 'expense',
    name: 'Food & Dining',
  },
] as unknown as CategoryTree[];

const renderInbox = (rows: unknown[], suggestions: ReviewSuggestion[] = []) => {
  const client = new QueryClient();

  client.setQueryData(ReviewKey, rows);
  client.setQueryData(QueryKeys.reviewSuggestions, suggestions);
  client.setQueryData([...QueryKeys.categories, false], tree);

  return render(
    <QueryClientProvider client={client}>
      <ReviewInbox />
    </QueryClientProvider>
  );
};

const expense = {
  ...SampleTransactions[1],
  categoryId: null,
  id: 'unsorted',
  needsReview: true,
  payeeName: 'Farmers stall',
};

describe('ReviewInbox', () => {
  it('marks a transaction as reviewed with its current category', async () => {
    const transaction = { ...SampleTransactions[0], needsReview: true };

    renderInbox([transaction]);

    expect(screen.getByRole('heading', { name: '1 to review' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Mark as reviewed/ }));

    await waitFor(() =>
      expect(categorizeTransaction).toHaveBeenCalledWith(transaction.id, transaction.categoryId)
    );
  });

  it('pre-fills a suggestion and accepts every suggestion from the header', async () => {
    renderInbox(
      [expense],
      [
        {
          categoryId: 'groceries',
          source: 'rule',
          transactionId: 'unsorted',
        },
      ]
    );

    expect(screen.getByText('Suggested')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Category for Farmers stall: Groceries' })
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Accept 1 suggestion' }));

    await waitFor(() =>
      expect(categorizeTransaction).toHaveBeenCalledWith('unsorted', 'groceries')
    );
    expect(await screen.findByRole('heading', { name: 'Reviewed today' })).toBeTruthy();
  });

  it('opens the category with C and undoes a review from Reviewed today', async () => {
    renderInbox([expense]);

    const row = screen.getByRole('listitem', { name: 'Farmers stall' });

    fireEvent.keyDown(row, { key: 'c' });
    fireEvent.click(await screen.findByRole('option', { name: 'Groceries' }));

    expect(await screen.findByText('Not saved yet')).toBeTruthy();
    expect(categorizeTransaction).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Save the category of: Farmers stall' }));

    await waitFor(() =>
      expect(categorizeTransaction).toHaveBeenCalledWith('unsorted', 'groceries')
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Undo review of Farmers stall' }));

    await waitFor(() => expect(reopenReview).toHaveBeenCalledWith('unsorted', null));
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Reviewed today' })).toBeNull()
    );
  });

  it('returns focus to the row when the category picker opened with C is closed', async () => {
    renderInbox([expense]);

    const row = screen.getByRole('listitem', { name: 'Farmers stall' });

    row.focus();
    fireEvent.keyDown(row, { key: 'c' });
    fireEvent.keyDown(await screen.findByRole('combobox', { name: /Farmers stall/ }), {
      key: 'Escape',
    });

    await waitFor(() => expect(document.activeElement).toBe(row));
  });

  it('says when everything is categorised', () => {
    renderInbox([]);

    expect(screen.getByText('All caught up')).toBeTruthy();
  });
});
