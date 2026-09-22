'use client';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  currentMonth,
  monthLabel,
  shiftMonth,
  useSummary,
  useTransactions,
} from './use-finance-data';
import { Panel, PageHeading, MetricCard, EmptyState } from './blocks';
import { CashFlowChart, DistributionChart } from './charts';
import { Button } from '../primitives/button';
import { TransactionTable } from '../transaction-table';
import TransactionDialog from '@/app/(main)/_components/transaction-dialog';
import { formatMoney } from '@/lib/money';
import { NetWorthCards } from './net-worth';
import s from './finance.module.scss';

export function MonthPicker({
  month,
  onChange,
}: {
  month: string;
  onChange: (month: string) => void;
}) {
  return (
    <div className={s.actions} role="group" aria-label="Month">
      <Button
        variant="outline"
        size="icon"
        aria-label="Previous month"
        onClick={() => onChange(shiftMonth(month, -1))}
      >
        <ChevronLeft />
      </Button>
      <strong aria-live="polite">{monthLabel(month)}</strong>
      <Button
        variant="outline"
        size="icon"
        aria-label="Next month"
        disabled={month >= currentMonth()}
        onClick={() => onChange(shiftMonth(month, 1))}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}

export function Overview({ analytics = false }: { analytics?: boolean }) {
  const [month, setMonth] = useState(currentMonth());
  const summary = useSummary(month);
  const recent = useTransactions({ limit: '6' });
  if (summary.isPending)
    return (
      <div className={s.page} role="status">
        Loading your finances…
      </div>
    );
  if (summary.isError || !summary.data)
    return (
      <div className={s.page}>
        <EmptyState
          title="Could not load your finances"
          description={summary.error?.message}
          action={<Button onClick={() => void summary.refetch()}>Try again</Button>}
        />
      </div>
    );
  const data = summary.data;
  const currencies = [
    ...new Set([...data.totals.map(t => t.currency), ...data.netWorth.map(n => n.currency)]),
  ];
  const months = [...new Set(data.cashFlow.map(p => p.month))].sort();
  return (
    <div className={s.page}>
      <PageHeading
        title={analytics ? 'Analytics' : 'Dashboard Overview'}
        description={
          analytics
            ? 'Understand your spending patterns and financial performance over time.'
            : 'Track your money, performance, and trends — all in one place.'
        }
        actions={
          <>
            <MonthPicker month={month} onChange={setMonth} />
            <TransactionDialog
              trigger={
                <Button>
                  <Plus />
                  New transaction
                </Button>
              }
            />
          </>
        }
      />
      {data.needsReviewCount > 0 && (
        <p className={s.notice} role="status">
          <AlertTriangle size={16} /> {data.needsReviewCount} transaction
          {data.needsReviewCount === 1 ? ' needs' : 's need'} a category.{' '}
          <Link href="/review">Review them</Link>
        </p>
      )}
      {data.converted && (
        <Panel
          title={`≈ Converted totals · ${data.converted.currency}`}
          description={`Approximate, using your manual rates as of ${data.converted.asOf}${
            data.converted.rates.length
              ? ` (${data.converted.rates.map(r => `1 ${r.currency} = ${r.rate} ${data.converted!.currency} from ${r.date}`).join(', ')})`
              : ''
          }`}
        >
          <div className={s.grid}>
            <MetricCard
              label="Net worth"
              value={formatMoney(data.converted.netWorthMinor, data.converted.currency)}
              detail="All currencies converted"
            />
            <MetricCard
              label="Income"
              value={formatMoney(data.converted.incomeMinor, data.converted.currency)}
              detail={monthLabel(month)}
            />
            <MetricCard
              label="Spending"
              value={formatMoney(data.converted.spendingMinor, data.converted.currency)}
              detail={monthLabel(month)}
            />
          </div>
          {data.converted.missing.length > 0 && (
            <p className={s.notice} role="status">
              No rate to {data.converted.currency} for {data.converted.missing.join(', ')}; those
              amounts are left out. <Link href="/settings/currencies">Add rates</Link>
            </p>
          )}
        </Panel>
      )}
      {!currencies.length && (
        <EmptyState
          title="No activity yet"
          description="Create an account and record your first transaction to see your numbers here."
        />
      )}
      {currencies.map(currency => {
        const totals = data.totals.find(t => t.currency === currency);
        const income = totals?.incomeMinor ?? 0;
        const spending = totals?.spendingMinor ?? 0;
        return (
          <div className={s.grid} key={currency}>
            <MetricCard
              label={`Income · ${currency}`}
              value={formatMoney(income, currency)}
              icon={<ArrowUpRight />}
              detail={monthLabel(month)}
            />
            <MetricCard
              label={`Spending · ${currency}`}
              value={formatMoney(spending, currency)}
              icon={<ArrowDownRight />}
              detail={monthLabel(month)}
            />
            <MetricCard
              label={`Savings rate · ${currency}`}
              value={income ? `${Math.round(((income - spending) / income) * 100)}%` : '—'}
              detail="Income kept this month"
            />
          </div>
        );
      })}
      <div className={s.columns}>
        <div className={s.stack}>
          {currencies.map(currency => (
            <CashFlowChart
              key={currency}
              description={`Income vs spending · ${currency}`}
              format={value => formatMoney(value, currency)}
              data={months.map(m => {
                const point = data.cashFlow.find(p => p.month === m && p.currency === currency);
                return {
                  label: monthLabel(m).split(' ')[0].slice(0, 3),
                  income: point?.incomeMinor ?? 0,
                  expense: point?.spendingMinor ?? 0,
                };
              })}
            />
          ))}
          {!analytics && (
            <Panel
              title="Recent Transactions"
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/transactions">See more</Link>
                </Button>
              }
            >
              {recent.isPending ? (
                <p role="status">Loading…</p>
              ) : (
                <TransactionTable transactions={recent.data ?? []} />
              )}
            </Panel>
          )}
        </div>
        <div className={s.stack}>
          <NetWorthCards buckets={data.netWorth} accounts={data.accounts} />
          {currencies.map(currency => (
            <DistributionChart
              key={currency}
              title={`Spending by group · ${currency}`}
              format={value => formatMoney(value, currency)}
              data={data.breakdown
                .filter(slice => slice.currency === currency && slice.spentMinor > 0)
                .map(slice => ({
                  name: slice.groupName,
                  value: slice.spentMinor,
                  color: slice.color,
                }))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
