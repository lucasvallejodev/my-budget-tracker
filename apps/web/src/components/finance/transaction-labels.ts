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

const DayParts = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
  weekday: 'short',
  year: 'numeric',
});

const dateParts = (formatter: Intl.DateTimeFormat, date: string) =>
  Object.fromEntries(
    formatter.formatToParts(new Date(`${date}T00:00:00Z`)).map(part => [part.type, part.value])
  );

export const dayLabel = (date: string, currentYear: string): string => {
  const parts = dateParts(DayParts, date);

  const label = `${parts.weekday} ${parts.day} ${parts.month}`;

  return date.startsWith(currentYear) ? label : `${label} ${parts.year}`;
};

export const dayMonthLabel = (date: string): string => {
  const parts = dateParts(DayParts, date);

  return `${parts.day} ${parts.month}`;
};

const LongDayParts = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
  weekday: 'long',
});

export const longDayLabel = (date: string): string => {
  const parts = dateParts(LongDayParts, date);

  return `${parts.weekday} ${parts.day} ${parts.month}`;
};
