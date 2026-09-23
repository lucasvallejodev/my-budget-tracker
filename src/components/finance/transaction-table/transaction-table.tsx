'use client';

import './transaction-table.scss';

import { ArrowLeftRight } from 'lucide-react';

import {
  Amount,
  Badge,
  EmptyState,
  Icon,
  IconTile,
  Table,
  TableCell,
  TableHeaderCell,
  TableRow,
  Text,
} from '@/components/ui';

import { TransactionActions } from '../transaction-actions';
import { categoryLabel, describeTransaction } from '../transaction-labels';
import { TransactionRow } from '../use-finance-data';

const TransferIconSize = 18;

const DateDisplay: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
  year: 'numeric',
};

function TransactionStatus({ transaction }: { transaction: TransactionRow }) {
  if (transaction.needsReview) return <Badge tone="warning">Needs review</Badge>;
  if (transaction.status === 'pending') return <Badge tone="neutral">Pending</Badge>;
  if (transaction.status === 'reconciled') return <Badge>Reconciled</Badge>;
  if (transaction.excluded) return <Badge tone="neutral">Excluded</Badge>;

  return <Badge>Cleared</Badge>;
}

export function TransactionTable({
  showAccount = true,
  showActions = false,
  transactions,
}: {
  showAccount?: boolean;
  showActions?: boolean;
  transactions: TransactionRow[];
}) {
  if (!transactions.length) return <EmptyState title="No transactions yet" />;

  return (
    <Table>
      <thead>
        <tr>
          <TableHeaderCell>Description</TableHeaderCell>
          <TableHeaderCell>Category</TableHeaderCell>
          {showAccount && <TableHeaderCell>Account</TableHeaderCell>}
          <TableHeaderCell>Amount</TableHeaderCell>
          <TableHeaderCell>Date</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          {showActions && <TableHeaderCell>Action</TableHeaderCell>}
        </tr>
      </thead>
      <tbody>
        {transactions.map(transaction => (
          <TableRow key={transaction.id}>
            <TableCell>
              <div className="transaction-table__description">
                <IconTile color={transaction.groupColor}>
                  {transaction.kind === 'transfer' ? (
                    <ArrowLeftRight size={TransferIconSize} />
                  ) : (
                    <Icon icon={transaction.categoryIcon} />
                  )}
                </IconTile>
                <div>
                  {describeTransaction(transaction)}
                  {transaction.memo && transaction.payeeName && (
                    <Text tone="muted">{transaction.memo}</Text>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell>{categoryLabel(transaction)}</TableCell>
            {showAccount && <TableCell>{transaction.accountName}</TableCell>}
            <TableCell>
              <Amount
                amountMinor={transaction.amountMinor}
                currency={transaction.currency}
                signed
              />
            </TableCell>
            <TableCell>
              {new Date(`${transaction.date}T00:00:00Z`).toLocaleDateString('en-US', DateDisplay)}
            </TableCell>
            <TableCell>
              <TransactionStatus transaction={transaction} />
            </TableCell>
            {showActions && (
              <TableCell>
                <TransactionActions transaction={transaction} />
              </TableCell>
            )}
          </TableRow>
        ))}
      </tbody>
    </Table>
  );
}
