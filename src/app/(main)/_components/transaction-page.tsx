'use client';

import { Button } from '@/components/ui/button';
import CreateTransactionModal from './create-transaction-dialog';
import { ReceiptText } from 'lucide-react';
import { Transaction, TransactionTable } from '@/components/transaction-table';
import { useQuery } from '@tanstack/react-query';
import { TransactionType } from '@/types/transaction';

type TransactionsPageProps = {
  type: TransactionType;
};

function TransactionsPage({ type }: TransactionsPageProps) {
  const transactionsQuery = useQuery<Transaction[]>({
    queryKey: ['transactions', type],
    queryFn: () => fetch(`/api/transactions?type=${type}`).then(res => res.json()),
    initialData: [],
  });

  return (
    <>
      <div className="flex gap-4 flex-col p-5 border rounded-sm bg-gray-50">
        <h2 className="text-xl">Manage your money</h2>
        <div className="flex gap-2 flex-col md:flex-row">
          <CreateTransactionModal
            trigger={
              <Button className="border border-gray-200 bg-white" variant="ghost">
                <ReceiptText />
                New {type === 'EXPENSE' ? 'EXPENSE' : 'INCOME'}
              </Button>
            }
            type={type}
          />
        </div>
      </div>
      <div className="flex gap-4 flex-col p-5 border rounded-sm">
        <h2 className="text-xl">Recent {type} transactions</h2>
        <TransactionTable transactions={transactionsQuery.data || []} />
      </div>
    </>
  );
}

export default TransactionsPage;
