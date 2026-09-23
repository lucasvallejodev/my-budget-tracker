'use client';

import { Icon } from './icon';
import { StatusBadge, EmptyState } from './finance/blocks';
import { TransactionActions } from './finance/transaction-explorer';
import { Amount } from './money/amount';
import { TransactionRow } from './finance/use-finance-data';
import s from './finance/finance.module.scss';
import { ArrowLeftRight } from 'lucide-react';

export type Transaction = TransactionRow;

export function describeTransaction(t: TransactionRow) {
  if (t.kind === 'transfer') {
    return t.amountMinor < 0
      ? `Transfer to ${t.counterpartAccountName ?? 'another account'}`
      : `Transfer from ${t.counterpartAccountName ?? 'another account'}`;
  }

  if (t.kind === 'opening') return 'Opening balance';

  return t.payeeName || t.memo || t.originalPayee || t.categoryName || 'Transaction';
}

export function categoryLabel(t: TransactionRow) {
  if (t.kind === 'transfer') return 'Transfer';
  if (t.kind === 'opening') return 'Opening balance';

  return t.categoryName ?? 'Uncategorized';
}

export function TransactionTable({
  transactions,
  showActions = false,
  showAccount = true,
}: {
  transactions: TransactionRow[];
  showActions?: boolean;
  showAccount?: boolean;
}) {
  if (!transactions.length) return <EmptyState title="No transactions yet" />;

  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
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
          {transactions.map(t => (
            <tr key={t.id}>
              <td>
                <div className={s.description}>
                  <span
                    className={s.metricIcon}
                    style={t.groupColor ? { background: t.groupColor, color: 'white' } : undefined}
                  >
                    {t.kind === 'transfer' ? (
                      <ArrowLeftRight size={18} />
                    ) : (
                      <Icon icon={t.categoryIcon} />
                    )}
                  </span>
                  <div>
                    {describeTransaction(t)}
                    {t.memo && t.payeeName && <p className={s.muted}>{t.memo}</p>}
                  </div>
                </div>
              </td>
              <td>{categoryLabel(t)}</td>
              {showAccount && <td>{t.accountName}</td>}
              <td>
                <Amount amountMinor={t.amountMinor} currency={t.currency} signed />
              </td>
              <td>
                {new Date(`${t.date}T00:00:00Z`).toLocaleDateString('en-US', {
                  timeZone: 'UTC',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </td>
              <td>
                {t.needsReview ? (
                  <StatusBadge tone="warning">Needs review</StatusBadge>
                ) : t.status === 'pending' ? (
                  <StatusBadge tone="neutral">Pending</StatusBadge>
                ) : t.status === 'reconciled' ? (
                  <StatusBadge>Reconciled</StatusBadge>
                ) : t.excluded ? (
                  <StatusBadge tone="neutral">Excluded</StatusBadge>
                ) : (
                  <StatusBadge>Cleared</StatusBadge>
                )}
              </td>
              {showActions && (
                <td>
                  <TransactionActions transaction={t} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
