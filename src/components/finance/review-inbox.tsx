'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { categorizeTransactionAction } from '@/app/(main)/actions';

import CategoryPicker from '../category-picker';
import { Amount } from '../money/amount';
import { Button } from '../primitives/button';
import { describeTransaction } from '../transaction-table';
import { EmptyState, PageHeading, Panel, QueryContent } from './blocks';
import styles from './finance.module.scss';
import { FinanceKeys, useTransactions } from './use-finance-data';

export function ReviewInbox() {
  const queryClient = useQueryClient();
  const rows = useTransactions({ limit: '500', needsReview: '1' });

  const categorize = useMutation({
    mutationFn: ({ categoryId, id }: { categoryId: string | null; id: string }) =>
      categorizeTransactionAction(id, categoryId),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async () => {
      await Promise.all(FinanceKeys.map(key => queryClient.invalidateQueries({ queryKey: [key] })));
    },
  });

  const pending = rows.data ?? [];

  return (
    <div className={styles.page}>
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
            <div className={styles.stack}>
              {pending.map(transaction => (
                <div key={transaction.id} className={styles.row}>
                  <div>
                    <h3>{describeTransaction(transaction)}</h3>
                    <p className={styles.muted}>
                      {transaction.accountName} · {transaction.date}
                      {transaction.originalPayee ? ` · ${transaction.originalPayee}` : ''}
                      {transaction.memo ? ` · ${transaction.memo}` : ''}
                    </p>
                  </div>
                  <div className={styles.actions}>
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
                      <CheckCircle2 size={16} /> Done
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </QueryContent>
      </Panel>
    </div>
  );
}
