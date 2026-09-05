'use client';
import { useState } from 'react';
import * as Menu from '@radix-ui/react-dropdown-menu';
import { Download, MoreHorizontal } from 'lucide-react';
import { Transaction, TransactionTable } from '../transaction-table';
import { Panel, EmptyState } from './blocks';
import { Button } from '../primitives/button';
import { Dialog, DialogContent, DialogTitle } from '../primitives/dialog';
import { CATEGORY } from '@/constants/category';
import s from './finance.module.scss';
import c from '../primitives/controls.module.scss';
export function categoryName(t: Transaction) {
  return CATEGORY[t.categoryId as keyof typeof CATEGORY]?.name || t.category || 'Uncategorized';
}
export function exportTransactions(rows: Transaction[]) {
  const cell = (v: unknown) =>
    `"${String(v ?? '')
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replaceAll('"', '""')}"`;
  const csv = [
    ['Description', 'Category', 'ID', 'Amount', 'Type', 'Date'],
    ...rows.map(t => [
      t.description,
      categoryName(t),
      t.id,
      t.amount,
      t.type,
      new Date(t.date).toISOString().slice(0, 10),
    ]),
  ]
    .map(row => row.map(cell).join(','))
    .join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
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
export function TransactionActions({ transaction }: { transaction: Transaction }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Menu.Root>
        <Menu.Trigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${transaction.description || transaction.id}`}
          >
            <MoreHorizontal />
          </Button>
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Content className={c.popover} align="end">
            <Menu.Item className={c.selectItem} onSelect={() => setOpen(true)}>
              View details
            </Menu.Item>
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Transaction details</DialogTitle>
          <dl>
            {Object.entries({
              Description: transaction.description || '—',
              Category: categoryName(transaction),
              Amount: transaction.amount,
              Type: transaction.type,
              Date: new Date(transaction.date).toLocaleDateString(),
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
    </>
  );
}
export function TransactionExplorer({
  transactions,
  initialSearch = '',
}: {
  transactions: Transaction[];
  initialSearch?: string;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const filtered = transactions.filter(
    t =>
      `${t.id} ${t.description} ${categoryName(t)}`.toLowerCase().includes(search.toLowerCase()) &&
      (!category || categoryName(t) === category) &&
      (!type || t.type === type) &&
      (!status || t.status === status) &&
      (!from || new Date(t.date).toISOString().slice(0, 10) >= from) &&
      (!to || new Date(t.date).toISOString().slice(0, 10) <= to)
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 7));
  const current = Math.min(page, pages);
  const update = (setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };
  const statuses = [...new Set(transactions.map(t => t.status).filter(Boolean))];
  return (
    <Panel
      title="Recent Transactions"
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
            placeholder="Search by ID or description…"
            value={search}
            onChange={e => update(setSearch, e.target.value)}
          />
        </label>
        <label>
          From
          <input
            type="date"
            className={s.filter}
            value={from}
            onChange={e => update(setFrom, e.target.value)}
          />
        </label>
        <label>
          To
          <input
            type="date"
            className={s.filter}
            value={to}
            min={from}
            onChange={e => update(setTo, e.target.value)}
          />
        </label>
        <label>
          Category
          <select
            className={s.filter}
            value={category}
            onChange={e => update(setCategory, e.target.value)}
          >
            <option value="">All categories</option>
            {[...new Set(transactions.map(categoryName))].map(c => (
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
          </select>
        </label>
        {statuses.length > 0 && (
          <label>
            Status
            <select
              className={s.filter}
              value={status}
              onChange={e => update(setStatus, e.target.value)}
            >
              <option value="">All statuses</option>
              {statuses.map(v => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        )}
      </div>
      {filtered.length ? (
        <TransactionTable
          transactions={filtered.slice((current - 1) * 7, current * 7)}
          showActions
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
