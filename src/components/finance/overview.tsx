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

import TransactionDialog from '@/app/(main)/_components/transaction-dialog';
import { getPercentage } from '@/lib/math';
import { formatMoney } from '@/lib/money';

import { Button } from '../primitives/button';
import { TransactionTable } from '../transaction-table';
import { EmptyState, MetricCard, PageHeading, Panel } from './blocks';
import { CashFlowChart, DistributionChart } from './charts';
import styles from './finance.module.scss';
import { NetWorthCards } from './net-worth';
import type { Summary } from './use-finance-data';
import {
  currentMonth,
  monthLabel,
  shiftMonth,
  useSummary,
  useTransactions,
} from './use-finance-data';

const MonthAbbreviationLength = 3;

export function MonthPicker({
  month,
  onChange,
}: {
  month: string;
  onChange: (month: string) => void;
}) {
  return (
    <div className={styles.actions} role="group" aria-label="Month">
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

const describeConversion = (converted: NonNullable<Summary['converted']>): string => {
  const base = `Approximate, using your manual rates as of ${converted.asOf}`;

  if (!converted.rates.length) return base;

  const rates = converted.rates
    .map(rate => `1 ${rate.currency} = ${rate.rate} ${converted.currency} from ${rate.date}`)
    .join(', ');

  return `${base} (${rates})`;
};

export function Overview({ analytics = false }: { analytics?: boolean }) {
  const [month, setMonth] = useState(currentMonth());
  const summary = useSummary(month);
  const recent = useTransactions({ limit: '6' });

  if (summary.isPending) {
    return (
      <div className={styles.page} role="status">
        Loading your finances…
      </div>
    );
  }

  if (summary.isError || !summary.data) {
    return (
      <div className={styles.page}>
        <EmptyState
          title="Could not load your finances"
          description={summary.error?.message}
          action={<Button onClick={() => void summary.refetch()}>Try again</Button>}
        />
      </div>
    );
  }

  const data = summary.data;

  const currencies = [
    ...new Set([
      ...data.totals.map(total => total.currency),
      ...data.netWorth.map(bucket => bucket.currency),
    ]),
  ];

  const months = [...new Set(data.cashFlow.map(point => point.month))].sort((left, right) =>
    left.localeCompare(right)
  );

  return (
    <div className={styles.page}>
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
        <p className={styles.notice} role="status">
          <AlertTriangle size={16} /> {data.needsReviewCount} transaction
          {data.needsReviewCount === 1 ? ' needs' : 's need'} a category.{' '}
          <Link href="/review">Review them</Link>
        </p>
      )}
      {data.converted && (
        <Panel
          title={`≈ Converted totals · ${data.converted.currency}`}
          description={describeConversion(data.converted)}
        >
          <div className={styles.grid}>
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
            <p className={styles.notice} role="status">
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
        const totals = data.totals.find(total => total.currency === currency);
        const income = totals?.incomeMinor ?? 0;
        const spending = totals?.spendingMinor ?? 0;

        return (
          <div className={styles.grid} key={currency}>
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
              value={income ? `${getPercentage(income - spending, income)}%` : '—'}
              detail="Income kept this month"
            />
          </div>
        );
      })}
      <div className={styles.columns}>
        <div className={styles.stack}>
          {currencies.map(currency => (
            <CashFlowChart
              key={currency}
              description={`Income vs spending · ${currency}`}
              format={value => formatMoney(value, currency)}
              data={months.map(month => {
                const point = data.cashFlow.find(
                  point => point.month === month && point.currency === currency
                );

                return {
                  expense: point?.spendingMinor ?? 0,
                  income: point?.incomeMinor ?? 0,
                  label: monthLabel(month).split(' ')[0].slice(0, MonthAbbreviationLength),
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
        <div className={styles.stack}>
          <NetWorthCards buckets={data.netWorth} accounts={data.accounts} />
          {currencies.map(currency => (
            <DistributionChart
              key={currency}
              title={`Spending by group · ${currency}`}
              format={value => formatMoney(value, currency)}
              data={data.breakdown
                .filter(slice => slice.currency === currency && slice.spentMinor > 0)
                .map(slice => ({
                  color: slice.color,
                  name: slice.groupName,
                  value: slice.spentMinor,
                }))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
