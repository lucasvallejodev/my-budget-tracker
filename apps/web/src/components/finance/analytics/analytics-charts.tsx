'use client';

import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  type BarRectangleItem,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ChartStyle, Colors } from '@/styles/theme';

import { ChartFrame, type ChartTable } from '../chart-frame';

const AxisWidth = 64;
const BarRadius = 6;
const LegendIconSize = 10;
const MaxBarSize = 28;
const StackId = 'groups';
const StackedBarSize = 40;

type Format = (value: number) => string;

const legendLabel = (value: string) => <span style={{ color: Colors.textMuted }}>{value}</span>;

const barChartFrame = (format: Format, formatTick: Format) => [
  <CartesianGrid key="grid" vertical={false} stroke={ChartStyle.grid} />,
  <XAxis key="x" dataKey="label" axisLine={false} tickLine={false} tick={ChartStyle.axisTick} />,
  <YAxis
    key="y"
    width={AxisWidth}
    axisLine={false}
    tickLine={false}
    tick={ChartStyle.axisTick}
    tickFormatter={value => formatTick(Number(value))}
  />,
  <Tooltip
    key="tooltip"
    formatter={value => format(Number(value))}
    contentStyle={ChartStyle.tooltip}
  />,
  <Legend
    key="legend"
    iconType="circle"
    iconSize={LegendIconSize}
    wrapperStyle={ChartStyle.legend}
    formatter={legendLabel}
  />,
];

function BarFrame({
  children,
  data,
  format,
  formatTick,
  label,
  table,
}: Readonly<{
  children: ReactNode;
  data: object[];
  format: Format;
  formatTick: Format;
  label: string;
  table: ChartTable;
}>) {
  return (
    <ChartFrame label={label} data={table}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} accessibilityLayer={false}>
          {barChartFrame(format, formatTick)}
          {children}
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

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

const selectBar = (bar: BarRectangleItem, onSelect?: (month: string) => void) => {
  const month = (bar.payload as MonthlyBar | undefined)?.month;

  if (month) onSelect?.(month);
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
    <BarFrame
      data={data}
      format={format}
      formatTick={formatTick}
      label={label}
      table={{
        columns: ['Month', 'Income', 'Spending'],
        rows: data.map(row => ({
          label: row.label,
          values: [format(row.income), format(row.expense)],
        })),
      }}
    >
      <Bar
        name="Income"
        dataKey="income"
        cursor={onSelect ? 'pointer' : undefined}
        onClick={bar => selectBar(bar, onSelect)}
        fill={Colors.chart.income}
        radius={[BarRadius, BarRadius, 0, 0]}
        maxBarSize={MaxBarSize}
      />
      <Bar
        name="Spending"
        dataKey="expense"
        cursor={onSelect ? 'pointer' : undefined}
        onClick={bar => selectBar(bar, onSelect)}
        fill={Colors.chart.expense}
        radius={[BarRadius, BarRadius, 0, 0]}
        maxBarSize={MaxBarSize}
      />
    </BarFrame>
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
    <BarFrame
      data={data}
      format={format}
      formatTick={formatTick}
      label={label}
      table={{
        columns: ['Month', ...series.map(item => item.name)],
        rows: data.map(row => ({
          label: String(row.label),
          values: series.map(item => format(Number(row[item.key] ?? 0))),
        })),
      }}
    >
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
    </BarFrame>
  );
}
