import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/styles';
import { Icon } from './icon';
import { format } from 'date-fns';

export type Transaction = {
  id: string;
  category: string;
  type: string;
  amount: number;
  description: string;
  date: Date;
  categoryIcon: string;
};

type TransactionTableProps = {
  transactions: Transaction[];
};

type TransactionCellProps = {
  transaction: any;
};

const TransactionCell = ({ transaction }: TransactionCellProps) => {
  console.log(transaction);
  return (
    <div className="flex justify-between items-center w-full py-1">
      <div className="flex items-center gap-2">
        <div className="flex w-9 h-9 justify-center items-center rounded-[30px] border border-neutral-300">
          <Icon icon={transaction.categoryIcon} />
        </div>
        <div className="flex flex-col p-2.5">
          <div className={`text-sm text-neutral-800 leading-5 bg-red`}>
            {transaction.categoryId}
          </div>
          <div className="text-base font-bold text-neutral-1000 leading-7">
            ${transaction.amount}
          </div>
        </div>
      </div>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.49988 3.33331L14.1665 9.99998L7.49988 16.6666" stroke="#9999A3" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
};

export function TransactionTable({ transactions }: TransactionTableProps) {
  return (
    <Table>
      {/* <TableHeader>
        <TableRow className="font-semibold">
          <TableHead className="text-center">Category</TableHead>
          <TableHead className="text-center">Amount</TableHead>
          <TableHead className="text-center">Date</TableHead>
          <TableHead className="text-center">Description</TableHead>
        </TableRow>
      </TableHeader> */}
      <TableBody className="text-gray-500">
        {transactions?.map(transaction => (
          <TableRow key={transaction.id}>
            <TableCell className="font-medium flex items-center text-gray-800 gap-2">
              <TransactionCell transaction={transaction} />
              
              {transaction.category}
            </TableCell>
            {/* <TableCell
              className={cn('text-center', transaction.type === 'INCOME' && 'text-green-600')}
            >
              {transaction.type === 'INCOME' ? '+' : '-'} {transaction.amount}
            </TableCell>
            <TableCell className="text-center">{format(transaction.date, 'PPP')}</TableCell>
            <TableCell className="text-center">{transaction.description}</TableCell> */}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
