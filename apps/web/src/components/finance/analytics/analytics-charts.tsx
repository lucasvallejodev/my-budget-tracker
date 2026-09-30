'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ChartStyle, Colors } from '@/styles/theme';

import { ChartFrame } from '../chart-frame';

const AxisWidth = 64;
const BarRadius = 4;
const MaxBarSize = 28;
const StackId = 'groups';
const StackedBarSize = 56;

type Format = (value: number) => string;

export type MonthlyBar = {
  expense: number;
  income: number;
  label: string;
  month: string;
};

export type StackSeries = {
  color: string;
  key: string;
  name: string;
};

export function MonthlyBars({
  data,
  format,
  formatTick,
  label,
  onSelect,
}: {
  data: MonthlyBar[];
  format: Format;
  formatTick: Format;
  label: string;
  onSelect?: (month: string) => void;
}) {
  return (
    <ChartFrame label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          accessibilityLayer
          onClick={state => {
            const month = data[Number(state.activeTooltipIndex)]?.month;

            if (month) onSelect?.(month);
          }}
        >
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
          <Legend />
          <Bar
            name="Income"
            dataKey="income"
            fill={Colors.chart.income}
            radius={[BarRadius, BarRadius, 0, 0]}
            maxBarSize={MaxBarSize}
          />
          <Bar
            name="Spending"
            dataKey="expense"
            fill={Colors.chart.expense}
            radius={[BarRadius, BarRadius, 0, 0]}
            maxBarSize={MaxBarSize}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function StackedGroups({
  data,
  format,
  formatTick,
  label,
  series,
}: {
  data: Record<string, number | string>[];
  format: Format;
  formatTick: Format;
  label: string;
  series: StackSeries[];
}) {
  return (
    <ChartFrame label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} accessibilityLayer>
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
          <Legend />
          {series.map(item => (
            <Bar
              key={item.key}
              name={item.name}
              dataKey={item.key}
              stackId={StackId}
              fill={item.color}
              maxBarSize={StackedBarSize}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
