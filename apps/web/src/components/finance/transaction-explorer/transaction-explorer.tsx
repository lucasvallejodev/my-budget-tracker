'use client';

import './transaction-explorer.scss';

import { Download, SlidersHorizontal } from 'lucide-react';
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
import { cn } from '@/lib/styles';
import { formatMoney } from '@coinkeeper/shared/lib/money';

import { exportTransactions } from '../export-transactions';
import { categoryLabel, describeTransaction } from '../transaction-labels';
import { TransactionTable } from '../transaction-table';
import { TransactionRow } from '../use-finance-data';

const PageSize = 50;
const Statuses = ['Needs review', 'pending', 'cleared', 'reconciled'];

const typeOf = (transaction: TransactionRow) => {
  if (transaction.kind === 'transfer') return 'TRANSFER';
  if (transaction.kind === 'opening') return 'OPENING';

  return transaction.amountMinor < 0 ? 'EXPENSE' : 'INCOME';
};

const statusOf = (transaction: TransactionRow) =>
  transaction.needsReview ? 'Needs review' : transaction.status;

const sumsByCurrency = (rows: TransactionRow[], sign: 1 | -1) => {
  const sums = new Map<string, number>();

  for (const row of rows) {
    if (row.kind !== 'standard' || Math.sign(row.amountMinor) !== sign) continue;

    sums.set(row.currency, (sums.get(row.currency) ?? 0) + Math.abs(row.amountMinor));
  }

  return [...sums.entries()].map(([currency, total]) => formatMoney(total, currency)).join(' · ');
};

function FilteredSummary({ rows }: { rows: TransactionRow[] }) {
  const spent = sumsByCurrency(rows, -1);
  const paidIn = sumsByCurrency(rows, 1);

  return (
    <p className="transaction-explorer__summary" role="status">
      <span>
        {rows.length} transaction{rows.length === 1 ? '' : 's'}
      </span>
      {spent && (
        <span>
          Spent <strong className="transaction-explorer__figure">{spent}</strong>
        </span>
      )}
      {paidIn && (
        <span>
          Paid in{' '}
          <strong className="transaction-explorer__figure transaction-explorer__figure--positive">
            {paidIn}
          </strong>
        </span>
      )}
    </p>
  );
}

const capitalize = (label: string) => label[0].toUpperCase() + label.slice(1);

const optionsOf = (labels: string[], allLabel: string): PillSelectOption[] => [
  { label: allLabel, value: '' },
  ...[...new Set(labels)]
    .sort((left, right) => left.localeCompare(right))
    .map(label => ({ label, value: label })),
];

type ExplorerFilters = {
  account: string;
  category: string;
  from: string;
  search: string;
  status: string;
  to: string;
  type: string;
};

const searchText = (transaction: TransactionRow) =>
  `${transaction.id} ${describeTransaction(transaction)} ${transaction.memo} ${categoryLabel(transaction)} ${transaction.groupName ?? ''} ${transaction.accountName}`.toLowerCase();

const matchesFilters = (transaction: TransactionRow, filters: ExplorerFilters) =>
  searchText(transaction).includes(filters.search.toLowerCase()) &&
  [
    [filters.account, transaction.accountName],
    [filters.category, categoryLabel(transaction)],
    [filters.type, typeOf(transaction)],
    [filters.status, statusOf(transaction)],
  ].every(([wanted, actual]) => !wanted || wanted === actual) &&
  (!filters.from || transaction.date >= filters.from) &&
  (!filters.to || transaction.date <= filters.to);

const TypeOptions: PillSelectOption[] = [
  { label: 'All types', value: '' },
  { label: 'Income', value: 'INCOME' },
  { label: 'Expense', value: 'EXPENSE' },
  { label: 'Transfer', value: 'TRANSFER' },
  { label: 'Opening balance', value: 'OPENING' },
];

type SetFilter = (key: keyof ExplorerFilters, value: string) => void;

const NoFilters: ExplorerFilters = {
  account: '',
  category: '',
  from: '',
  search: '',
  status: '',
  to: '',
  type: '',
};

const StatusOptions: PillSelectOption[] = [
  { label: 'All statuses', value: '' },
  ...Statuses.map(label => ({ label: capitalize(label), value: label })),
];

function FilterFields({
  filters,
  onChange,
  showAccount,
  transactions,
}: {
  filters: ExplorerFilters;
  onChange: SetFilter;
  showAccount: boolean;
  transactions: TransactionRow[];
}) {
  return (
    <FilterBar>
      <DatePicker label="From" value={filters.from} onChange={value => onChange('from', value)} />
      <DatePicker
        label="To"
        value={filters.to}
        min={filters.from}
        onChange={value => onChange('to', value)}
      />
      {showAccount && (
        <Field variant="filter">
          Account
          <PillSelect
            value={filters.account}
            onValueChange={value => onChange('account', value)}
            options={optionsOf(
              transactions.map(transaction => transaction.accountName),
              'All accounts'
            )}
          />
        </Field>
      )}
      <Field variant="filter">
        Category
        <PillSelect
          value={filters.category}
          onValueChange={value => onChange('category', value)}
          options={optionsOf(transactions.map(categoryLabel), 'All categories')}
        />
      </Field>
      <Field variant="filter">
        Type
        <PillSelect
          value={filters.type}
          onValueChange={value => onChange('type', value)}
          options={TypeOptions}
        />
      </Field>
      <Field variant="filter">
        Status
        <PillSelect
          value={filters.status}
          onValueChange={value => onChange('status', value)}
          options={StatusOptions}
        />
      </Field>
    </FilterBar>
  );
}

function SearchRow({
  filters,
  filtersOpen,
  onChange,
  onToggleFilters,
}: {
  filters: ExplorerFilters;
  filtersOpen: boolean;
  onChange: SetFilter;
  onToggleFilters: () => void;
}) {
  const { search, ...others } = filters;
  const active = Object.values(others).filter(Boolean).length;

  return (
    <FilterBar>
      <Field variant="filter">
        Search
        <PillInput
          placeholder="Search by payee, memo, category…"
          value={search}
          onChange={event => onChange('search', event.target.value)}
        />
      </Field>
      <Button
        className="transaction-explorer__filters-toggle"
        variant="outline"
        size="sm"
        aria-expanded={filtersOpen}
        onClick={onToggleFilters}
      >
        <SlidersHorizontal aria-hidden />
        Filters{active ? ` (${active})` : ''}
      </Button>
    </FilterBar>
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
  const [filters, setFilters] = useState({ ...NoFilters, search: initialSearch });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const filtered = transactions.filter(transaction => matchesFilters(transaction, filters));
  const pages = Math.max(1, Math.ceil(filtered.length / PageSize));
  const current = Math.min(page, pages);

  const setFilter: SetFilter = (key, value) => {
    setFilters(previous => ({ ...previous, [key]: value }));
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
      <SearchRow
        filters={filters}
        filtersOpen={filtersOpen}
        onChange={setFilter}
        onToggleFilters={() => setFiltersOpen(open => !open)}
      />
      <div
        className={cn('transaction-explorer__filters', {
          'transaction-explorer__filters--open': filtersOpen,
        })}
      >
        <FilterFields
          filters={filters}
          onChange={setFilter}
          showAccount={showAccount}
          transactions={transactions}
        />
      </div>
      <FilteredSummary rows={filtered} />
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
