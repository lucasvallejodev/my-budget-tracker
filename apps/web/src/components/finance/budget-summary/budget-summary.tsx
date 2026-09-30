import './budget-summary.scss';

import { Check, Target, TrendingUp } from 'lucide-react';

import { Badge, ColorSwatch, ProgressBar, Stat } from '@/components/ui';
import { getPercentage } from '@/lib/math';
import { budgetPace } from '@coinkeeper/shared/lib/budget-pace';
import { calendarPeriod, periodProgress } from '@coinkeeper/shared/lib/periods';

import { type BudgetFigures, budgetState, BudgetStateOrder, BudgetStates } from '../budget-status';
import { dayMonthLabel } from '../transaction-labels';
import { monthLabel } from '../use-finance-data';

type Format = (value: number) => string;

const sumOf = (figures: BudgetFigures[], pick: (item: BudgetFigures) => number) =>
  figures.reduce((total, item) => total + pick(item), 0);

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export const monthTotals = (figures: BudgetFigures[], month: string, today: string) => {
  const limitMinor = sumOf(figures, item => item.budget.amountMinor);
  const spentMinor = sumOf(figures, item => item.budget.spentMinor);
  const period = calendarPeriod(month);

  const pace = budgetPace({
    limitMinor,
    period,
    spentMinor,
    today,
  });

  return {
    limitMinor,
    pace,
    period,
    progress: periodProgress(period, today),
    spentMinor,
    state: budgetState(spentMinor, limitMinor, pace.tooFast),
  };
};

const leftMeta = (totals: ReturnType<typeof monthTotals>, format: Format) => {
  const left = totals.limitMinor - totals.spentMinor;

  if (left < 0) return `${format(-left)} over the budget`;
  if (!totals.pace.isCurrent) return 'Month closed';

  return `${format(totals.pace.perDayLeftMinor)} a day for ${plural(totals.progress.daysLeft, 'day', 'days')}`;
};

const projectionMeta = (totals: ReturnType<typeof monthTotals>, format: Format) => {
  const difference = totals.limitMinor - totals.pace.projectedMinor;

  return difference >= 0
    ? `about ${format(difference)} under budget`
    : `about ${format(-difference)} over budget`;
};

function StatusBreakdown({ figures }: { figures: BudgetFigures[] }) {
  const counts = BudgetStateOrder.map(state => ({
    count: figures.filter(item => item.state === state).length,
    state,
  }));

  return (
    <div className="budget-summary__status">
      <p className="budget-summary__eyebrow">Status</p>
      <div className="budget-summary__segments" aria-hidden>
        {counts
          .filter(({ count }) => count)
          .map(({ count, state }) => (
            <span
              key={state}
              className="budget-summary__segment"
              style={{ background: BudgetStates[state].fill, flexGrow: count }}
            />
          ))}
      </div>
      <ul className="budget-summary__counts">
        {counts.map(({ count, state }) => (
          <li key={state} className="budget-summary__count">
            <Badge tone={BudgetStates[state].tone}>{count}</Badge>
            <span>{BudgetStates[state].label}</span>
          </li>
        ))}
      </ul>
      <p className="budget-summary__note">
        Status compares each budget with the share of the month that has passed, so 90% used near
        the end of the month is fine.
      </p>
    </div>
  );
}

export function BudgetSummary({
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
  const { limitMinor, pace, period, progress, spentMinor } = totals;
  const status = BudgetStates[totals.state];
  const monthName = monthLabel(month).split(' ')[0];
  const endLabel = dayMonthLabel(period.to);

  return (
    <section className="budget-summary" aria-label={`Budget summary for ${monthLabel(month)}`}>
      <div className="budget-summary__main">
        <p className="budget-summary__eyebrow">Left to spend in {monthName}</p>
        <div className="budget-summary__hero">
          <span className="budget-summary__hero-value">{format(limitMinor - spentMinor)}</span>
          <span className="budget-summary__hero-total">of {format(limitMinor)}</span>
          <Badge
            tone={status.tone}
            icon={totals.state === 'ok' ? <Check aria-hidden /> : undefined}
          >
            {totals.state === 'ok' ? 'On pace' : status.label}
          </Badge>
        </div>
        <ProgressBar
          label={`${getPercentage(spentMinor, limitMinor)}% of the budget spent`}
          max={limitMinor || 1}
          value={Math.min(spentMinor, limitMinor)}
          size="large"
          tone={status.progress}
          marker={pace.isCurrent ? pace.expectedMinor : undefined}
          markerLabel={
            pace.isCurrent ? `Today · ${progress.daysElapsed} of ${period.days} days` : undefined
          }
        />
        <div className="budget-summary__figures">
          <Stat
            label="Budgeted"
            leading={<Target aria-hidden className="budget-summary__icon" />}
            value={format(limitMinor)}
            meta={plural(figures.length, 'category', 'categories')}
          />
          <Stat
            label="Spent"
            leading={<ColorSwatch color={status.fill} />}
            value={format(spentMinor)}
            meta={`${getPercentage(spentMinor, limitMinor)}% of the budget`}
          />
          <Stat
            label="Left"
            leading={<ColorSwatch color="var(--color-track)" />}
            value={format(Math.max(0, limitMinor - spentMinor))}
            meta={leftMeta(totals, format)}
          />
          {pace.isCurrent && (
            <Stat
              label={`By ${endLabel}`}
              leading={<TrendingUp aria-hidden className="budget-summary__icon" />}
              value={`≈ ${format(pace.projectedMinor)}`}
              meta={projectionMeta(totals, format)}
            />
          )}
        </div>
      </div>
      <StatusBreakdown figures={figures} />
    </section>
  );
}
