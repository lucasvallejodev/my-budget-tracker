'use client';

import { ReactNode, useId } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Panel, Stack } from '@/components/ui';
import { ChartStyle, Colors } from '@/styles/theme';
import { formatMajorAmount } from '@coinkeeper/shared/lib/money';
import { Patterns } from '@coinkeeper/shared/lib/patterns';

import { ChartFrame } from '../chart-frame';
import { ChartLegend } from '../chart-legend';

const AxisWidth = 60;
const StrokeWidth = 2;
const FillOpacity = 0.35;

const Series = [
  {
    color: Colors.chart.income,
    key: 'income',
    label: 'Income',
  },
  {
    color: Colors.chart.expense,
    key: 'expense',
    label: 'Spending',
  },
] as const;

export type CashPoint = {
  expense: number;
  income: number;
  label: string;
};

export function CashFlowChart({
  action,
  data,
  description = 'Income vs Expenses',
  format = formatMajorAmount,
  formatTick = format,
}: {
  action?: ReactNode;
  data: CashPoint[];
  description?: string;
  format?: (value: number) => string;
  formatTick?: (value: number) => string;
}) {
  const id = useId().replace(Patterns.reactIdColon, '');

  return (
    <Panel title="Cash flow" description={description} action={action}>
      <Stack gap="medium">
        <ChartLegend items={[...Series]} />
        <ChartFrame
          label="Income and spending per month"
          data={{
            columns: ['Month', 'Income', 'Spending'],
            rows: data.map(point => ({
              label: point.label,
              values: [format(point.income), format(point.expense)],
            })),
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} accessibilityLayer={false}>
              <defs>
                {Series.map(series => (
                  <linearGradient
                    key={series.key}
                    id={`${id}-${series.key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={series.color} stopOpacity={FillOpacity} />
                    <stop offset="100%" stopColor={series.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} stroke={ChartStyle.grid} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={ChartStyle.axisTick} />
              <YAxis
                width={AxisWidth}
                axisLine={false}
                tickLine={false}
                tick={ChartStyle.axisTick}
                tickFormatter={value => formatTick(Number(value))}
              />
              <Tooltip
                formatter={value => format(Number(value))}
                contentStyle={ChartStyle.tooltip}
              />
              {Series.map(series => (
                <Area
                  key={series.key}
                  type="monotone"
                  name={series.label}
                  dataKey={series.key}
                  stroke={series.color}
                  strokeWidth={StrokeWidth}
                  fill={`url(#${id}-${series.key})`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </ChartFrame>
      </Stack>
    </Panel>
  );
}
