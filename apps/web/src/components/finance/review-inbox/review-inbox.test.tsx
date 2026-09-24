import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { categorizeTransactionAction } from '@/app/(main)/actions';

import { SampleTransactions } from '../sample-data';
import { QueryKeys } from '../use-finance-data';
import { ReviewInbox } from './review-inbox';

vi.mock('@/app/(main)/actions', () => ({ categorizeTransactionAction: vi.fn(async () => ({})) }));

afterEach(cleanup);

describe('ReviewInbox', () => {
  it('marks a transaction as reviewed with its current category', async () => {
    const client = new QueryClient();
    const transaction = { ...SampleTransactions[0], needsReview: true };

    client.setQueryData(QueryKeys.transactions({ limit: '500', needsReview: '1' }), [transaction]);
    render(
      <QueryClientProvider client={client}>
        <ReviewInbox />
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { name: '1 to review' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /as reviewed/ }));

    await waitFor(() =>
      expect(categorizeTransactionAction).toHaveBeenCalledWith(
        transaction.id,
        transaction.categoryId
      )
    );
  });

  it('says when everything is categorised', () => {
    const client = new QueryClient();

    client.setQueryData(QueryKeys.transactions({ limit: '500', needsReview: '1' }), []);
    render(
      <QueryClientProvider client={client}>
        <ReviewInbox />
      </QueryClientProvider>
    );

    expect(screen.getByText('All caught up')).toBeTruthy();
  });
});
