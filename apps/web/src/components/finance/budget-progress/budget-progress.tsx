import './budget-progress.scss';

import { ProgressBar, Text } from '@/components/ui';
import { getPercentage } from '@/lib/math';
import { PERCENT_SCALE } from '@coinkeeper/shared/constants/money';
import type { BudgetPace } from '@coinkeeper/shared/lib/budget-pace';
import { formatMajorAmount } from '@coinkeeper/shared/lib/money';

const planLabel = (aheadMinor: number, format: (value: number) => string) => {
  if (aheadMinor > 0) return `${format(aheadMinor)} ahead of plan`;
  if (aheadMinor < 0) return `${format(-aheadMinor)} under plan`;

  return 'On plan';
};

const allowanceLabel = (pace: BudgetPace, format: (value: number) => string) => {
  if (pace.perDayLeftMinor <= 0) return 'Nothing left to spend this month';

  return `${format(pace.perDayLeftMinor)} a day for ${pace.daysLeft} day${pace.daysLeft === 1 ? '' : 's'}`;
};

export function BudgetProgress({
  format = formatMajorAmount,
  label = 'Budget progress',
  limit,
  pace,
  spent,
}: {
  format?: (value: number) => string;
  label?: string;
  limit: number;
  pace?: BudgetPace;
  spent: number;
}) {
  const percent = getPercentage(spent, limit);
  const current = pace?.isCurrent ? pace : undefined;

  return (
    <div className="budget-progress">
      <div className="budget-progress__meta">
        <span>{percent}% used</span>
        <span>{format(Math.max(0, limit - spent))} remaining</span>
      </div>
      <ProgressBar
        label={label}
        max={PERCENT_SCALE}
        value={Math.min(PERCENT_SCALE, Math.max(0, percent))}
        marker={current && limit > 0 ? (current.expectedMinor / limit) * PERCENT_SCALE : undefined}
      />
      {current && (
        <Text size="small" tone="muted">
          {planLabel(current.aheadMinor, format)} · {allowanceLabel(current, format)}
          {current.tooFast &&
            ` · projected ${format(current.projectedMinor)} of ${format(limit)} by the end of the month`}
        </Text>
      )}
    </div>
  );
}
