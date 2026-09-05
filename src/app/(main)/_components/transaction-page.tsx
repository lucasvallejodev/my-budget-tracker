'use client';
import { Button } from '@/components/primitives/button';
import CreateTransactionDialog from './create-transaction-dialog';
import { Plus } from 'lucide-react';
import { useFinanceData } from '@/components/finance/use-finance-data';
import { PageHeading, EmptyState } from '@/components/finance/blocks';
import { TransactionExplorer } from '@/components/finance/transaction-explorer';
import s from '@/components/finance/finance.module.scss';
export default function TransactionsPage({ initialSearch = '' }: { initialSearch?: string }) {
  const { transactions } = useFinanceData();
  return (
    <div className={s.page}>
      <PageHeading
        title="Transactions"
        description="View, filter, and manage your financial activity in one place."
        actions={
          <CreateTransactionDialog
            trigger={
              <Button>
                <Plus />
                New transaction
              </Button>
            }
          />
        }
      />
      {transactions.isPending ? (
        <p role="status">Loading transactions…</p>
      ) : transactions.isError ? (
        <EmptyState
          title="Could not load transactions"
          action={<Button onClick={() => void transactions.refetch()}>Try again</Button>}
        />
      ) : (
        <TransactionExplorer transactions={transactions.data || []} initialSearch={initialSearch} />
      )}
    </div>
  );
}
