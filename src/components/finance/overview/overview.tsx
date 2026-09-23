'use client';

import { AlertTriangle, ArrowDownRight, ArrowUpRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import TransactionDialog from '@/app/(main)/_components/transaction-dialog';
import {
  Button,
  Columns,
  EmptyState,
  Grid,
  Notice,
  Page,
  PageHeading,
  Panel,
  Stack,
} from '@/components/ui';
import { getPercentage } from '@/lib/math';
import { formatMoney } from '@/lib/money';

import { CashFlowChart } from '../cash-flow-chart';
import { DistributionChart } from '../distribution-chart';
import { MetricCard } from '../metric-card';
import { MonthPicker } from '../month-picker';
import { NetWorthCards } from '../net-worth-cards';
import { TransactionTable } from '../transaction-table';
import type { Summary } from '../use-finance-data';
import { currentMonth, monthLabel, useSummary, useTransactions } from '../use-finance-data';

const MonthAbbreviationLength = 3;
const RecentTransactionLimit = '6';
const NoticeIconSize = 16;

const describeConversion = (converted: NonNullable<Summary['converted']>): string => {
  const base = `Approximate, using your manual rates as of ${converted.asOf}`;

  if (!converted.rates.length) return base;

  const rates = converted.rates
    .map(rate => `1 ${rate.currency} = ${rate.rate} ${converted.currency} from ${rate.date}`)
    .join(', ');

  return `${base} (${rates})`;
};

function ConvertedTotals({
  converted,
  month,
}: {
  converted: NonNullable<Summary['converted']>;
  month: string;
}) {
  return (
    <Panel
      title={`≈ Converted totals · ${converted.currency}`}
      description={describeConversion(converted)}
    >
      <Grid>
        <MetricCard
          label="Net worth"
          value={formatMoney(converted.netWorthMinor, converted.currency)}
          detail="All currencies converted"
        />
        <MetricCard
          label="Income"
          value={formatMoney(converted.incomeMinor, converted.currency)}
          detail={monthLabel(month)}
        />
        <MetricCard
          label="Spending"
          value={formatMoney(converted.spendingMinor, converted.currency)}
          detail={monthLabel(month)}
        />
      </Grid>
      {converted.missing.length > 0 && (
        <Notice role="status">
          No rate to {converted.currency} for {converted.missing.join(', ')}; those amounts are left
          out. <Link href="/settings/currencies">Add rates</Link>
        </Notice>
      )}
    </Panel>
  );
}

function CurrencyMetrics({
  currency,
  data,
  month,
}: {
  currency: string;
  data: Summary;
  month: string;
}) {
  const totals = data.totals.find(total => total.currency === currency);
  const income = totals?.incomeMinor ?? 0;
  const spending = totals?.spendingMinor ?? 0;

  return (
    <Grid>
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
    </Grid>
  );
}

const cashFlowPoints = (data: Summary, months: string[], currency: string) =>
  months.map(month => {
    const point = data.cashFlow.find(
      candidate => candidate.month === month && candidate.currency === currency
    );

    return {
      expense: point?.spendingMinor ?? 0,
      income: point?.incomeMinor ?? 0,
      label: monthLabel(month).split(' ')[0].slice(0, MonthAbbreviationLength),
    };
  });

function RecentTransactions() {
  const recent = useTransactions({ limit: RecentTransactionLimit });

  return (
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
  );
}

export function Overview({ analytics = false }: { analytics?: boolean }) {
  const [month, setMonth] = useState(currentMonth());
  const summary = useSummary(month);

  if (summary.isPending) return <Page role="status">Loading your finances…</Page>;

  if (summary.isError || !summary.data) {
    return (
      <Page>
        <EmptyState
          title="Could not load your finances"
          description={summary.error?.message}
          action={<Button onClick={() => void summary.refetch()}>Try again</Button>}
        />
      </Page>
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
    <Page>
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
        <Notice role="status">
          <AlertTriangle size={NoticeIconSize} /> {data.needsReviewCount} transaction
          {data.needsReviewCount === 1 ? ' needs' : 's need'} a category.{' '}
          <Link href="/review">Review them</Link>
        </Notice>
      )}
      {data.converted && <ConvertedTotals converted={data.converted} month={month} />}
      {!currencies.length && (
        <EmptyState
          title="No activity yet"
          description="Create an account and record your first transaction to see your numbers here."
        />
      )}
      {currencies.map(currency => (
        <CurrencyMetrics key={currency} currency={currency} data={data} month={month} />
      ))}
      <Columns>
        <Stack>
          {currencies.map(currency => (
            <CashFlowChart
              key={currency}
              description={`Income vs spending · ${currency}`}
              format={value => formatMoney(value, currency)}
              data={cashFlowPoints(data, months, currency)}
            />
          ))}
          {!analytics && <RecentTransactions />}
        </Stack>
        <Stack>
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
        </Stack>
      </Columns>
    </Page>
  );
}
