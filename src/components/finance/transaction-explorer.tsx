'use client';
import { DatePicker } from '../primitives/date-picker';
import { useState } from 'react';
import * as Menu from '@radix-ui/react-dropdown-menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, MoreHorizontal } from 'lucide-react';
import { categoryLabel, describeTransaction, TransactionTable } from '../transaction-table';
import { Panel, EmptyState } from './blocks';
import { Button } from '../primitives/button';
import { Dialog, DialogContent, DialogTitle } from '../primitives/dialog';
import { FINANCE_KEYS, TransactionRow } from './use-finance-data';
import { formatMoney, minorToDecimalString } from '@/lib/money';
import TransactionDialog from '@/app/(main)/_components/transaction-dialog';
import { deleteTransactionAction } from '@/app/(main)/actions';
import s from './finance.module.scss';
import c from '../primitives/controls.module.scss';

export function exportTransactions(rows: TransactionRow[]) {
  const cell = (v: unknown) =>
    `"${String(v ?? '')
      .replace(/^[=+@\-\t\r]/, "'$&")
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
    ...rows.map(t => [
      t.date,
      describeTransaction(t),
      t.payeeName ?? '',
      categoryLabel(t),
      t.groupName ?? '',
      t.accountName,
      minorToDecimalString(t.amountMinor, t.currency),
      t.currency,
      t.kind,
      t.status,
      t.memo,
      t.id,
    ]),
  ]
    .map(row => row.map(cell).join(','))
    .join('\r\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transactions.csv';
  a.click();
  URL.revokeObjectURL(url);
}
export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  return (
    <nav aria-label="Table pagination" className={s.pagination}>
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
    onSuccess: async () => {
      toast.success(transaction.kind === 'transfer' ? 'Transfer deleted' : 'Transaction deleted');
      await Promise.all(
        FINANCE_KEYS.map(key => queryClient.invalidateQueries({ queryKey: [key] }))
      );
      setDeleting(false);
    },
    onError: (error: Error) => toast.error(error.message || 'Could not delete'),
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
          <Menu.Content className={c.popover} align="end">
            <Menu.Item className={c.selectItem} onSelect={() => setDetails(true)}>
              View details
            </Menu.Item>
            {transaction.kind !== 'opening' && (
              <Menu.Item className={c.selectItem} onSelect={() => setEditing(true)}>
                Edit
              </Menu.Item>
            )}
            <Menu.Item className={c.selectItem} onSelect={() => setDeleting(true)}>
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
              Description: describeTransaction(transaction),
              Payee: transaction.payeeName || '—',
              Category: categoryLabel(transaction),
              Account: transaction.accountName,
              Amount: formatMoney(transaction.amountMinor, transaction.currency, {
                signDisplay: 'exceptZero',
              }),
              Kind: transaction.kind,
              Status: transaction.status,
              Date: transaction.date,
              Memo: transaction.memo || '—',
              ID: transaction.id,
            }).map(([key, value]) => (
              <div className={s.row} key={key}>
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
          <div className={s.actions}>
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
  transactions,
  initialSearch = '',
  showAccount = true,
}: {
  transactions: TransactionRow[];
  initialSearch?: string;
  showAccount?: boolean;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const typeOf = (t: TransactionRow) =>
    t.kind === 'transfer'
      ? 'TRANSFER'
      : t.kind === 'opening'
        ? 'OPENING'
        : t.amountMinor < 0
          ? 'EXPENSE'
          : 'INCOME';
  const statusOf = (t: TransactionRow) => (t.needsReview ? 'Needs review' : t.status);
  const filtered = transactions.filter(
    t =>
      `${t.id} ${describeTransaction(t)} ${t.memo} ${categoryLabel(t)} ${t.accountName}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!category || categoryLabel(t) === category) &&
      (!type || typeOf(t) === type) &&
      (!status || statusOf(t) === status) &&
      (!from || t.date >= from) &&
      (!to || t.date <= to)
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const current = Math.min(page, pages);
  const update = (setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };
  return (
    <Panel
      title="Transactions"
      action={
        <div className={s.actions}>
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
      <div className={s.filters}>
        <label>
          Search
          <input
            className={s.filter}
            placeholder="Search by payee, memo, category…"
            value={search}
            onChange={e => update(setSearch, e.target.value)}
          />
        </label>
        <DatePicker label="From" value={from} onChange={value => update(setFrom, value)} />
        <DatePicker label="To" value={to} min={from} onChange={value => update(setTo, value)} />
        <label>
          Category
          <select
            className={s.filter}
            value={category}
            onChange={e => update(setCategory, e.target.value)}
          >
            <option value="">All categories</option>
            {[...new Set(transactions.map(categoryLabel))].sort().map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Type
          <select className={s.filter} value={type} onChange={e => update(setType, e.target.value)}>
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
            className={s.filter}
            value={status}
            onChange={e => update(setStatus, e.target.value)}
          >
            <option value="">All statuses</option>
            {['Needs review', 'pending', 'cleared', 'reconciled'].map(v => (
              <option key={v} value={v}>
                {v[0].toUpperCase() + v.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {filtered.length ? (
        <TransactionTable
          transactions={filtered.slice((current - 1) * 10, current * 10)}
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
