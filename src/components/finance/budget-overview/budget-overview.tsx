'use client';

import { useMutation } from '@tanstack/react-query';
import { Copy, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { copyBudgetsAction, deleteBudgetAction } from '@/app/(main)/actions';
import {
  Button,
  Cluster,
  Columns,
  Dialog,
  DialogContent,
  DialogTitle,
  EmptyState,
  Grid,
  Page,
  PageHeading,
  Panel,
  QueryContent,
  Stack,
} from '@/components/ui';
import { getPercentage } from '@/lib/math';
import { formatMoney } from '@/lib/money';
import { Colors } from '@/styles/theme';

import { BudgetCard } from '../budget-card';
import { BudgetInsights } from '../budget-insights';
import { DistributionChart } from '../distribution-chart';
import { MetricCard } from '../metric-card';
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

const FallbackCurrency = 'EUR';
const CopyIconSize = 16;

const sumOf = (rows: BudgetRow[], pick: (row: BudgetRow) => number) =>
  rows.reduce((total, row) => total + pick(row), 0);

const budgetInsights = (list: BudgetRow[], format: (value: number) => string) => [
  `${list.filter(budget => budget.spentMinor <= budget.amountMinor).length} of ${list.length} categories are within limits`,
  ...list
    .filter(budget => budget.spentMinor > budget.amountMinor)
    .map(
      budget =>
        `${budget.categoryName} exceeded its budget by ${format(budget.spentMinor - budget.amountMinor)}`
    ),
];

function CurrencyBudgets({
  currency,
  list,
  onDelete,
  onEdit,
}: {
  currency: string;
  list: BudgetRow[];
  onDelete: (budget: BudgetRow) => void;
  onEdit: (budget: BudgetRow) => void;
}) {
  const limit = sumOf(list, budget => budget.amountMinor);
  const spent = sumOf(list, budget => budget.spentMinor);
  const format = (value: number) => formatMoney(value, currency);

  return (
    <Stack>
      <Grid>
        <MetricCard label={`Total budget · ${currency}`} value={format(limit)} />
        <MetricCard label="Spent so far" value={format(spent)} />
        <MetricCard label="Remaining" value={format(limit - spent)} negative={spent > limit} />
        <MetricCard
          label="Budget status"
          value={limit ? `${getPercentage(spent, limit)}% used` : '—'}
        />
      </Grid>
      <Columns>
        <Panel title={`Category budgets · ${currency}`}>
          <Stack>
            {list.map(budget => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                format={format}
                onEdit={() => onEdit(budget)}
                onDelete={() => onDelete(budget)}
              />
            ))}
          </Stack>
        </Panel>
        <Stack>
          <DistributionChart
            title={`Budget progress · ${currency}`}
            format={format}
            data={[
              {
                color: Colors.chart.used,
                name: 'Spent',
                value: Math.min(spent, limit),
              },
              {
                color: Colors.chart.remaining,
                name: 'Available',
                value: Math.max(0, limit - spent),
              },
            ]}
          />
          <BudgetInsights insights={budgetInsights(list, format)} />
        </Stack>
      </Columns>
    </Stack>
  );
}

export function BudgetOverview() {
  const refresh = useRefreshFinance();
  const [month, setMonth] = useState(currentMonth());
  const budgets = useBudgets(month);
  const accounts = useAccounts();
  const settings = useSettings();
  const [editing, setEditing] = useState<Partial<BudgetRow> | null>(null);
  const [deleting, setDeleting] = useState<BudgetRow | null>(null);

  const currencies = useMemo(
    () => [
      ...new Set([
        ...(accounts.data ?? []).map(account => account.currency),
        settings.data?.primaryCurrency ?? FallbackCurrency,
      ]),
    ],
    [accounts.data, settings.data]
  );

  const remove = useMutation({
    mutationFn: deleteBudgetAction,
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success('Budget removed');
      setDeleting(null);
      await refresh();
    },
  });

  const copy = useMutation({
    mutationFn: () => copyBudgetsAction(month),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async ({ copied }) => {
      toast.success(`Copied ${copied} budget${copied === 1 ? '' : 's'} from last month`);
      await refresh();
    },
  });

  const rows = budgets.data ?? [];

  const byCurrency = currencies
    .map(currency => ({ currency, rows: rows.filter(row => row.currency === currency) }))
    .filter(bucket => bucket.rows.length);

  return (
    <Page>
      <PageHeading
        title="Budgets"
        description="Monthly limits per category, compared with what the ledger says you spent. Budgets are per currency, like everything else."
        actions={
          <>
            <MonthPicker month={month} onChange={setMonth} />
            <Button variant="outline" onClick={() => copy.mutate()} disabled={copy.isPending}>
              <Copy size={CopyIconSize} /> Copy last month
            </Button>
            <Button onClick={() => setEditing({ currency: currencies[0] })}>
              <Plus />
              Add budget
            </Button>
          </>
        }
      />
      <QueryContent
        pending={budgets.isPending}
        loading="Loading budgets…"
        empty={
          !rows.length && (
            <EmptyState
              title={`No budgets for ${monthLabel(month)}`}
              description="Add a category limit, or copy last month's budgets."
            />
          )
        }
      >
        {() =>
          byCurrency.map(({ currency, rows: list }) => (
            <CurrencyBudgets
              key={currency}
              currency={currency}
              list={list}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          ))
        }
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
      <Dialog open={!!deleting} onOpenChange={open => !open && setDeleting(null)}>
        <DialogContent>
          <DialogTitle>Delete the {deleting?.categoryName} budget?</DialogTitle>
          <p>Only the limit for {monthLabel(month)} is removed; transactions are untouched.</p>
          <Cluster>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => deleting && remove.mutate(deleting.id)}
            >
              Delete budget
            </Button>
          </Cluster>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
