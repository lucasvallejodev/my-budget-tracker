'use client';

import './analytics-overview.scss';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button, ColorSwatch, EmptyState, Panel, QueryContent, Stat } from '@/components/ui';
import { analyticsHref } from '@/lib/analytics-filters';
import { getPercentage } from '@/lib/math';
import { transactionsHref } from '@/lib/navigation';
import { cn } from '@/lib/styles';

import { compareWith } from '../comparisons';
import { MetricIcon } from '../metric-icon';
import { groupSpendingSlices, hasSpendingIn, SpendingBars } from '../spending-bars';
import { SpendingRanking } from '../spending-ranking';
import { useBreakdown, useCashFlow } from '../use-finance-data';
import { MonthlyBars } from './analytics-charts';
import type { AnalyticsContext } from './analytics-context';
import {
  cashFlowSpan,
  chartMonths,
  comparisonEnd,
  groupChanges,
  monthlyRows,
  periodLabel,
  periodMonths,
  shortMonth,
  totalsOf,
} from './analytics-data';

const ChangeRows = 6;
const RankedRows = 5;

function PeriodFigures({ context }: { context: AnalyticsContext }) {
  const { currency, filters, format } = context;
  const cashFlow = useCashFlow(filters.month, cashFlowSpan(filters));
  const points = cashFlow.data ?? [];
  const current = totalsOf(points, periodMonths(filters.month, filters.range), currency);
  const previous = totalsOf(points, periodMonths(comparisonEnd(filters), filters.range), currency);
  const before = periodLabel(comparisonEnd(filters), filters.range);
  const rate = getPercentage(current.keptMinor, current.incomeMinor);
  const previousRate = getPercentage(previous.keptMinor, previous.incomeMinor);
  const income = compareWith(current.incomeMinor, previous.incomeMinor, before, true);
  const spending = compareWith(current.spendingMinor, previous.spendingMinor, before, false);
  const kept = compareWith(current.keptMinor, previous.keptMinor, before, true);

  return (
    <section className="analytics-overview__figures" aria-label="Figures for the period">
      <Stat
        label="Income"
        leading={<MetricIcon kind="income" />}
        value={format(current.incomeMinor)}
        {...income}
      />
      <Stat
        label="Spending"
        leading={<MetricIcon kind="spending" />}
        value={format(current.spendingMinor)}
        {...spending}
      />
      <Stat
        label="Kept"
        leading={<MetricIcon kind="kept" />}
        value={format(current.keptMinor)}
        {...kept}
      />
      <Stat
        label="Savings rate"
        leading={<MetricIcon kind="rate" />}
        value={current.incomeMinor ? `${rate}%` : '—'}
        meta={previous.incomeMinor ? `${previousRate}% in ${before}` : undefined}
      />
    </section>
  );
}

function IncomeAndSpending({ context }: { context: AnalyticsContext }) {
  const router = useRouter();
  const { currency, filters, format, formatTick } = context;
  const cashFlow = useCashFlow(filters.month, cashFlowSpan(filters));
  const months = periodMonths(filters.month, chartMonths(filters));

  const data = monthlyRows(cashFlow.data ?? [], months, currency).map(row => ({
    expense: row.spendingMinor,
    income: row.incomeMinor,
    label: shortMonth(row.month),
    month: row.month,
  }));

  return (
    <Panel
      title="Income and spending"
      description={`Per month · ${currency} · click a month to open it`}
    >
      <MonthlyBars
        data={data}
        format={format}
        formatTick={formatTick}
        label={`Income and spending per month in ${currency}`}
        onSelect={month =>
          router.push(
            analyticsHref('/analytics', {
              ...filters,
              currency,
              month,
              range: 1,
            })
          )
        }
      />
    </Panel>
  );
}

function BiggestChanges({ context }: { context: AnalyticsContext }) {
  const { currency, filters, format } = context;

  const current = useBreakdown('group', {
    currency,
    month: filters.month,
    months: filters.range,
  });

  const previous = useBreakdown('group', {
    currency,
    month: comparisonEnd(filters),
    months: filters.range,
  });

  const changes = groupChanges(current.data ?? [], previous.data ?? [], currency).slice(
    0,
    ChangeRows
  );

  const before = periodLabel(comparisonEnd(filters), filters.range);

  const emptyTitle = hasSpendingIn(previous.data ?? [], currency)
    ? !changes.length && 'Nothing to compare in these periods'
    : `No spending in ${before} to compare with`;

  return (
    <Panel title="Biggest changes" description={`By group against ${before}`}>
      <QueryContent
        pending={current.isPending || previous.isPending}
        loading="Loading…"
        empty={emptyTitle && <EmptyState title={emptyTitle} />}
      >
        {() => (
          <ul className="analytics-overview__changes">
            {changes.map(change => (
              <li key={change.name} className="analytics-overview__change">
                <ColorSwatch color={change.color} />
                <Link href={transactionsHref(change.name, filters.month)}>{change.name}</Link>
                <span className="analytics-overview__before">
                  {format(change.beforeMinor)} → {format(change.afterMinor)}
                </span>
                <span
                  className={cn('analytics-overview__delta', {
                    'analytics-overview__delta--up': change.changeMinor > 0,
                  })}
                >
                  {change.changeMinor > 0 ? '+' : '−'}
                  {format(Math.abs(change.changeMinor))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </QueryContent>
    </Panel>
  );
}

function Rankings({ context }: { context: AnalyticsContext }) {
  const { currency, filters, format } = context;

  const params = {
    currency,
    month: filters.month,
    months: filters.range,
  };

  const groups = useBreakdown('group', params);
  const previousGroups = useBreakdown('group', { ...params, month: comparisonEnd(filters) });
  const payees = useBreakdown('payee', params);

  return (
    <div className="analytics-overview__row">
      <Panel
        title="Top groups"
        action={
          <Button asChild variant="ghost" size="sm">
            <Link href={analyticsHref('/analytics/spending', { ...filters, currency })}>
              Spending <ArrowRight aria-hidden />
            </Link>
          </Button>
        }
      >
        <SpendingBars
          comparison={
            hasSpendingIn(previousGroups.data ?? [], currency)
              ? periodLabel(comparisonEnd(filters), filters.range)
              : undefined
          }
          format={format}
          month={filters.month}
          visible={RankedRows}
          slices={groupSpendingSlices(groups.data ?? [], previousGroups.data ?? [], currency)}
        />
      </Panel>
      <SpendingRanking
        title="Top payees"
        format={format}
        items={(payees.data ?? [])
          .filter(slice => slice.currency === currency)
          .slice(0, RankedRows)
          .map(slice => ({
            href: transactionsHref(slice.name, filters.month),
            name: slice.name,
            spentMinor: slice.spentMinor,
            transactions: slice.transactions,
          }))}
      />
    </div>
  );
}

export function AnalyticsOverview({ context }: { context: AnalyticsContext }) {
  return (
    <>
      <PeriodFigures context={context} />
      <div className="analytics-overview__row">
        <IncomeAndSpending context={context} />
        <BiggestChanges context={context} />
      </div>
      <Rankings context={context} />
    </>
  );
}
