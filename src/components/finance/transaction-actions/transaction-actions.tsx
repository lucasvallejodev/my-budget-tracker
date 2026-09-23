'use client';

import { useMutation } from '@tanstack/react-query';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { deleteTransactionAction } from '@/app/(main)/actions';
import {
  Button,
  Cluster,
  DescriptionList,
  Dialog,
  DialogContent,
  DialogTitle,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from '@/components/ui';
import { formatMoney } from '@/lib/money';

import { TransactionDialog } from '../transaction-dialog';
import { categoryLabel, describeTransaction } from '../transaction-labels';
import { TransactionRow, useRefreshFinance } from '../use-finance-data';

const transactionDetails = (transaction: TransactionRow) => [
  { detail: transaction.accountName, term: 'Account' },
  {
    detail: formatMoney(transaction.amountMinor, transaction.currency, {
      signDisplay: 'exceptZero',
    }),
    term: 'Amount',
  },
  { detail: categoryLabel(transaction), term: 'Category' },
  { detail: transaction.date, term: 'Date' },
  { detail: describeTransaction(transaction), term: 'Description' },
  { detail: transaction.id, term: 'ID' },
  { detail: transaction.kind, term: 'Kind' },
  { detail: transaction.memo || '—', term: 'Memo' },
  { detail: transaction.payeeName || '—', term: 'Payee' },
  { detail: transaction.status, term: 'Status' },
];

export function TransactionActions({ transaction }: { transaction: TransactionRow }) {
  const [details, setDetails] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const refresh = useRefreshFinance();
  const isTransfer = transaction.kind === 'transfer';

  const remove = useMutation({
    mutationFn: () => deleteTransactionAction(transaction.id),
    onError: (error: Error) => toast.error(error.message || 'Could not delete'),
    onSuccess: async () => {
      toast.success(isTransfer ? 'Transfer deleted' : 'Transaction deleted');
      await refresh();
      setDeleting(false);
    },
  });

  return (
    <>
      <Menu>
        <MenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${describeTransaction(transaction)}`}
          >
            <MoreHorizontal />
          </Button>
        </MenuTrigger>
        <MenuContent align="end">
          <MenuItem onSelect={() => setDetails(true)}>View details</MenuItem>
          {transaction.kind !== 'opening' && (
            <MenuItem onSelect={() => setEditing(true)}>Edit</MenuItem>
          )}
          <MenuItem onSelect={() => setDeleting(true)}>Delete</MenuItem>
        </MenuContent>
      </Menu>
      <Dialog open={details} onOpenChange={setDetails}>
        <DialogContent>
          <DialogTitle>Transaction details</DialogTitle>
          <DescriptionList items={transactionDetails(transaction)} />
        </DialogContent>
      </Dialog>
      {editing && (
        <TransactionDialog open={editing} onOpenChange={setEditing} transaction={transaction} />
      )}
      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent>
          <DialogTitle>Delete this {isTransfer ? 'transfer' : 'transaction'}?</DialogTitle>
          <p>
            {isTransfer
              ? 'Both legs of the transfer are removed and both account balances update.'
              : 'The account balance and reports update immediately. This cannot be undone.'}
          </p>
          <Cluster>
            <Button variant="outline" onClick={() => setDeleting(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
            >
              Delete
            </Button>
          </Cluster>
        </DialogContent>
      </Dialog>
    </>
  );
}
