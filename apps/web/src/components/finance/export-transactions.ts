import { minorToDecimalString } from '@coinkeeper/shared/lib/money';
import { Patterns } from '@coinkeeper/shared/lib/patterns';

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

const csvCell = (value: string | number | boolean | null | undefined) =>
  `"${String(value ?? '')
    .replace(Patterns.csvFormulaPrefix, "'$&")
    .replaceAll('"', '""')}"`;

export function transactionsToCsv(rows: TransactionRow[]) {
  return [
    ExportColumns,
    ...rows.map(transaction => [
      transaction.date,
      describeTransaction(transaction),
      transaction.payeeName ?? '',
      categoryLabel(transaction),
      transaction.groupName ?? '',
      transaction.accountName,
      minorToDecimalString(transaction.amountMinor, transaction.currency),
      transaction.currency,
      transaction.kind,
      transaction.status,
      transaction.memo,
      transaction.id,
    ]),
  ]
    .map(row => row.map(csvCell).join(','))
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
