'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
import { FINANCE_KEYS, useTransactions } from './use-finance-data';
import { PageHeading, Panel, EmptyState } from './blocks';
import { Button } from '../primitives/button';
import { Amount } from '../money/amount';
import CategoryPicker from '../category-picker';
import { describeTransaction } from '../transaction-table';
import { categorizeTransactionAction } from '@/app/(main)/actions';
import s from './finance.module.scss';

export function ReviewInbox() {
  const queryClient = useQueryClient();
  const rows = useTransactions({ needsReview: '1', limit: '500' });
  const categorize = useMutation({
    mutationFn: ({ id, categoryId }: { id: string; categoryId: string | null }) =>
      categorizeTransactionAction(id, categoryId),
    onSuccess: async () => {
      await Promise.all(
        FINANCE_KEYS.map(key => queryClient.invalidateQueries({ queryKey: [key] }))
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const pending = rows.data ?? [];
  return (
    <div className={s.page}>
      <PageHeading
        title="Review inbox"
        description="Transactions without a category, imported entries and anything else that needs a second look."
      />
      <Panel title={`${pending.length} to review`}>
        {rows.isPending ? (
          <p role="status">Loading…</p>
        ) : !pending.length ? (
          <EmptyState title="All caught up" description="Every transaction has a category." />
        ) : (
          <div className={s.stack}>
            {pending.map(t => (
              <div key={t.id} className={s.row}>
                <div>
                  <h3>{describeTransaction(t)}</h3>
                  <p className={s.muted}>
                    {t.accountName} · {t.date}
                    {t.originalPayee ? ` · ${t.originalPayee}` : ''}
                    {t.memo ? ` · ${t.memo}` : ''}
                  </p>
                </div>
                <div className={s.actions}>
                  <strong>
                    <Amount amountMinor={t.amountMinor} currency={t.currency} signed />
                  </strong>
                  <CategoryPicker
                    value={t.categoryId ?? undefined}
                    kind={t.amountMinor < 0 ? 'expense' : 'income'}
                    onChange={categoryId =>
                      categorize.mutate({ id: t.id, categoryId: categoryId ?? null })
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Mark ${describeTransaction(t)} as reviewed`}
                    onClick={() => categorize.mutate({ id: t.id, categoryId: t.categoryId })}
                  >
                    <CheckCircle2 size={16} /> Done
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
