import './home-hero.scss';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Badge, Button, ColorSwatch, ProgressBar, Stat } from '@/components/ui';
import { getPercentage } from '@/lib/math';

import { type BudgetFigures, BudgetStates } from '../budget-status';
import { monthTotals } from '../budget-summary';
import { compareWith } from '../comparisons';
import { MetricIcon } from '../metric-icon';
import { monthLabel } from '../use-finance-data';

type Format = (value: number) => string;

export type HeroTotals = {
  incomeMinor: number;
  previousIncomeMinor: number;
  previousSpendingMinor: number;
  spendingMinor: number;
};

const planBadge = (totals: ReturnType<typeof monthTotals>, format: Format) => {
  if (totals.state === 'over') return <Badge tone="danger">{BudgetStates.over.label}</Badge>;
  if (!totals.pace.isCurrent) return null;

  if (totals.pace.aheadMinor > 0) {
    return <Badge tone="warning">{format(totals.pace.aheadMinor)} ahead of plan</Badge>;
  }

  return <Badge>{format(-totals.pace.aheadMinor)} under plan</Badge>;
};

function LeftToSpend({
  figures,
  format,
  month,
  today,
}: {
  figures: BudgetFigures[];
  format: Format;
  month: string;
  today: string;
}) {
  const totals = monthTotals(figures, month, today);
  const { limitMinor, pace, progress, spentMinor } = totals;
  const monthGone = getPercentage(progress.daysElapsed, totals.period.days);

  return (
    <>
      <div className="home-hero__amount">
        <span className="home-hero__value">{format(limitMinor - spentMinor)}</span>
        <span className="home-hero__total">of {format(limitMinor)} budgeted</span>
        {planBadge(totals, format)}
      </div>
      <ProgressBar
        label={`${getPercentage(spentMinor, limitMinor)}% of the budget spent`}
        max={limitMinor || 1}
        value={Math.min(spentMinor, limitMinor)}
        size="large"
        tone={BudgetStates[totals.state].progress}
        marker={pace.isCurrent ? pace.expectedMinor : undefined}
        markerLabel={pace.isCurrent ? 'Today' : undefined}
      />
      <p className="home-hero__legend">
        <span>
          <ColorSwatch color={BudgetStates[totals.state].fill} /> Spent {format(spentMinor)} ·{' '}
          {getPercentage(spentMinor, limitMinor)}%
          {pace.isCurrent && ` · ${monthGone}% of the month gone`}
        </span>
        {pace.isCurrent && pace.perDayLeftMinor > 0 && (
          <span>
            <strong className="home-hero__allowance">{format(pace.perDayLeftMinor)} a day</strong>{' '}
            for the last {progress.daysLeft} day{progress.daysLeft === 1 ? '' : 's'}
          </span>
        )}
      </p>
    </>
  );
}

function NoBudgets() {
  return (
    <p className="home-hero__prompt">
      Add monthly limits to see what is left to spend and whether you are on pace.{' '}
      <Link href="/budgets">Add budgets</Link>
    </p>
  );
}

export function HomeHero({
  figures,
  format,
  month,
  previousMonth,
  today,
  totals,
}: {
  figures: BudgetFigures[];
  format: Format;
  month: string;
  previousMonth: string;
  today: string;
  totals: HeroTotals;
}) {
  const previousName = monthLabel(previousMonth).split(' ')[0];
  const income = compareWith(totals.incomeMinor, totals.previousIncomeMinor, previousName, true);

  const spending = compareWith(
    totals.spendingMinor,
    totals.previousSpendingMinor,
    previousName,
    false
  );

  const kept = totals.incomeMinor - totals.spendingMinor;

  return (
    <section className="home-hero" aria-label="This month">
      <div className="home-hero__head">
        <p className="home-hero__eyebrow">
          {figures.length ? `Left to spend in ${monthLabel(month).split(' ')[0]}` : 'This month'}
        </p>
        <Button asChild variant="ghost" size="sm">
          <Link href="/budgets">
            Budgets <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
      {figures.length ? (
        <LeftToSpend figures={figures} format={format} month={month} today={today} />
      ) : (
        <NoBudgets />
      )}
      <div className="home-hero__figures">
        <Stat
          label="Income"
          leading={<MetricIcon kind="income" />}
          value={format(totals.incomeMinor)}
          delta={income.delta}
          meta={income.meta}
        />
        <Stat
          label="Spending"
          leading={<MetricIcon kind="spending" />}
          value={format(totals.spendingMinor)}
          delta={spending.delta}
          meta={spending.meta}
        />
        <Stat
          label="Kept"
          leading={<MetricIcon kind="kept" />}
          value={format(kept)}
          meta={
            totals.incomeMinor
              ? `${getPercentage(kept, totals.incomeMinor)}% of income`
              : 'No income yet'
          }
        />
      </div>
    </section>
  );
}
