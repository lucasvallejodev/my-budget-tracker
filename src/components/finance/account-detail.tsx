'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import CreateAccountDialog from '@/app/(main)/_components/create-account-dialog';
import TransactionDialog from '@/app/(main)/_components/transaction-dialog';
import { archiveAccountAction } from '@/app/(main)/actions';
import { accountTypeLabel } from '@/constants/account';
import { formatMoney, minorToDecimalString } from '@/lib/money';

import { Amount } from '../money/amount';
import { Button } from '../primitives/button';
import { EmptyState, MetricCard, PageHeading, Panel } from './blocks';
import styles from './finance.module.scss';
import { TransactionExplorer } from './transaction-explorer';
import { AccountSummary, FinanceKeys, useAccounts, useTransactions } from './use-finance-data';

const AccountNumberVisibleDigits = 4;

export function AccountDetail({ accountId }: { accountId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const accounts = useAccounts(true);
  const transactions = useTransactions({ accountId, limit: '2000' });
  const [editing, setEditing] = useState(false);
  const [paying, setPaying] = useState(false);

  const account: AccountSummary | undefined = accounts.data?.find(
    candidate => candidate.id === accountId
  );

  const archive = useMutation({
    mutationFn: (archived: boolean) => archiveAccountAction(accountId, archived),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async (result, archived) => {
      toast.success(archived ? 'Account archived' : 'Account restored');
      await Promise.all(FinanceKeys.map(key => queryClient.invalidateQueries({ queryKey: [key] })));
      if (archived) router.push('/accounts');
    },
  });

  if (accounts.isPending) {
    return (
      <p className={styles.page} role="status">
        Loading account…
      </p>
    );
  }

  if (!account) {
    return (
      <div className={styles.page}>
        <EmptyState title="Account not found" />
      </div>
    );
  }

  const isLiability = account.classification === 'liability';
  const owed = -account.balanceMinor;

  const checking = accounts.data?.find(
    candidate =>
      candidate.classification === 'asset' && !candidate.archivedAt && candidate.id !== account.id
  );

  return (
    <div className={styles.page}>
      <PageHeading
        title={account.name}
        description={`${account.institution || accountTypeLabel(account.type)} · ${account.currency}${
          account.archivedAt ? ' · archived' : ''
        }`}
        actions={
          <>
            {isLiability && owed > 0 && !account.archivedAt && (
              <Button variant="secondary" onClick={() => setPaying(true)}>
                <CreditCard /> Pay card
              </Button>
            )}
            {!account.archivedAt && (
              <TransactionDialog
                preset={{ accountId: account.id }}
                trigger={
                  <Button>
                    <Plus /> New transaction
                  </Button>
                }
              />
            )}
            <Button variant="outline" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => archive.mutate(!account.archivedAt)}
              disabled={archive.isPending}
            >
              {account.archivedAt ? 'Restore' : 'Archive'}
            </Button>
          </>
        }
      />
      <div className={styles.grid}>
        <MetricCard
          label={isLiability ? 'Amount owed' : 'Balance'}
          value={formatMoney(isLiability ? owed : account.balanceMinor, account.currency)}
          detail={`${account.transactionCount} transaction${account.transactionCount === 1 ? '' : 's'}`}
        />
        <Panel title="Account details">
          <p className={styles.muted}>
            {account.type === 'credit_card' || account.type === 'loan'
              ? 'Liability: spending on this account increases what you owe; paying it is a transfer from another account.'
              : 'Asset account.'}
          </p>
          <p className={styles.muted}>
            Account ending in {account.accountNumber?.slice(-AccountNumberVisibleDigits) || '—'}
          </p>
          <p>{account.notes || 'No notes added.'}</p>
          {isLiability && (
            <p className={styles.muted}>
              Ledger balance:{' '}
              <Amount amountMinor={account.balanceMinor} currency={account.currency} />
            </p>
          )}
        </Panel>
      </div>
      {transactions.isPending ? (
        <p role="status">Loading transactions…</p>
      ) : (
        <TransactionExplorer transactions={transactions.data ?? []} showAccount={false} />
      )}
      {editing && (
        <CreateAccountDialog open={editing} onOpenChange={setEditing} account={account} />
      )}
      {paying && (
        <TransactionDialog
          open={paying}
          onOpenChange={setPaying}
          preset={{
            amountFrom: minorToDecimalString(owed, account.currency),
            fromAccountId: checking?.id ?? '',
            memo: `Payment to ${account.name}`,
            mode: 'transfer',
            toAccountId: account.id,
          }}
        />
      )}
    </div>
  );
}
