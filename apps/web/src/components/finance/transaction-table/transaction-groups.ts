import type { TransactionRow } from '../use-finance-data';

export type ListedTransaction = TransactionRow & { pairedWith?: TransactionRow };

export type TransactionDay = {
  date: string;
  rows: ListedTransaction[];
  totals: { amountMinor: number; currency: string }[];
};

const TransferLegCount = 2;

const isTransfer = (transaction: TransactionRow) => transaction.kind === 'transfer';

export const collapseTransfers = (transactions: TransactionRow[]): ListedTransaction[] => {
  const legs = new Map<string, TransactionRow[]>();

  for (const transaction of transactions) {
    if (!isTransfer(transaction) || !transaction.transferId) continue;

    legs.set(transaction.transferId, [...(legs.get(transaction.transferId) ?? []), transaction]);
  }

  return transactions.flatMap(transaction => {
    const pair = transaction.transferId ? legs.get(transaction.transferId) : undefined;

    if (!pair || pair.length < TransferLegCount) return [transaction];
    if (transaction.amountMinor > 0) return [];

    return [{ ...transaction, pairedWith: pair.find(leg => leg.id !== transaction.id) }];
  });
};

const dayTotals = (rows: ListedTransaction[]) => {
  const totals = new Map<string, number>();

  for (const row of rows) {
    if (isTransfer(row) || row.kind === 'opening') continue;

    totals.set(row.currency, (totals.get(row.currency) ?? 0) + row.amountMinor);
  }

  return [...totals.entries()].map(([currency, amountMinor]) => ({ amountMinor, currency }));
};

export const groupByDay = (transactions: ListedTransaction[]): TransactionDay[] => {
  const days = new Map<string, ListedTransaction[]>();

  for (const transaction of transactions) {
    days.set(transaction.date, [...(days.get(transaction.date) ?? []), transaction]);
  }

  return [...days.entries()].map(([date, rows]) => ({
    date,
    rows,
    totals: dayTotals(rows),
  }));
};
