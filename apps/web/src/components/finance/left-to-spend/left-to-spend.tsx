'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Button, DescriptionList, Panel, QueryContent, Stat } from '@/components/ui';
import { formatMoney } from '@coinkeeper/shared/lib/money';

import { type LeftToSpend as LeftToSpendFigures, useLeftToSpend } from '../use-finance-data';

const allowanceText = (figures: LeftToSpendFigures, format: (value: number) => string): string => {
  if (figures.leftMinor < 0) return `${format(-figures.leftMinor)} more is planned than came in`;
  if (!figures.daysLeft) return 'This month has ended';

  const days = figures.daysLeft === 1 ? '1 day' : `${figures.daysLeft} days`;

  return `${format(figures.perDayMinor)} a day for ${days}`;
};

const breakdown = (figures: LeftToSpendFigures, format: (value: number) => string) => [
  // keep order
  { detail: format(figures.incomeMinor), term: 'Income received' },
  { detail: `− ${format(figures.billsDueMinor)}`, term: 'Bills still due' },
  { detail: `− ${format(figures.budgetedMinor)}`, term: 'Budgets' },
  { detail: `− ${format(figures.unbudgetedSpentMinor)}`, term: 'Spending without a budget' },
];

export function LeftToSpend({ currency, month }: { currency: string; month: string }) {
  const query = useLeftToSpend(month, currency);
  const format = (value: number) => formatMoney(value, currency);

  return (
    <Panel
      title="Left to spend"
      description={`This month · ${currency} · income received, minus bills still due and budgets`}
      action={
        <Button asChild variant="ghost" size="sm">
          <Link href="/upcoming">
            What is due <ArrowRight aria-hidden />
          </Link>
        </Button>
      }
    >
      <QueryContent
        pending={query.isPending}
        error={query.isError}
        loading="Working out what is left…"
      >
        {() =>
          query.data && (
            <>
              <Stat
                size="large"
                label="Free to spend"
                value={format(query.data.leftMinor)}
                meta={allowanceText(query.data, format)}
              />
              <DescriptionList items={breakdown(query.data, format)} />
            </>
          )
        }
      </QueryContent>
    </Panel>
  );
}
