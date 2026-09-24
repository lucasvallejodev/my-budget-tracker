import './budget-progress.scss';

import { ProgressBar } from '@/components/ui';
import { getPercentage } from '@/lib/math';
import { PERCENT_SCALE } from '@coinkeeper/shared/constants/money';
import { formatMajorAmount } from '@coinkeeper/shared/lib/money';

export function BudgetProgress({
  format = formatMajorAmount,
  label = 'Budget progress',
  limit,
  spent,
}: {
  format?: (value: number) => string;
  label?: string;
  limit: number;
  spent: number;
}) {
  const percent = getPercentage(spent, limit);

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
      />
    </div>
  );
}
