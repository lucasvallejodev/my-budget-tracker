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

import { Panel, Text } from '@/components/ui';
import { ChartStyle, Colors } from '@/styles/theme';
import { formatMajorAmount } from '@coinkeeper/shared/lib/money';
import { Patterns } from '@coinkeeper/shared/lib/patterns';

import { ChartFrame } from '../chart-frame';

const AxisWidth = 60;
const IncomeStrokeWidth = 3;
const IncomeFillOpacity = 0.3;

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
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={Colors.chart.income} stopOpacity={IncomeFillOpacity} />
                <stop offset="100%" stopColor={Colors.chart.income} stopOpacity={0} />
              </linearGradient>
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
            <Tooltip formatter={value => format(Number(value))} contentStyle={ChartStyle.tooltip} />
            <Area
              type="monotone"
              name="Income"
              dataKey="income"
              stroke={Colors.chart.income}
              strokeWidth={IncomeStrokeWidth}
              fill={`url(#${id})`}
            />
            <Area
              type="monotone"
              name="Spending"
              dataKey="expense"
              stroke={Colors.chart.expense}
              strokeDasharray="5 5"
              fill="transparent"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartFrame>
      <Text tone="muted">Solid green line: income · Dashed line: spending</Text>
    </Panel>
  );
}
