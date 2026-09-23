'use client';

import * as Menu from '@radix-ui/react-dropdown-menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import TransactionDialog from '@/app/(main)/_components/transaction-dialog';
import { deleteTransactionAction } from '@/app/(main)/actions';
import { formatMoney, minorToDecimalString } from '@/lib/money';
import { Patterns } from '@/lib/patterns';

import { Button } from '../primitives/button';
import controlStyles from '../primitives/controls.module.scss';
import { DatePicker } from '../primitives/date-picker';
import { Dialog, DialogContent, DialogTitle } from '../primitives/dialog';
import { categoryLabel, describeTransaction, TransactionTable } from '../transaction-table';
import { EmptyState, Panel } from './blocks';
import styles from './finance.module.scss';
import { FinanceKeys, TransactionRow } from './use-finance-data';

const PageSize = 10;

export function exportTransactions(rows: TransactionRow[]) {
  const cell = (value: string | number | boolean | null | undefined) =>
    `"${String(value ?? '')
      .replace(Patterns.csvFormulaPrefix, "'$&")
      .replaceAll('"', '""')}"`;

  const csv = [
    [
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
    ],
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
    .map(row => row.map(cell).join(','))
    .join('\r\n');

  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');

  link.href = url;
  link.download = 'transactions.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function Pagination({
  onChange,
  page,
  pages,
}: {
  onChange: (page: number) => void;
  page: number;
  pages: number;
}) {
  return (
    <nav aria-label="Table pagination" className={styles.pagination}>
      <Button variant="outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      <span aria-live="polite">
        Page {page} of {pages}
      </span>
      <Button variant="outline" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next
      </Button>
    </nav>
  );
}

export function TransactionActions({ transaction }: { transaction: TransactionRow }) {
  const [details, setDetails] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();

  const remove = useMutation({
    mutationFn: () => deleteTransactionAction(transaction.id),
    onError: (error: Error) => toast.error(error.message || 'Could not delete'),
    onSuccess: async () => {
      toast.success(transaction.kind === 'transfer' ? 'Transfer deleted' : 'Transaction deleted');
      await Promise.all(FinanceKeys.map(key => queryClient.invalidateQueries({ queryKey: [key] })));
      setDeleting(false);
    },
  });

  return (
    <>
      <Menu.Root>
        <Menu.Trigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${describeTransaction(transaction)}`}
          >
            <MoreHorizontal />
          </Button>
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Content className={controlStyles.popover} align="end">
            <Menu.Item className={controlStyles.selectItem} onSelect={() => setDetails(true)}>
              View details
            </Menu.Item>
            {transaction.kind !== 'opening' && (
              <Menu.Item className={controlStyles.selectItem} onSelect={() => setEditing(true)}>
                Edit
              </Menu.Item>
            )}
            <Menu.Item className={controlStyles.selectItem} onSelect={() => setDeleting(true)}>
              Delete
            </Menu.Item>
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>
      <Dialog open={details} onOpenChange={setDetails}>
        <DialogContent>
          <DialogTitle>Transaction details</DialogTitle>
          <dl>
            {Object.entries({
              Account: transaction.accountName,
              Amount: formatMoney(transaction.amountMinor, transaction.currency, {
                signDisplay: 'exceptZero',
              }),
              Category: categoryLabel(transaction),
              Date: transaction.date,
              Description: describeTransaction(transaction),
              ID: transaction.id,
              Kind: transaction.kind,
              Memo: transaction.memo || '—',
              Payee: transaction.payeeName || '—',
              Status: transaction.status,
            }).map(([key, value]) => (
              <div className={styles.row} key={key}>
                <dt>{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>
      {editing && (
        <TransactionDialog open={editing} onOpenChange={setEditing} transaction={transaction} />
      )}
      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent>
          <DialogTitle>
            Delete this {transaction.kind === 'transfer' ? 'transfer' : 'transaction'}?
          </DialogTitle>
          <p>
            {transaction.kind === 'transfer'
              ? 'Both legs of the transfer are removed and both account balances update.'
              : 'The account balance and reports update immediately. This cannot be undone.'}
          </p>
          <div className={styles.actions}>
            <Button variant="outline" onClick={() => setDeleting(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TransactionExplorer({
  initialSearch = '',
  showAccount = true,
  transactions,
}: {
  initialSearch?: string;
  showAccount?: boolean;
  transactions: TransactionRow[];
}) {
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const typeOf = (transaction: TransactionRow) => {
    if (transaction.kind === 'transfer') return 'TRANSFER';
    if (transaction.kind === 'opening') return 'OPENING';

    return transaction.amountMinor < 0 ? 'EXPENSE' : 'INCOME';
  };

  const statusOf = (transaction: TransactionRow) =>
    transaction.needsReview ? 'Needs review' : transaction.status;

  const filtered = transactions.filter(
    transaction =>
      `${transaction.id} ${describeTransaction(transaction)} ${transaction.memo} ${categoryLabel(transaction)} ${transaction.accountName}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!category || categoryLabel(transaction) === category) &&
      (!type || typeOf(transaction) === type) &&
      (!status || statusOf(transaction) === status) &&
      (!from || transaction.date >= from) &&
      (!to || transaction.date <= to)
  );

  const pages = Math.max(1, Math.ceil(filtered.length / PageSize));
  const current = Math.min(page, pages);

  const update = (setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <Panel
      title="Transactions"
      action={
        <div className={styles.actions}>
          <Button variant="outline" size="sm" onClick={() => exportTransactions(filtered)}>
            <Download />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            Print / PDF
          </Button>
        </div>
      }
    >
      <div className={styles.filters}>
        <label>
          Search
          <input
            className={styles.filter}
            placeholder="Search by payee, memo, category…"
            value={search}
            onChange={event => update(setSearch, event.target.value)}
          />
        </label>
        <DatePicker label="From" value={from} onChange={value => update(setFrom, value)} />
        <DatePicker label="To" value={to} min={from} onChange={value => update(setTo, value)} />
        <label>
          Category
          <select
            className={styles.filter}
            value={category}
            onChange={event => update(setCategory, event.target.value)}
          >
            <option value="">All categories</option>
            {[...new Set(transactions.map(categoryLabel))]
              .sort((left, right) => left.localeCompare(right))
              .map(label => (
                <option key={label}>{label}</option>
              ))}
          </select>
        </label>
        <label>
          Type
          <select
            className={styles.filter}
            value={type}
            onChange={event => update(setType, event.target.value)}
          >
            <option value="">All types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
            <option value="TRANSFER">Transfer</option>
            <option value="OPENING">Opening balance</option>
          </select>
        </label>
        <label>
          Status
          <select
            className={styles.filter}
            value={status}
            onChange={event => update(setStatus, event.target.value)}
          >
            <option value="">All statuses</option>
            {['Needs review', 'pending', 'cleared', 'reconciled'].map(label => (
              <option key={label} value={label}>
                {label[0].toUpperCase() + label.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {filtered.length ? (
        <TransactionTable
          transactions={filtered.slice((current - 1) * PageSize, current * PageSize)}
          showActions
          showAccount={showAccount}
        />
      ) : (
        <EmptyState
          title="No transactions found"
          description="Try another filter or add your first transaction."
        />
      )}
      <Pagination page={current} pages={pages} onChange={setPage} />
    </Panel>
  );
}
