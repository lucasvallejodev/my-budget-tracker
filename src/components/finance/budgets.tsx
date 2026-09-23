'use client';

import { Colors } from '@/styles/theme';
import { getPercentage } from '@/lib/math';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Copy, Plus } from 'lucide-react';
import {
  PageHeading,
  MetricCard,
  Panel,
  BudgetProgress,
  BudgetInsights,
  EmptyState,
  StatusBadge,
} from './blocks';
import { DistributionChart } from './charts';
import { Button } from '../primitives/button';
import { Dialog, DialogContent, DialogTitle } from '../primitives/dialog';
import { Input } from '../primitives/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../primitives/select';
import CategoryPicker from '../category-picker';
import { Icon } from '../icon';
import { MonthPicker } from './overview';
import {
  BudgetRow,
  currentMonth,
  FinanceKeys,
  monthLabel,
  useAccounts,
  useBudgets,
  useSettings,
} from './use-finance-data';
import { copyBudgetsAction, deleteBudgetAction, upsertBudgetAction } from '@/app/(main)/actions';
import { formatMoney, minorToDecimalString } from '@/lib/money';
import s from './finance.module.scss';
import f from '../forms.module.scss';

export function BudgetOverview() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(currentMonth());
  const budgets = useBudgets(month);
  const accounts = useAccounts();
  const settings = useSettings();
  const [editing, setEditing] = useState<Partial<BudgetRow> | null>(null);
  const [deleting, setDeleting] = useState<BudgetRow | null>(null);

  const refresh = () =>
    Promise.all(FinanceKeys.map(key => queryClient.invalidateQueries({ queryKey: [key] })));

  const currencies = useMemo(
    () => [
      ...new Set([
        ...(accounts.data ?? []).map(a => a.currency),
        settings.data?.primaryCurrency ?? 'EUR',
      ]),
    ],
    [accounts.data, settings.data]
  );

  const remove = useMutation({
    mutationFn: deleteBudgetAction,
    onSuccess: async () => {
      toast.success('Budget removed');
      setDeleting(null);
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const copy = useMutation({
    mutationFn: () => copyBudgetsAction(month),
    onSuccess: async ({ copied }) => {
      toast.success(`Copied ${copied} budget${copied === 1 ? '' : 's'} from last month`);
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = budgets.data ?? [];

  const byCurrency = currencies
    .map(currency => ({ currency, rows: rows.filter(r => r.currency === currency) }))
    .filter(b => b.rows.length);

  return (
    <div className={s.page}>
      <PageHeading
        title="Budgets"
        description="Monthly limits per category, compared with what the ledger says you spent. Budgets are per currency, like everything else."
        actions={
          <>
            <MonthPicker month={month} onChange={setMonth} />
            <Button variant="outline" onClick={() => copy.mutate()} disabled={copy.isPending}>
              <Copy size={16} /> Copy last month
            </Button>
            <Button onClick={() => setEditing({ currency: currencies[0] })}>
              <Plus />
              Add budget
            </Button>
          </>
        }
      />
      {budgets.isPending ? (
        <p role="status">Loading budgets…</p>
      ) : !rows.length ? (
        <EmptyState
          title={`No budgets for ${monthLabel(month)}`}
          description="Add a category limit, or copy last month's budgets."
        />
      ) : (
        byCurrency.map(({ currency, rows: list }) => {
          const limit = list.reduce((n, b) => n + b.amountMinor, 0);
          const spent = list.reduce((n, b) => n + b.spentMinor, 0);
          const format = (value: number) => formatMoney(value, currency);

          return (
            <div className={s.stack} key={currency}>
              <div className={s.grid}>
                <MetricCard label={`Total budget · ${currency}`} value={format(limit)} />
                <MetricCard label="Spent so far" value={format(spent)} />
                <MetricCard
                  label="Remaining"
                  value={format(limit - spent)}
                  negative={spent > limit}
                />
                <MetricCard
                  label="Budget status"
                  value={limit ? `${getPercentage(spent, limit)}% used` : '—'}
                />
              </div>
              <div className={s.columns}>
                <Panel title={`Category budgets · ${currency}`}>
                  <div className={s.stack}>
                    {list.map(b => {
                      const ratio = b.amountMinor > 0 ? b.spentMinor / b.amountMinor : 0;

                      return (
                        <article key={b.id} className={s.budget}>
                          <div className={s.balanceTitle}>
                            <div className={s.actions}>
                              <span
                                className={s.metricIcon}
                                style={{ background: b.color, color: 'white' }}
                              >
                                <Icon icon={b.icon} />
                              </span>
                              <div>
                                <h3>{b.categoryName}</h3>
                                <p className={s.muted}>
                                  {b.groupName} · Budget {format(b.amountMinor)} · Spent{' '}
                                  {format(b.spentMinor)}
                                </p>
                              </div>
                            </div>
                            <StatusBadge
                              tone={ratio >= 1 ? 'danger' : ratio >= 0.8 ? 'warning' : 'success'}
                            >
                              {ratio >= 1 ? 'Exceeded' : ratio >= 0.8 ? 'Near limit' : 'On track'}
                            </StatusBadge>
                          </div>
                          <BudgetProgress
                            spent={b.spentMinor}
                            limit={b.amountMinor}
                            label={`${b.categoryName} budget`}
                            format={format}
                          />
                          <div className={s.budgetActions}>
                            <Button variant="outline" size="sm" onClick={() => setEditing(b)}>
                              Edit
                            </Button>
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/transactions?q=${encodeURIComponent(b.categoryName)}`}>
                                View transactions
                              </Link>
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setDeleting(b)}>
                              Delete
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </Panel>
                <div className={s.stack}>
                  <DistributionChart
                    title={`Budget progress · ${currency}`}
                    format={format}
                    data={[
                      {
                        name: 'Spent',
                        value: Math.min(spent, limit),
                        color: Colors.chart.used,
                      },
                      {
                        name: 'Available',
                        value: Math.max(0, limit - spent),
                        color: Colors.chart.remaining,
                      },
                    ]}
                  />
                  <BudgetInsights
                    insights={[
                      `${list.filter(b => b.spentMinor <= b.amountMinor).length} of ${list.length} categories are within limits`,
                      ...list
                        .filter(b => b.spentMinor > b.amountMinor)
                        .map(
                          b =>
                            `${b.categoryName} exceeded its budget by ${format(b.spentMinor - b.amountMinor)}`
                        ),
                    ]}
                  />
                </div>
              </div>
            </div>
          );
        })
      )}
      {editing && (
        <BudgetDialog
          month={month}
          budget={editing}
          currencies={currencies}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            await refresh();
            setEditing(null);
          }}
        />
      )}
      <Dialog open={!!deleting} onOpenChange={open => !open && setDeleting(null)}>
        <DialogContent>
          <DialogTitle>Delete the {deleting?.categoryName} budget?</DialogTitle>
          <p>Only the limit for {monthLabel(month)} is removed; transactions are untouched.</p>
          <div className={s.actions}>
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BudgetDialog({
  month,
  budget,
  currencies,
  onClose,
  onSaved,
}: {
  month: string;
  budget: Partial<BudgetRow>;
  currencies: string[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [categoryId, setCategoryId] = useState<string | undefined>(budget.categoryId);
  const [currency, setCurrency] = useState(budget.currency ?? currencies[0] ?? 'EUR');

  const [amount, setAmount] = useState(
    budget.amountMinor ? minorToDecimalString(budget.amountMinor, budget.currency ?? 'EUR') : ''
  );

  const save = useMutation({
    mutationFn: () =>
      upsertBudgetAction({
        categoryId: categoryId!,
        month,
        currency,
        amount,
      }),
    onSuccess: async () => {
      toast.success('Budget saved');
      await onSaved();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogTitle>
          {budget.id ? 'Edit budget' : 'Add budget'} · {monthLabel(month)}
        </DialogTitle>
        <form
          className={f.form}
          onSubmit={event => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <div className={s.field}>
            Category
            <CategoryPicker
              value={categoryId}
              kind="expense"
              onChange={setCategoryId}
              disabled={!!budget.id}
            />
          </div>
          <label className={s.field}>
            Currency
            <Select value={currency} disabled={!!budget.id} onValueChange={setCurrency}>
              <SelectTrigger className={f.full}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {currencies.map(code => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </label>
          <label className={s.field}>
            Monthly limit
            <Input
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={event => setAmount(event.target.value)}
              required
            />
          </label>
          <Button type="submit" disabled={save.isPending || !categoryId || !amount.trim()}>
            Save budget
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
