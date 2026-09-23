'use client';

import { ArrowLeftRight } from 'lucide-react';

import { EmptyState, StatusBadge } from './finance/blocks';
import styles from './finance/finance.module.scss';
import { TransactionActions } from './finance/transaction-explorer';
import { TransactionRow } from './finance/use-finance-data';
import { Icon } from './icon';
import { Amount } from './money/amount';

export function describeTransaction(transaction: TransactionRow) {
  if (transaction.kind === 'transfer') {
    return transaction.amountMinor < 0
      ? `Transfer to ${transaction.counterpartAccountName ?? 'another account'}`
      : `Transfer from ${transaction.counterpartAccountName ?? 'another account'}`;
  }

  if (transaction.kind === 'opening') return 'Opening balance';

  return (
    transaction.payeeName ||
    transaction.memo ||
    transaction.originalPayee ||
    transaction.categoryName ||
    'Transaction'
  );
}

export function categoryLabel(transaction: TransactionRow) {
  if (transaction.kind === 'transfer') return 'Transfer';
  if (transaction.kind === 'opening') return 'Opening balance';

  return transaction.categoryName ?? 'Uncategorized';
}

function TransactionStatus({ transaction }: { transaction: TransactionRow }) {
  if (transaction.needsReview) return <StatusBadge tone="warning">Needs review</StatusBadge>;
  if (transaction.status === 'pending') return <StatusBadge tone="neutral">Pending</StatusBadge>;
  if (transaction.status === 'reconciled') return <StatusBadge>Reconciled</StatusBadge>;
  if (transaction.excluded) return <StatusBadge tone="neutral">Excluded</StatusBadge>;

  return <StatusBadge>Cleared</StatusBadge>;
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
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Description</th>
            <th scope="col">Category</th>
            {showAccount && <th scope="col">Account</th>}
            <th scope="col">Amount</th>
            <th scope="col">Date</th>
            <th scope="col">Status</th>
            {showActions && <th scope="col">Action</th>}
          </tr>
        </thead>
        <tbody>
          {transactions.map(transaction => (
            <tr key={transaction.id}>
              <td>
                <div className={styles.description}>
                  <span
                    className={styles.metricIcon}
                    style={
                      transaction.groupColor
                        ? { background: transaction.groupColor, color: 'white' }
                        : undefined
                    }
                  >
                    {transaction.kind === 'transfer' ? (
                      <ArrowLeftRight size={18} />
                    ) : (
                      <Icon icon={transaction.categoryIcon} />
                    )}
                  </span>
                  <div>
                    {describeTransaction(transaction)}
                    {transaction.memo && transaction.payeeName && (
                      <p className={styles.muted}>{transaction.memo}</p>
                    )}
                  </div>
                </div>
              </td>
              <td>{categoryLabel(transaction)}</td>
              {showAccount && <td>{transaction.accountName}</td>}
              <td>
                <Amount
                  amountMinor={transaction.amountMinor}
                  currency={transaction.currency}
                  signed
                />
              </td>
              <td>
                {new Date(`${transaction.date}T00:00:00Z`).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  timeZone: 'UTC',
                  year: 'numeric',
                })}
              </td>
              <td>
                <TransactionStatus transaction={transaction} />
              </td>
              {showActions && (
                <td>
                  <TransactionActions transaction={transaction} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
