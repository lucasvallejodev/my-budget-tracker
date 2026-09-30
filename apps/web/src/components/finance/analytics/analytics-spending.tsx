'use client';

import './analytics-spending.scss';

import { ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
  ColorSwatch,
  Panel,
  QueryContent,
  Table,
  TableCell,
  TableHeaderCell,
  TableRow,
} from '@/components/ui';
import { getPercentage } from '@/lib/math';
import { transactionsHref } from '@/lib/navigation';
import { cn } from '@/lib/styles';

import {
  type CategorySlice,
  type GroupMonthSlice,
  type GroupSlice,
  useBreakdown,
} from '../use-finance-data';
import { StackedGroups, type StackSeries } from './analytics-charts';
import type { AnalyticsContext } from './analytics-context';
import {
  chartMonths,
  comparisonEnd,
  groupChanges,
  periodLabel,
  periodMonths,
  shortMonth,
} from './analytics-data';

const StackedGroupCount = 6;
const OtherKey = 'other';
const OtherColor = 'var(--color-chart-muted)';

export const stackedRows = (
  slices: GroupMonthSlice[],
  months: string[],
  currency: string
): { data: Record<string, number | string>[]; series: StackSeries[] } => {
  const own = slices.filter(slice => slice.currency === currency);
  const totals = new Map<string, { color: string; total: number }>();

  for (const slice of own) {
    const entry = totals.get(slice.groupName) ?? { color: slice.color, total: 0 };

    totals.set(slice.groupName, { ...entry, total: entry.total + slice.spentMinor });
  }

  const top = [...totals.entries()]
    .sort(([, left], [, right]) => right.total - left.total)
    .slice(0, StackedGroupCount)
    .map(([name]) => name);

  const data = months.map(month => {
    const row: Record<string, number | string> = { label: shortMonth(month), [OtherKey]: 0 };

    for (const slice of own.filter(item => item.month === month)) {
      const key = top.includes(slice.groupName) ? slice.groupName : OtherKey;

      row[key] = Number(row[key] ?? 0) + slice.spentMinor;
    }

    return row;
  });

  const series = top.map(name => ({
    color: totals.get(name)?.color ?? OtherColor,
    key: name,
    name,
  }));

  const hasOther = totals.size > top.length;

  return {
    data,
    series: hasOther
      ? [
          ...series,
          {
            color: OtherColor,
            key: OtherKey,
            name: 'Other',
          },
        ]
      : series,
  };
};

function CategoryRows({
  categories,
  context,
  group,
}: {
  categories: CategorySlice[];
  context: AnalyticsContext;
  group: string;
}) {
  return categories
    .filter(category => category.groupName === group)
    .map(category => (
      <TableRow key={category.categoryId ?? category.categoryName}>
        <TableCell className="analytics-spending__category">
          <Link href={transactionsHref(category.categoryName, context.filters.month)}>
            {category.categoryName}
          </Link>
        </TableCell>
        <TableCell />
        <TableCell className="analytics-spending__number">
          {context.format(category.spentMinor)}
        </TableCell>
        <TableCell colSpan={3} />
      </TableRow>
    ));
}

function GroupRow({
  average,
  change,
  context,
  expanded,
  onToggle,
  share,
}: {
  average: number;
  change: ReturnType<typeof groupChanges>[number];
  context: AnalyticsContext;
  expanded: boolean;
  onToggle: () => void;
  share: number;
}) {
  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <TableRow>
      <TableCell>
        <button
          type="button"
          className="analytics-spending__toggle"
          aria-expanded={expanded}
          onClick={onToggle}
        >
          <Chevron aria-hidden />
          <ColorSwatch color={change.color} />
          {change.name}
        </button>
      </TableCell>
      <TableCell className="analytics-spending__number">{share}%</TableCell>
      <TableCell className="analytics-spending__number">
        <Link href={transactionsHref(change.name, context.filters.month)}>
          {context.format(change.afterMinor)}
        </Link>
      </TableCell>
      <TableCell className="analytics-spending__number">
        {context.format(change.beforeMinor)}
      </TableCell>
      <TableCell
        className={cn('analytics-spending__number', 'analytics-spending__change', {
          'analytics-spending__change--up': change.changeMinor > 0,
        })}
      >
        {change.changeMinor > 0 ? '+' : ''}
        {context.format(change.changeMinor)}
      </TableCell>
      <TableCell className="analytics-spending__number">{context.format(average)}</TableCell>
    </TableRow>
  );
}

