'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';

import {
  Button,
  Cluster,
  DatePicker,
  EmptyState,
  Field,
  FilterBar,
  Pagination,
  Panel,
  PillInput,
  PillSelect,
  PillSelectOption,
} from '@/components/ui';

import { exportTransactions } from '../export-transactions';
import { categoryLabel, describeTransaction } from '../transaction-labels';
import { TransactionTable } from '../transaction-table';
import { TransactionRow } from '../use-finance-data';

const PageSize = 10;
const Statuses = ['Needs review', 'pending', 'cleared', 'reconciled'];

const typeOf = (transaction: TransactionRow) => {
  if (transaction.kind === 'transfer') return 'TRANSFER';
  if (transaction.kind === 'opening') return 'OPENING';

  return transaction.amountMinor < 0 ? 'EXPENSE' : 'INCOME';
};

const statusOf = (transaction: TransactionRow) =>
  transaction.needsReview ? 'Needs review' : transaction.status;

const capitalize = (label: string) => label[0].toUpperCase() + label.slice(1);

const TypeOptions: PillSelectOption[] = [
  { label: 'All types', value: '' },
  { label: 'Income', value: 'INCOME' },
  { label: 'Expense', value: 'EXPENSE' },
  { label: 'Transfer', value: 'TRANSFER' },
  { label: 'Opening balance', value: 'OPENING' },
];

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

  const update = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <Panel
      title="Transactions"
      action={
        <Cluster>
          <Button variant="outline" size="sm" onClick={() => exportTransactions(filtered)}>
            <Download />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            Print / PDF
          </Button>
        </Cluster>
      }
    >
      <FilterBar>
        <Field variant="filter">
          Search
          <PillInput
            placeholder="Search by payee, memo, category…"
            value={search}
            onChange={event => update(setSearch, event.target.value)}
          />
        </Field>
        <DatePicker label="From" value={from} onChange={value => update(setFrom, value)} />
        <DatePicker label="To" value={to} min={from} onChange={value => update(setTo, value)} />
        <Field variant="filter">
          Category
          <PillSelect
            value={category}
            onValueChange={value => update(setCategory, value)}
            options={[
              { label: 'All categories', value: '' },
              ...[...new Set(transactions.map(categoryLabel))]
                .sort((left, right) => left.localeCompare(right))
                .map(label => ({ label, value: label })),
            ]}
          />
        </Field>
        <Field variant="filter">
          Type
          <PillSelect
            value={type}
            onValueChange={value => update(setType, value)}
            options={TypeOptions}
          />
        </Field>
        <Field variant="filter">
          Status
          <PillSelect
            value={status}
            onValueChange={value => update(setStatus, value)}
            options={[
              { label: 'All statuses', value: '' },
              ...Statuses.map(label => ({ label: capitalize(label), value: label })),
            ]}
          />
        </Field>
      </FilterBar>
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
      <Pagination label="Table pagination" page={current} pages={pages} onChange={setPage} />
    </Panel>
  );
}
