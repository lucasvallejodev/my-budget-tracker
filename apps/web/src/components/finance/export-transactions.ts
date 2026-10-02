import { toCsvCell } from '@coinkeeper/shared/lib/csv';
import { minorToDecimalString } from '@coinkeeper/shared/lib/money';

import { categoryLabel, describeTransaction } from './transaction-labels';
import type { TransactionRow } from './use-finance-data';

const ExportFileName = 'transactions.csv';
const CsvMimeType = 'text/csv;charset=utf-8;';
const ByteOrderMark = '\uFEFF';
const CsvLineBreak = '\r\n';

const ExportColumns = [
  'Date',
  'Description',
  'Payee',
  'Category',
  'Group',
  'Account',
  'Amount',
  'Currency',
  'Kind',
  'Status',
  'Memo',
  'ID',
];

const csvRow = (
  transaction: TransactionRow,
  line: { amountMinor: number; category: string; group: string; memo: string }
) => [
  transaction.date,
  describeTransaction(transaction),
  transaction.payeeName ?? '',
  line.category,
  line.group,
  transaction.accountName,
  minorToDecimalString(line.amountMinor, transaction.currency),
  transaction.currency,
  transaction.kind,
  transaction.status,
  line.memo,
  transaction.id,
];

const csvRowsOf = (transaction: TransactionRow): string[][] => {
  if (!transaction.splits.length) {
    return [
      csvRow(transaction, {
        amountMinor: transaction.amountMinor,
        category: categoryLabel(transaction),
        group: transaction.groupName ?? '',
        memo: transaction.memo,
      }),
    ];
  }

  return transaction.splits.map(line =>
    csvRow(transaction, {
      amountMinor: line.amountMinor,
      category: line.categoryName ?? 'Uncategorized',
      group: '',
      memo: line.memo || transaction.memo,
    })
  );
};

export function transactionsToCsv(rows: TransactionRow[]) {
  return [ExportColumns, ...rows.flatMap(csvRowsOf)]
    .map(row => row.map(toCsvCell).join(','))
    .join(CsvLineBreak);
}

export function exportTransactions(rows: TransactionRow[]) {
  const url = URL.createObjectURL(
    new Blob([ByteOrderMark + transactionsToCsv(rows)], { type: CsvMimeType })
  );

  const link = document.createElement('a');

  link.href = url;
  link.download = ExportFileName;
  link.click();
  URL.revokeObjectURL(url);
}
