'use client';

import './analytics-cash-flow.scss';

import {
  ColorSwatch,
  EmptyState,
  Panel,
  QueryContent,
  Table,
  TableCell,
  TableHeaderCell,
  TableRow,
} from '@/components/ui';
import { getPercentage } from '@/lib/math';
import { cn } from '@/lib/styles';
import { PERCENT_SCALE } from '@coinkeeper/shared/constants/money';

import { type GroupSlice, monthLabel, useBreakdown, useCashFlow } from '../use-finance-data';
import { MonthlyBars } from './analytics-charts';
import type { AnalyticsContext } from './analytics-context';
import {
  cashFlowSpan,
  chartMonths,
  monthlyRows,
  periodLabel,
  periodMonths,
  type PeriodTotals,
  shortMonth,
  totalsOf,
} from './analytics-data';

const SplitGroups = 5;
const OtherColor = 'var(--color-chart-muted)';
const KeptColor = 'var(--color-positive-mark)';

export type IncomeSegment = {
  color: string;
  name: string;
  perHundred: number;
  valueMinor: number;
};

export const incomeSplit = (
  totals: PeriodTotals,
  groups: GroupSlice[],
  currency: string
): IncomeSegment[] => {
  if (totals.incomeMinor <= 0) return [];

  const perHundred = (value: number) => Math.round((value / totals.incomeMinor) * PERCENT_SCALE);

  const spent = groups
    .filter(group => group.currency === currency && group.spentMinor > 0)
    .sort((left, right) => right.spentMinor - left.spentMinor);

  const top = spent.slice(0, SplitGroups);
  const rest = spent.slice(SplitGroups).reduce((sum, group) => sum + group.spentMinor, 0);

  const segments = [
    ...top.map(group => ({
      color: group.color,
      name: group.groupName,
      valueMinor: group.spentMinor,
    })),
    ...(rest
      ? [
          {
            color: OtherColor,
            name: 'Other spending',
            valueMinor: rest,
          },
        ]
      : []),
    ...(totals.keptMinor > 0
      ? [
          {
            color: KeptColor,
            name: 'Kept',
            valueMinor: totals.keptMinor,
          },
        ]
      : []),
  ];

  return segments.map(segment => ({ ...segment, perHundred: perHundred(segment.valueMinor) }));
};

function IncomeSplit({ context }: { context: AnalyticsContext }) {
  const { currency, filters, format } = context;
  const cashFlow = useCashFlow(filters.month, cashFlowSpan(filters));

  const groups = useBreakdown('group', {
    currency,
    month: filters.month,
    months: filters.range,
  });

  const totals = totalsOf(
    cashFlow.data ?? [],
    periodMonths(filters.month, filters.range),
    currency
  );

  const segments = incomeSplit(totals, groups.data ?? [], currency);

  return (
    <Panel
      title="Where each 100 of income went"
      description={`${periodLabel(filters.month, filters.range)} · income ${format(totals.incomeMinor)}`}
    >
      <QueryContent
        pending={cashFlow.isPending || groups.isPending}
        loading="Loading…"
        empty={!segments.length && <EmptyState title="No income in this period" />}
      >
        {() => (
          <>
            <div className="analytics-cash-flow__split" aria-hidden>
              {segments.map(segment => (
                <span
                  key={segment.name}
                  className="analytics-cash-flow__segment"
                  style={{ background: segment.color, flexGrow: segment.valueMinor }}
                />
              ))}
            </div>
            <ul className="analytics-cash-flow__legend">
              {segments.map(segment => (
                <li key={segment.name} className="analytics-cash-flow__item">
                  <ColorSwatch color={segment.color} />
                  <span>{segment.name}</span>
                  <strong className="analytics-cash-flow__figure">{segment.perHundred}</strong>
                  <span className="analytics-cash-flow__amount">{format(segment.valueMinor)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </QueryContent>
    </Panel>
  );
}

export function AnalyticsCashFlow({ context }: { context: AnalyticsContext }) {
  const { currency, filters, format, formatTick } = context;
  const cashFlow = useCashFlow(filters.month, cashFlowSpan(filters));
  const months = periodMonths(filters.month, chartMonths(filters));
  const rows = monthlyRows(cashFlow.data ?? [], months, currency);
  const averageKept = Math.round(rows.reduce((sum, row) => sum + row.keptMinor, 0) / rows.length);
  const selected = periodMonths(filters.month, filters.range);

  return (
    <>
      <IncomeSplit context={context} />
      <Panel
        title="Income, spending and kept"
        description={`Kept on average ${format(averageKept)} a month over ${rows.length} months`}
      >
        <MonthlyBars
          data={rows.map(row => ({
            expense: row.spendingMinor,
            income: row.incomeMinor,
            label: shortMonth(row.month),
            month: row.month,
          }))}
          format={format}
          formatTick={formatTick}
          label={`Income and spending per month in ${currency}`}
        />
      </Panel>
      <Panel title="Month by month">
        <Table label="Cash flow per month">
          <thead>
            <tr>
              <TableHeaderCell>Month</TableHeaderCell>
              <TableHeaderCell>Income</TableHeaderCell>
              <TableHeaderCell>Spending</TableHeaderCell>
              <TableHeaderCell>Kept</TableHeaderCell>
              <TableHeaderCell>Savings rate</TableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {[...rows].reverse().map(row => (
              <TableRow
                key={row.month}
                className={cn({ 'analytics-cash-flow__selected': selected.includes(row.month) })}
              >
                <TableCell>{monthLabel(row.month)}</TableCell>
                <TableCell>{format(row.incomeMinor)}</TableCell>
                <TableCell>{format(row.spendingMinor)}</TableCell>
                <TableCell>{format(row.keptMinor)}</TableCell>
                <TableCell>
                  {row.incomeMinor ? `${getPercentage(row.keptMinor, row.incomeMinor)}%` : '—'}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}
