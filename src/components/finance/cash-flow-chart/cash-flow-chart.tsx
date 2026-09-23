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
import { formatMajorAmount } from '@/lib/money';
import { Patterns } from '@/lib/patterns';
import { ChartStyle, Colors } from '@/styles/theme';

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
}: {
  action?: ReactNode;
  data: CashPoint[];
  description?: string;
  format?: (value: number) => string;
}) {
  const id = useId().replace(Patterns.reactIdColon, '');

  return (
    <Panel title="Cash Flow" description={description} action={action}>
      <ChartFrame>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} accessibilityLayer>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={Colors.chart.income} stopOpacity={IncomeFillOpacity} />
                <stop offset="100%" stopColor={Colors.chart.income} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={ChartStyle.grid} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={ChartStyle.axisTick} />
            <YAxis width={AxisWidth} axisLine={false} tickLine={false} tick={ChartStyle.axisTick} />
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
              name="Expenses"
              dataKey="expense"
              stroke={Colors.chart.expense}
              strokeDasharray="5 5"
              fill="transparent"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartFrame>
      <Text tone="muted">Purple: income · Dashed: expenses</Text>
    </Panel>
  );
}
