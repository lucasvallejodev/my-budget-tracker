'use client';

import './net-worth-trend.scss';

import { useId, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Panel, SegmentedControl, Stat, type StatDelta, Text } from '@/components/ui';
import { MetricKinds } from '@/constants/metrics';
import { AnalyticsRanges } from '@/lib/analytics-filters';
import { ChartStyle } from '@/styles/theme';
import { formatCompactMoney, formatMoney } from '@coinkeeper/shared/lib/money';
import { Patterns } from '@coinkeeper/shared/lib/patterns';

import type { MonthTotal } from '../net-worth';
import { countLabel, rangeChange, seriesForRange } from './accounts-figures';

const DefaultRange = 6;
const AxisWidth = 64;
const LineWidth = 2.4;
const FillOpacity = 0.25;
const MinimumChartPoints = 2;

const RangeOptions = AnalyticsRanges.map(range => ({ label: `${range}M`, value: String(range) }));

const changeDelta = (
  changeMinor: number,
  percent: number,
  currency: string
): StatDelta | undefined => {
  if (!changeMinor) return undefined;

  return {
    good: changeMinor > 0,
    label: `${formatMoney(Math.abs(changeMinor), currency)} (${Math.abs(percent)}%)`,
    rising: changeMinor > 0,
  };
};

function TrendChart({
  currency,
  label,
  points,
}: {
  currency: string;
  label: string;
  points: MonthTotal[];
}) {
  const gradientId = useId().replace(Patterns.reactIdColon, '');
  const color = MetricKinds.netWorth.color;

  if (points.length < MinimumChartPoints) {
    return <Text tone="muted">Not enough history yet to draw a trend.</Text>;
  }

  return (
    <div className="net-worth-trend__chart" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={FillOpacity} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={ChartStyle.grid} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={ChartStyle.axisTick} />
          <YAxis
            width={AxisWidth}
            axisLine={false}
            tickLine={false}
            tick={ChartStyle.axisTick}
            domain={['auto', 'auto']}
            tickFormatter={value => formatCompactMoney(Number(value), currency)}
          />
          <Tooltip
            formatter={value => formatMoney(Number(value), currency)}
            contentStyle={ChartStyle.tooltip}
          />
          <Area
            type="monotone"
            name="Net worth"
            dataKey="totalMinor"
            stroke={color}
            strokeWidth={LineWidth}
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function NetWorthTrend({
  currency,
  currentMinor,
  series,
}: {
  currency: string;
  currentMinor: number;
  series: MonthTotal[];
}) {
  const [range, setRange] = useState(DefaultRange);
  const points = seriesForRange(series, range);
  const { changeMinor, percent } = rangeChange(points, currentMinor);
  const period = countLabel(range, 'month');

  return (
    <Panel
      title="Net worth over time"
      action={
        <SegmentedControl
          label="Range"
          options={RangeOptions}
          value={String(range)}
          onChange={value => setRange(Number(value))}
        />
      }
    >
      <div className="net-worth-trend">
        <Stat
          label={`Net worth in ${currency}`}
          size="hero"
          value={formatMoney(currentMinor, currency)}
          delta={changeDelta(changeMinor, percent, currency)}
          meta={changeMinor ? `in ${period}` : `No change in ${period}`}
        />
        <TrendChart
          currency={currency}
          label={`Net worth in ${currency} over the last ${period}`}
          points={points}
        />
      </div>
    </Panel>
  );
}
