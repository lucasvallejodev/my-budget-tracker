'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Plus } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useEntityMutation } from '@/app/(main)/_components/use-entity-mutation';
import { copyBudgetsAction, deleteBudgetAction, upsertBudgetAction } from '@/app/(main)/actions';
import { getPercentage } from '@/lib/math';
import { formatMoney, minorToDecimalString } from '@/lib/money';
import { Colors } from '@/styles/theme';

import CategoryPicker from '../category-picker';
import formStyles from '../forms.module.scss';
import { Icon } from '../icon';
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
import {
  BudgetInsights,
  BudgetProgress,
  budgetStatus,
  EmptyState,
  MetricCard,
  PageHeading,
  Panel,
  QueryContent,
  StatusBadge,
} from './blocks';
import { DistributionChart } from './charts';
import styles from './finance.module.scss';
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
        ...(accounts.data ?? []).map(account => account.currency),
        settings.data?.primaryCurrency ?? 'EUR',
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
    <div className={styles.page}>
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
          byCurrency.map(({ currency, rows: list }) => {
            const limit = list.reduce((total, budget) => total + budget.amountMinor, 0);
            const spent = list.reduce((total, budget) => total + budget.spentMinor, 0);
            const format = (value: number) => formatMoney(value, currency);

            return (
              <div className={styles.stack} key={currency}>
                <div className={styles.grid}>
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
                <div className={styles.columns}>
                  <Panel title={`Category budgets · ${currency}`}>
                    <div className={styles.stack}>
                      {list.map(budget => {
                        const ratio =
                          budget.amountMinor > 0 ? budget.spentMinor / budget.amountMinor : 0;

                        return (
                          <article key={budget.id} className={styles.budget}>
                            <div className={styles.balanceTitle}>
                              <div className={styles.actions}>
                                <span
                                  className={styles.metricIcon}
                                  style={{ background: budget.color, color: 'white' }}
                                >
                                  <Icon icon={budget.icon} />
                                </span>
                                <div>
                                  <h3>{budget.categoryName}</h3>
                                  <p className={styles.muted}>
                                    {budget.groupName} · Budget {format(budget.amountMinor)} · Spent{' '}
                                    {format(budget.spentMinor)}
                                  </p>
                                </div>
                              </div>
                              <StatusBadge tone={budgetStatus(ratio).tone}>
                                {budgetStatus(ratio).label}
                              </StatusBadge>
                            </div>
                            <BudgetProgress
                              spent={budget.spentMinor}
                              limit={budget.amountMinor}
                              label={`${budget.categoryName} budget`}
                              format={format}
                            />
                            <div className={styles.budgetActions}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditing(budget)}
                              >
                                Edit
                              </Button>
                              <Button asChild variant="outline" size="sm">
                                <Link
                                  href={`/transactions?q=${encodeURIComponent(budget.categoryName)}`}
                                >
                                  View transactions
                                </Link>
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeleting(budget)}
                              >
                                Delete
                              </Button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </Panel>
                  <div className={styles.stack}>
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
                    <BudgetInsights
                      insights={[
                        `${list.filter(budget => budget.spentMinor <= budget.amountMinor).length} of ${list.length} categories are within limits`,
                        ...list
                          .filter(budget => budget.spentMinor > budget.amountMinor)
                          .map(
                            budget =>
                              `${budget.categoryName} exceeded its budget by ${format(budget.spentMinor - budget.amountMinor)}`
                          ),
                      ]}
                    />
                  </div>
                </div>
              </div>
            );
          })
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
          <div className={styles.actions}>
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

function CurrencySelect({
  disabled,
  onChange,
  options,
  value,
}: {
  disabled: boolean;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <Select value={value} disabled={disabled} onValueChange={onChange}>
      <SelectTrigger className={formStyles.full}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map(code => (
            <SelectItem key={code} value={code}>
              {code}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function BudgetDialog({
  budget,
  currencies,
  month,
  onClose,
  onSaved,
}: {
  budget: Partial<BudgetRow>;
  currencies: string[];
  month: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [categoryId, setCategoryId] = useState<string | undefined>(budget.categoryId);
  const [currency, setCurrency] = useState(budget.currency ?? currencies[0] ?? 'EUR');

  const [amount, setAmount] = useState(
    budget.amountMinor ? minorToDecimalString(budget.amountMinor, budget.currency ?? 'EUR') : ''
  );

  const save = useEntityMutation({
    mutationFn: () =>
      upsertBudgetAction({
        amount,
        categoryId: categoryId!,
        currency,
        month,
      }),
    onSuccess: onSaved,
    successMessage: 'Budget saved',
  });

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogTitle>
          {budget.id ? 'Edit budget' : 'Add budget'} · {monthLabel(month)}
        </DialogTitle>
        <form
          className={formStyles.form}
          onSubmit={event => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <div className={styles.field}>
            Category
            <CategoryPicker
              value={categoryId}
              kind="expense"
              onChange={setCategoryId}
              disabled={!!budget.id}
            />
          </div>
          <label className={styles.field}>
            Currency
            <CurrencySelect
              value={currency}
              options={currencies}
              disabled={!!budget.id}
              onChange={setCurrency}
            />
          </label>
          <label className={styles.field}>
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
