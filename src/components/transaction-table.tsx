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

export function TransactionTable({ transactions }: TransactionTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="font-semibold">
          <TableHead className="text-center">Category</TableHead>
          <TableHead className="text-center">Amount</TableHead>
          <TableHead className="text-center">Date</TableHead>
          <TableHead className="text-center">Description</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="text-gray-500">
        {transactions?.map(transaction => (
          <TableRow key={transaction.id}>
            <TableCell className="font-medium flex items-center text-gray-800 gap-2">
              <Icon icon={transaction.categoryIcon} />
              {transaction.category}
            </TableCell>
            <TableCell
              className={cn('text-center', transaction.type === 'INCOME' && 'text-green-600')}
            >
              {transaction.type === 'INCOME' ? '+' : '-'} {transaction.amount}
            </TableCell>
            <TableCell className="text-center">{format(transaction.date, 'PPP')}</TableCell>
            <TableCell className="text-center">{transaction.description}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
