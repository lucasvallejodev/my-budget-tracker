'use client';

import { useState } from 'react';
import { Button } from '@/components/primitives/button';
import TransactionDialog from './transaction-dialog';
import { Plus } from 'lucide-react';
import { currentMonth, useTransactions } from '@/components/finance/use-finance-data';
import { PageHeading, EmptyState } from '@/components/finance/blocks';
import { TransactionExplorer } from '@/components/finance/transaction-explorer';
import { MonthPicker } from '@/components/finance/overview';
import s from '@/components/finance/finance.module.scss';

export default function TransactionsPage({ initialSearch = '' }: { initialSearch?: string }) {
  const [month, setMonth] = useState<string | undefined>(
    initialSearch ? undefined : currentMonth()
  );

  const transactions = useTransactions({ month, limit: '2000' });

  return (
    <div className={s.page}>
      <PageHeading
        title="Transactions"
        description="View, filter, and manage your financial activity in one place."
        actions={
          <>
            {month ? (
              <MonthPicker month={month} onChange={setMonth} />
            ) : (
              <Button variant="outline" onClick={() => setMonth(currentMonth())}>
                Filter by month
              </Button>
            )}
            {month && (
              <Button variant="ghost" onClick={() => setMonth(undefined)}>
                All months
              </Button>
            )}
            <TransactionDialog
              trigger={
                <Button>
                  <Plus />
                  New transaction
                </Button>
              }
            />
          </>
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
