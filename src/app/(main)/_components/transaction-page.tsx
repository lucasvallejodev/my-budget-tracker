'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { PageHeading, QueryContent } from '@/components/finance/blocks';
import styles from '@/components/finance/finance.module.scss';
import { MonthPicker } from '@/components/finance/overview';
import { TransactionExplorer } from '@/components/finance/transaction-explorer';
import { currentMonth, useTransactions } from '@/components/finance/use-finance-data';
import { Button } from '@/components/primitives/button';

import TransactionDialog from './transaction-dialog';

export default function TransactionsPage({ initialSearch = '' }: { initialSearch?: string }) {
  const [month, setMonth] = useState<string | undefined>(
    initialSearch ? undefined : currentMonth()
  );

  const transactions = useTransactions({ limit: '2000', month });

  return (
    <div className={styles.page}>
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
      <QueryContent
        pending={transactions.isPending}
        error={transactions.isError}
        loading="Loading transactions…"
        errorTitle="Could not load transactions"
        onRetry={() => void transactions.refetch()}
      >
        {() => (
          <TransactionExplorer
            transactions={transactions.data ?? []}
            initialSearch={initialSearch}
          />
        )}
      </QueryContent>
    </div>
  );
}
