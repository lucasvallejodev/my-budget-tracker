'use client';

import { useMutation } from '@tanstack/react-query';
import { CreditCard, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { setAccountArchived } from '@/api/mutations';
import { Amount, Button, EmptyState, Grid, Page, PageHeading, Panel, Text } from '@/components/ui';
import { accountTypeLabel } from '@/constants/account';
import { formatMoney, minorToDecimalString } from '@coinkeeper/shared/lib/money';

import { CreateAccountDialog } from '../create-account-dialog';
import { MetricCard } from '../metric-card';
import { TransactionDialog } from '../transaction-dialog';
import { TransactionExplorer } from '../transaction-explorer';
import {
  AccountSummary,
  useAccounts,
  useRefreshFinance,
  useTransactions,
} from '../use-finance-data';

const AccountNumberVisibleDigits = 4;
const AccountTransactionLimit = '2000';

export function AccountDetail({ accountId }: { accountId: string }) {
  const router = useRouter();
  const refresh = useRefreshFinance();
  const accounts = useAccounts(true);
  const transactions = useTransactions({ accountId, limit: AccountTransactionLimit });
  const [editing, setEditing] = useState(false);
  const [paying, setPaying] = useState(false);

  const account: AccountSummary | undefined = accounts.data?.find(
    candidate => candidate.id === accountId
  );

  const archive = useMutation({
    mutationFn: (archived: boolean) => setAccountArchived(accountId, archived),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async (result, archived) => {
      toast.success(archived ? 'Account archived' : 'Account restored');
      await refresh();
      if (archived) router.push('/accounts');
    },
  });

  if (accounts.isPending) return <Page role="status">Loading account…</Page>;

  if (!account) {
    return (
      <Page>
        <EmptyState title="Account not found" />
      </Page>
    );
  }

  const isLiability = account.classification === 'liability';
  const owed = -account.balanceMinor;

  const checking = accounts.data?.find(
    candidate =>
      candidate.classification === 'asset' && !candidate.archivedAt && candidate.id !== account.id
  );

  return (
    <Page>
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
      <Grid>
        <MetricCard
          label={isLiability ? 'Amount owed' : 'Balance'}
          value={formatMoney(isLiability ? owed : account.balanceMinor, account.currency)}
          detail={`${account.transactionCount} transaction${account.transactionCount === 1 ? '' : 's'}`}
        />
        <Panel title="Account details">
          <Text tone="muted">
            {account.type === 'credit_card' || account.type === 'loan'
              ? 'Liability: spending on this account increases what you owe; paying it is a transfer from another account.'
              : 'Asset account.'}
          </Text>
          <Text tone="muted">
            Account ending in {account.accountNumber?.slice(-AccountNumberVisibleDigits) || '—'}
          </Text>
          <p>{account.notes || 'No notes added.'}</p>
          {isLiability && (
            <Text tone="muted">
              Ledger balance:{' '}
              <Amount amountMinor={account.balanceMinor} currency={account.currency} />
            </Text>
          )}
        </Panel>
      </Grid>
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
    </Page>
  );
}
