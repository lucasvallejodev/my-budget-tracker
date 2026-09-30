import './spending-bars.scss';

import { ArrowDown, ArrowUp } from 'lucide-react';
import Link from 'next/link';

import { ColorSwatch, EmptyState, ProgressBar } from '@/components/ui';
import { getPercentage } from '@/lib/math';
import { transactionsHref } from '@/lib/navigation';
import { cn } from '@/lib/styles';
import { PERCENT_SCALE } from '@coinkeeper/shared/constants/money';

import type { GroupSlice } from '../use-finance-data';

export type SpendingSlice = {
  color: string;
  name: string;
  previousMinor?: number;
  spentMinor: number;
};

type SpendingBar = SpendingSlice & { others?: string[] };

const DefaultVisibleRows = 5;
const OthersColor = 'var(--color-chart-muted)';

export const groupSpendingSlices = (
  current: GroupSlice[],
  previous: GroupSlice[],
  currency: string
): SpendingSlice[] =>
  current
    .filter(slice => slice.currency === currency)
    .map(slice => ({
      color: slice.color,
      name: slice.groupName,
      previousMinor: previous.find(
        candidate => candidate.currency === currency && candidate.groupName === slice.groupName
      )?.spentMinor,
      spentMinor: slice.spentMinor,
    }));

export const hasSpendingIn = (slices: GroupSlice[], currency: string) =>
  slices.some(slice => slice.currency === currency && slice.spentMinor > 0);

export const foldSmallSlices = (slices: SpendingSlice[], visible: number): SpendingBar[] => {
  const sorted = slices
    .filter(slice => slice.spentMinor > 0)
    .sort((left, right) => right.spentMinor - left.spentMinor);

  if (sorted.length <= visible + 1) return sorted;

  const rest = sorted.slice(visible);

  return [
    ...sorted.slice(0, visible),
    {
      color: OthersColor,
      name: `Other groups (${rest.length})`,
      others: rest.map(slice => slice.name),
      spentMinor: rest.reduce((sum, slice) => sum + slice.spentMinor, 0),
    },
  ];
};

function Change({ bar, comparison }: { bar: SpendingBar; comparison?: string }) {
  if (bar.others) return <span className="spending-bars__note">{bar.others.join(', ')}</span>;
  if (!comparison) return null;
  if (!bar.previousMinor) return <span className="spending-bars__note">None in {comparison}</span>;

  const change = getPercentage(bar.spentMinor - bar.previousMinor, bar.previousMinor);

  if (!change) return <span className="spending-bars__note">Same as {comparison}</span>;

  const Arrow = change > 0 ? ArrowUp : ArrowDown;

  return (
    <span className="spending-bars__note">
      <span className={cn('spending-bars__change', { 'spending-bars__change--up': change > 0 })}>
        <Arrow aria-hidden />
        {change > 0 ? '+' : '−'}
        {Math.abs(change)}%
      </span>{' '}
      vs {comparison}
    </span>
  );
}

export function SpendingBars({
  comparison,
  format,
  month,
  slices,
  visible = DefaultVisibleRows,
}: {
  comparison?: string;
  format: (value: number) => string;
  month: string;
  slices: SpendingSlice[];
  visible?: number;
}) {
  const bars = foldSmallSlices(slices, visible);
  const total = bars.reduce((sum, bar) => sum + bar.spentMinor, 0);

  if (!total) return <EmptyState title="No spending yet" />;

  return (
    <ul className="spending-bars">
      {bars.map(bar => {
        const share = getPercentage(bar.spentMinor, total);

        return (
          <li key={bar.name} className="spending-bars__row">
            <span className="spending-bars__name">
              <ColorSwatch color={bar.color} />
              {bar.others ? (
                bar.name
              ) : (
                <Link href={transactionsHref(bar.name, month)}>{bar.name}</Link>
              )}
            </span>
            <span className="spending-bars__bar">
              <ProgressBar
                label={`${bar.name}: ${share}% of spending`}
                max={PERCENT_SCALE}
                value={share}
                color={bar.color}
              />
              <Change bar={bar} comparison={comparison} />
            </span>
            <span className="spending-bars__amount">
              {format(bar.spentMinor)}
              <span className="spending-bars__note">{share}%</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
