'use client';

import { linkOccurrence } from '@/api/mutations';
import {
  Amount,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  ListRow,
  QueryContent,
} from '@/components/ui';
import { addDays } from '@coinkeeper/shared/lib/periods';

import { dayMonthLabel, describeTransaction } from '../transaction-labels';
import { useEntityMutation } from '../use-entity-mutation';
import { Occurrence, TransactionRow, useTransactions } from '../use-finance-data';

const SEARCH_DAYS = 10;

const linkable = (occurrence: Occurrence) => (transaction: TransactionRow) =>
  transaction.kind === 'standard' &&
  !transaction.recurringSeriesId &&
  Math.sign(transaction.amountMinor) === Math.sign(occurrence.amountMinor);

export function LinkPaymentDialog({
  occurrence,
  onClose,
}: {
  occurrence: Occurrence;
  onClose: () => void;
}) {
  const transactions = useTransactions({
    currency: occurrence.currency,
    from: addDays(occurrence.dueOn, -SEARCH_DAYS),
    to: addDays(occurrence.dueOn, SEARCH_DAYS),
  });

  const candidates = (transactions.data ?? []).filter(linkable(occurrence));

  const { isPending, mutate } = useEntityMutation({
    errorMessage: 'Could not link the payment',
    mutationFn: (transactionId: string) =>
      linkOccurrence(occurrence.seriesId, occurrence.dueOn, transactionId),
    onSuccess: onClose,
    successMessage: 'Payment linked',
  });

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogTitle>Link a payment to {occurrence.name}</DialogTitle>
        <DialogDescription>
          Transactions within {SEARCH_DAYS} days of {dayMonthLabel(occurrence.dueOn)} that are not
          linked to a recurring payment yet.
        </DialogDescription>
        <QueryContent
          pending={transactions.isPending}
          error={transactions.isError}
          loading="Loading transactions…"
          empty={!candidates.length && <EmptyState title="No matching transactions" />}
        >
          {() =>
            candidates.map(transaction => (
              <ListRow
                key={transaction.id}
                title={describeTransaction(transaction)}
                description={`${dayMonthLabel(transaction.date)} · ${transaction.accountName}`}
              >
                <Amount amountMinor={transaction.amountMinor} currency={transaction.currency} />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  aria-label={`Link ${describeTransaction(transaction)} on ${transaction.date}`}
                  onClick={() => mutate(transaction.id)}
                >
                  Link
                </Button>
              </ListRow>
            ))
          }
        </QueryContent>
      </DialogContent>
    </Dialog>
  );
}
