'use client';

import './balance-summary.scss';

import { useState } from 'react';

import { ColorSwatch, Panel, SegmentedControl, Text } from '@/components/ui';
import { getPercentage } from '@/lib/math';
import { formatMoney } from '@coinkeeper/shared/lib/money';

import type { AccountSummary } from '../use-finance-data';
import { type BalanceSide, balanceSides, type TypeSlice } from './accounts-figures';

type AmountView = 'percent' | 'totals';

const AmountViewOptions: { label: string; value: AmountView }[] = [
  { label: 'Totals', value: 'totals' },
  { label: 'Percent', value: 'percent' },
];

const sliceShare = (slice: TypeSlice, side: BalanceSide): number =>
  getPercentage(Math.max(slice.amountMinor, 0), side.totalMinor);

function SideBreakdown({
  currency,
  emptyLabel,
  side,
  title,
  view,
}: {
  currency: string;
  emptyLabel: string;
  side: BalanceSide;
  title: string;
  view: AmountView;
}) {
  const shares = side.slices.map(slice => `${slice.label} ${sliceShare(slice, side)}%`).join(', ');

  return (
    <div className="balance-summary__side">
      <p className="balance-summary__head">
        <span>{title}</span>
        <span className="balance-summary__total">{formatMoney(side.totalMinor, currency)}</span>
      </p>
      {side.slices.length ? (
        <>
          <div
            className="balance-summary__bar"
            role="img"
            aria-label={`${title} by type: ${shares}`}
          >
            {side.slices.map(slice => (
              <span
                key={slice.type}
                className="balance-summary__segment"
                style={{ background: slice.color, flexGrow: Math.max(slice.amountMinor, 0) }}
              />
            ))}
          </div>
          <ul className="balance-summary__legend">
            {side.slices.map(slice => (
              <li key={slice.type} className="balance-summary__item">
                <ColorSwatch color={slice.color} aria-hidden />
                <span className="balance-summary__label">{slice.label}</span>
                <span className="balance-summary__value">
                  {view === 'percent'
                    ? `${sliceShare(slice, side)}%`
                    : formatMoney(slice.amountMinor, currency)}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <Text tone="muted">{emptyLabel}</Text>
      )}
    </div>
  );
}

export function BalanceSummary({
  accounts,
  currency,
}: {
  accounts: AccountSummary[];
  currency: string;
}) {
  const [view, setView] = useState<AmountView>('totals');
  const { assets, liabilities } = balanceSides(accounts, currency);

  return (
    <Panel
      title={`Summary · ${currency}`}
      action={
        <SegmentedControl
          label="Show amounts as"
          options={AmountViewOptions}
          value={view}
          onChange={value => setView(value as AmountView)}
        />
      }
    >
      <div className="balance-summary">
        <SideBreakdown
          currency={currency}
          emptyLabel="No assets in this currency."
          side={assets}
          title="Assets"
          view={view}
        />
        <SideBreakdown
          currency={currency}
          emptyLabel="Nothing owed in this currency."
          side={liabilities}
          title="Liabilities"
          view={view}
        />
      </div>
    </Panel>
  );
}
