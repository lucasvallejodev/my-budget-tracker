'use client';

import { useMutation } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { categorizeTransactionAction } from '@/app/(main)/actions';
import {
  Amount,
  Button,
  EmptyState,
  ListRow,
  Page,
  PageHeading,
  Panel,
  QueryContent,
  Stack,
} from '@/components/ui';

import { CategoryPicker } from '../category-picker';
import { describeTransaction } from '../transaction-labels';
import { TransactionRow, useRefreshFinance, useTransactions } from '../use-finance-data';

const ReviewLimit = '500';
const DoneIconSize = 16;

const reviewDetails = (transaction: TransactionRow) =>
  [`${transaction.accountName} · ${transaction.date}`, transaction.originalPayee, transaction.memo]
    .filter(Boolean)
    .join(' · ');

export function ReviewInbox() {
  const refresh = useRefreshFinance();
  const rows = useTransactions({ limit: ReviewLimit, needsReview: '1' });

  const categorize = useMutation({
    mutationFn: ({ categoryId, id }: { categoryId: string | null; id: string }) =>
      categorizeTransactionAction(id, categoryId),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: refresh,
  });

  const pending = rows.data ?? [];

  return (
    <Page>
      <PageHeading
        title="Review inbox"
        description="Transactions without a category, imported entries and anything else that needs a second look."
      />
      <Panel title={`${pending.length} to review`}>
        <QueryContent
          pending={rows.isPending}
          loading="Loading…"
          empty={
            !pending.length && (
              <EmptyState title="All caught up" description="Every transaction has a category." />
            )
          }
        >
          {() => (
            <Stack>
              {pending.map(transaction => (
                <ListRow
                  key={transaction.id}
                  title={describeTransaction(transaction)}
                  description={reviewDetails(transaction)}
                >
                  <strong>
                    <Amount
                      amountMinor={transaction.amountMinor}
                      currency={transaction.currency}
                      signed
                    />
                  </strong>
                  <CategoryPicker
                    value={transaction.categoryId ?? undefined}
                    kind={transaction.amountMinor < 0 ? 'expense' : 'income'}
                    onChange={categoryId =>
                      categorize.mutate({ categoryId: categoryId ?? null, id: transaction.id })
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Mark ${describeTransaction(transaction)} as reviewed`}
                    onClick={() =>
                      categorize.mutate({
                        categoryId: transaction.categoryId,
                        id: transaction.id,
                      })
                    }
                  >
                    <CheckCircle2 size={DoneIconSize} /> Done
                  </Button>
                </ListRow>
              ))}
            </Stack>
          )}
        </QueryContent>
      </Panel>
    </Page>
  );
}
