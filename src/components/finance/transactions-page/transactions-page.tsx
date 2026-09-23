'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button, Page, PageHeading, QueryContent } from '@/components/ui';

import { MonthPicker } from '../month-picker';
import { TransactionDialog } from '../transaction-dialog';
import { TransactionExplorer } from '../transaction-explorer';
import { currentMonth, useTransactions } from '../use-finance-data';

export function TransactionsPage({ initialSearch = '' }: { initialSearch?: string }) {
  const [month, setMonth] = useState<string | undefined>(
    initialSearch ? undefined : currentMonth()
  );

  const transactions = useTransactions({ limit: '2000', month });

  return (
    <Page>
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
    </Page>
  );
}
