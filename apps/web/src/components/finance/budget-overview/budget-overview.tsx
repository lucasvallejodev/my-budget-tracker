'use client';

import './budget-overview.scss';

import { useMutation } from '@tanstack/react-query';
import { Copy, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { copyBudgets, deleteBudget } from '@/api/mutations';
import {
  Badge,
  Button,
  Cluster,
  Dialog,
  DialogContent,
  DialogTitle,
  EmptyState,
  Page,
  PageHeading,
  Panel,
  QueryContent,
  SegmentedControl,
} from '@/components/ui';
import { FALLBACK_CURRENCY } from '@coinkeeper/shared/constants/money';
import { localIsoDate } from '@coinkeeper/shared/lib/date-helpers';
import { formatMoney } from '@coinkeeper/shared/lib/money';

import { BudgetLine } from '../budget-line';
import {
  type BudgetFigures,
  budgetFigures,
  BudgetStateOrder,
  BudgetStates,
} from '../budget-status';
import { BudgetSummary } from '../budget-summary';
import { CurrencySwitch, useCurrencyView } from '../currency-switch';
import { MonthPicker } from '../month-picker';
import {
  BudgetRow,
  currentMonth,
  monthLabel,
  useAccounts,
  useBudgets,
  useRefreshFinance,
  useSettings,
} from '../use-finance-data';
import { BudgetDialog } from './budget-dialog';
import { UnbudgetedSpending } from './unbudgeted-spending';

type SortMode = 'group' | 'name' | 'status';

const SortOptions: { label: string; value: SortMode }[] = [
  // keep order
  { label: 'By status', value: 'status' },
  { label: 'By group', value: 'group' },
  { label: 'A–Z', value: 'name' },
];

type BudgetSection = {
  badge?: { count: number; tone: (typeof BudgetStates)[keyof typeof BudgetStates]['tone'] };
  items: BudgetFigures[];
  title: string;
};

const byName = (left: BudgetFigures, right: BudgetFigures) =>
  left.budget.categoryName.localeCompare(right.budget.categoryName);

const budgetSections = (figures: BudgetFigures[], mode: SortMode): BudgetSection[] => {
  if (mode === 'name') return [{ items: [...figures].sort(byName), title: 'All budgets' }];

  if (mode === 'group') {
    return [...new Set(figures.map(item => item.budget.groupName))]
      .sort((left, right) => left.localeCompare(right))
      .map(group => ({
        items: figures.filter(item => item.budget.groupName === group).sort(byName),
        title: group,
      }));
  }

  return BudgetStateOrder.map(state => {
    const items = figures.filter(item => item.state === state).sort(byName);

    return {
      badge: { count: items.length, tone: BudgetStates[state].tone },
      items,
      title: BudgetStates[state].label,
    };
  }).filter(section => section.items.length);
};

function CategoryBudgets({
  figures,
  format,
  onDelete,
  onEdit,
}: {
  figures: BudgetFigures[];
  format: (value: number) => string;
  onDelete: (budget: BudgetRow) => void;
  onEdit: (budget: BudgetRow) => void;
}) {
  const [mode, setMode] = useState<SortMode>('status');

  return (
    <Panel
      title="Category budgets"
      action={
        <SegmentedControl
          label="Order budgets"
          options={SortOptions}
          value={mode}
          onChange={value => setMode(value as SortMode)}
        />
      }
    >
      <div className="budget-overview__sections">
        {budgetSections(figures, mode).map(section => (
          <section key={section.title} aria-label={section.title}>
            <h3 className="budget-overview__section">
              {section.badge && <Badge tone={section.badge.tone}>{section.badge.count}</Badge>}
              {section.title}
            </h3>
            <ul className="budget-overview__list">
              {section.items.map(item => (
                <BudgetLine
                  key={item.budget.id}
                  figures={item}
                  format={format}
                  onEdit={() => onEdit(item.budget)}
                  onDelete={() => onDelete(item.budget)}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Panel>
  );
}

function useBudgetActions(month: string) {
  const refresh = useRefreshFinance();
  const [deleting, setDeleting] = useState<BudgetRow | null>(null);

  const remove = useMutation({
    mutationFn: deleteBudget,
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success('Budget removed');
      setDeleting(null);
      await refresh();
    },
  });

  const copy = useMutation({
    mutationFn: () => copyBudgets(month),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async ({ copied }) => {
      toast.success(`Copied ${copied} budget${copied === 1 ? '' : 's'} from last month`);
      await refresh();
    },
  });

  return {
    copy,
    deleting,
    remove,
    setDeleting,
  };
}

function DeleteBudgetDialog({
  budget,
  month,
  onCancel,
  onConfirm,
  pending,
}: {
  budget: BudgetRow | null;
  month: string;
  onCancel: () => void;
  onConfirm: (budget: BudgetRow) => void;
  pending: boolean;
}) {
  return (
    <Dialog open={!!budget} onOpenChange={open => !open && onCancel()}>
      <DialogContent>
        <DialogTitle>Delete the {budget?.categoryName} budget?</DialogTitle>
        <p>Only the limit for {monthLabel(month)} is removed; transactions are untouched.</p>
        <Cluster>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => budget && onConfirm(budget)}
          >
            Delete budget
          </Button>
        </Cluster>
      </DialogContent>
    </Dialog>
  );
}

function useBudgetView(month: string) {
  const budgets = useBudgets(month);
  const accounts = useAccounts();
  const settings = useSettings();
  const primary = settings.data?.primaryCurrency ?? FALLBACK_CURRENCY;

  const currencies = useMemo(
    () => [...new Set([primary, ...(accounts.data ?? []).map(account => account.currency)])],
    [accounts.data, primary]
  );

  const [currency, setCurrency] = useCurrencyView(currencies, primary);
  const today = localIsoDate(new Date());
  const rows = (budgets.data ?? []).filter(row => row.currency === currency);

  return {
    currencies,
    currency,
    figures: rows.map(row => budgetFigures(row, today)),
    format: (value: number) => formatMoney(value, currency),
    pending: budgets.isPending,
    primary,
    rows,
    setCurrency,
    today,
  };
}

export function BudgetOverview() {
  const [month, setMonth] = useState(currentMonth());
  const [editing, setEditing] = useState<Partial<BudgetRow> | null>(null);
  const { copy, deleting, remove, setDeleting } = useBudgetActions(month);

  const { currencies, currency, figures, format, pending, primary, rows, setCurrency, today } =
    useBudgetView(month);

  return (
    <Page>
      <PageHeading
        title="Budgets"
        description="Monthly limits per category, measured against what you actually spent."
        actions={
          <>
            <CurrencySwitch {...{ currencies, primary }} value={currency} onChange={setCurrency} />
            <MonthPicker month={month} onChange={setMonth} />
            <Button variant="outline" onClick={() => copy.mutate()} disabled={copy.isPending}>
              <Copy aria-hidden /> Copy last month
            </Button>
            <Button variant="outline" onClick={() => setEditing({ currency })}>
              <Plus aria-hidden /> Add budget
            </Button>
          </>
        }
      />
      <QueryContent
        pending={pending}
        loading="Loading budgets…"
        empty={
          !rows.length && (
            <EmptyState
              title={`No ${currency} budgets for ${monthLabel(month)}`}
              description="Add a category limit, or copy last month's budgets."
            />
          )
        }
      >
        {() => (
          <>
            <BudgetSummary figures={figures} format={format} month={month} today={today} />
            <div className="budget-overview__columns">
              <CategoryBudgets
                figures={figures}
                format={format}
                onEdit={setEditing}
                onDelete={setDeleting}
              />
              <UnbudgetedSpending
                {...{
                  currency,
                  format,
                  month,
                }}
                budgets={rows}
                onAdd={setEditing}
              />
            </div>
          </>
        )}
      </QueryContent>
      {editing && (
        <BudgetDialog
          month={month}
          budget={editing}
          currencies={currencies}
          onClose={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}
      <DeleteBudgetDialog
        budget={deleting}
        month={month}
        pending={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={budget => remove.mutate(budget.id)}
      />
    </Page>
  );
}