function BreakdownTable({
  byMonth,
  categories,
  context,
  current,
  previous,
}: {
  byMonth: GroupMonthSlice[];
  categories: CategorySlice[];
  context: AnalyticsContext;
  current: GroupSlice[];
  previous: GroupSlice[];
}) {
  const [open, setOpen] = useState<string[]>([]);
  const { currency, filters } = context;

  const changes = groupChanges(current, previous, currency).sort(
    (left, right) => right.afterMinor - left.afterMinor
  );

  const total = changes.reduce((sum, change) => sum + change.afterMinor, 0);
  const months = chartMonths(filters);

  const averageOf = (name: string) =>
    Math.round(
      byMonth
        .filter(slice => slice.currency === currency && slice.groupName === name)
        .reduce((sum, slice) => sum + slice.spentMinor, 0) / months
    );

  const toggle = (name: string) =>
    setOpen(current =>
      current.includes(name) ? current.filter(item => item !== name) : [...current, name]
    );

  return (
    <Table label="Spending by group">
      <thead>
        <tr>
          <TableHeaderCell>Group</TableHeaderCell>
          <TableHeaderCell>Share</TableHeaderCell>
          <TableHeaderCell>{periodLabel(filters.month, filters.range)}</TableHeaderCell>
          <TableHeaderCell>{periodLabel(comparisonEnd(filters), filters.range)}</TableHeaderCell>
          <TableHeaderCell>Change</TableHeaderCell>
          <TableHeaderCell>{months}-month average</TableHeaderCell>
        </tr>
      </thead>
      <tbody>
        {changes.flatMap(change => [
          <GroupRow
            key={change.name}
            average={averageOf(change.name)}
            change={change}
            context={context}
            expanded={open.includes(change.name)}
            share={getPercentage(change.afterMinor, total)}
            onToggle={() => toggle(change.name)}
          />,
          open.includes(change.name) && (
            <CategoryRows
              key={`${change.name}-categories`}
              categories={categories}
              context={context}
              group={change.name}
            />
          ),
        ])}
      </tbody>
    </Table>
  );
}

export function AnalyticsSpending({ context }: { context: AnalyticsContext }) {
  const { currency, filters, format, formatTick } = context;
  const months = chartMonths(filters);

  const range = {
    currency,
    month: filters.month,
    months: filters.range,
  };

  const byMonth = useBreakdown('groupByMonth', {
    currency,
    month: filters.month,
    months,
  });

  const current = useBreakdown('group', range);
  const previous = useBreakdown('group', { ...range, month: comparisonEnd(filters) });
  const categories = useBreakdown('category', range);
  const stacked = stackedRows(byMonth.data ?? [], periodMonths(filters.month, months), currency);

  return (
    <>
      <Panel
        title="Spending by group over time"
        description={`Last ${months} months · ${currency}`}
      >
        <StackedGroups
          data={stacked.data}
          series={stacked.series}
          format={format}
          formatTick={formatTick}
          label={`Spending by group per month in ${currency}`}
        />
      </Panel>
      <Panel
        title="Breakdown"
        description="Open a group to see its categories; amounts open the matching transactions."
      >
        <QueryContent pending={current.isPending || previous.isPending} loading="Loading…">
          {() => (
            <BreakdownTable
              byMonth={byMonth.data ?? []}
              categories={categories.data ?? []}
              context={context}
              current={current.data ?? []}
              previous={previous.data ?? []}
            />
          )}
        </QueryContent>
      </Panel>
    </>
  );
}
