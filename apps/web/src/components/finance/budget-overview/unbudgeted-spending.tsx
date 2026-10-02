'use client';

import './unbudgeted-spending.scss';

import Link from 'next/link';
import { useState } from 'react';

import { Avatar, Button, Icon, Panel } from '@/components/ui';
import { getPercentage } from '@/lib/math';
import type { BudgetSuggestion } from '@coinkeeper/shared/schema/budgets';

import {
  type BudgetRow,
  type CategorySlice,
  monthLabel,
  useBudgetSuggestions,
  useCategoryBreakdown,
} from '../use-finance-data';

const VisibleRows = 6;

type Format = (value: number) => string;

const unbudgetedSlices = (slices: CategorySlice[], budgets: BudgetRow[]) => {
  const budgeted = new Set(budgets.map(budget => budget.categoryId));

  return slices
    .filter(slice => slice.spentMinor > 0 && !budgeted.has(slice.categoryId ?? ''))
    .sort((left, right) => right.spentMinor - left.spentMinor);
};

function UnbudgetedRow({
  format,
  onAdd,
  slice,
  suggestion,
}: {
  format: Format;
  onAdd: (amountMinor: number) => void;
  slice: CategorySlice;
  suggestion?: BudgetSuggestion;
}) {
  const addAmount = suggestion?.amountMinor ?? slice.spentMinor;

  return (
    <li className="unbudgeted-spending__row">
      <span className="unbudgeted-spending__avatar">
        <Avatar color={slice.color} size="small">
          <Icon icon={slice.icon} />
        </Avatar>
      </span>
      <span className="unbudgeted-spending__name">{slice.categoryName}</span>
      <span className="unbudgeted-spending__amount">{format(slice.spentMinor)}</span>
      {slice.categoryId ? (
        <Button
          className="unbudgeted-spending__action"
          variant="ghost"
          size="sm"
          aria-label={`Add a ${format(addAmount)} budget for ${slice.categoryName}`}
          onClick={() => onAdd(addAmount)}
        >
          Add {format(addAmount)}
        </Button>
      ) : (
        <Button asChild className="unbudgeted-spending__action" variant="ghost" size="sm">
          <Link href="/review">Review</Link>
        </Button>
      )}
    </li>
  );
}

export function UnbudgetedSpending({
  budgets,
  currency,
  format,
  month,
  onAdd,
}: {
  budgets: BudgetRow[];
  currency: string;
  format: Format;
  month: string;
  onAdd: (budget: Partial<BudgetRow>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const breakdown = useCategoryBreakdown(month, currency);
  const suggestions = useBudgetSuggestions(month);
  const slices = breakdown.data ?? [];
  const rows = unbudgetedSlices(slices, budgets);

  if (!rows.length) return null;

  const total = rows.reduce((sum, slice) => sum + slice.spentMinor, 0);
  const allSpending = slices.reduce((sum, slice) => sum + slice.spentMinor, 0);
  const shown = expanded ? rows : rows.slice(0, VisibleRows);
  const hidden = rows.length - shown.length;

  return (
    <Panel
      title="Spending without a budget"
      description={`${format(total)} · ${getPercentage(total, allSpending)}% of ${monthLabel(month).split(' ')[0]} spending`}
    >
      <ul className="unbudgeted-spending__list">
        {shown.map(slice => (
          <UnbudgetedRow
            key={slice.categoryId ?? 'uncategorized'}
            slice={slice}
            format={format}
            suggestion={suggestions.data?.find(
              item => item.categoryId === slice.categoryId && item.currency === currency
            )}
            onAdd={amountMinor =>
              onAdd({
                amountMinor,
                categoryId: slice.categoryId ?? undefined,
                currency,
              })
            }
          />
        ))}
      </ul>
      {hidden > 0 && (
        <Button variant="ghost" size="sm" onClick={() => setExpanded(true)}>
          Show {hidden} more
        </Button>
      )}
    </Panel>
  );
}
