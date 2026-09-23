import type { TransactionRow } from './use-finance-data';

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
