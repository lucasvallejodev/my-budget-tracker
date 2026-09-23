'use client';

import { ChartStyle, Colors } from '@/styles/theme';
import { getPercentage } from '@/lib/math';
import { useId } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Panel, money, EmptyState } from './blocks';
import s from './finance.module.scss';

export type CashPoint = {
  label: string;
  income: number;
  expense: number;
};
export type Segment = {
  name: string;
  value: number;
  color?: string;
};

export function CashFlowChart({
  data,
  action,
  format = money,
  description = 'Income vs Expenses',
}: {
  data: CashPoint[];
  action?: React.ReactNode;
  format?: (value: number) => string;
  description?: string;
}) {
  const id = useId().replace(/:/g, '');

  return (
    <Panel title="Cash Flow" description={description} action={action}>
      <div className={s.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} accessibilityLayer>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={Colors.chart.income} stopOpacity={0.3} />
                <stop offset="100%" stopColor={Colors.chart.income} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={ChartStyle.grid} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={ChartStyle.axisTick} />
            <YAxis width={60} axisLine={false} tickLine={false} tick={ChartStyle.axisTick} />
            <Tooltip formatter={value => format(Number(value))} contentStyle={ChartStyle.tooltip} />
            <Area
              type="monotone"
              name="Income"
              dataKey="income"
              stroke={Colors.chart.income}
              strokeWidth={3}
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
      </div>
      <p className={s.muted}>Purple: income · Dashed: expenses</p>
    </Panel>
  );
}

export function DistributionChart({
  title = 'Top Expenses',
  data,
  action,
  format = money,
}: {
  title?: string;
  data: Segment[];
  action?: React.ReactNode;
  format?: (value: number) => string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const fill = (d: Segment, i: number) =>
    d.color ?? Colors.chart.series[i % Colors.chart.series.length];

  return (
    <Panel title={title} action={action}>
      {total <= 0 ? (
        <EmptyState title="No activity yet" />
      ) : (
        <>
          <div
            className={s.chart}
            role="img"
            aria-label={data.map(d => `${d.name}: ${format(d.value)}`).join(', ')}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="68%"
                  outerRadius="92%"
                  paddingAngle={3}
                  cornerRadius={6}
                  stroke="none"
                >
                  {data.map((d, i) => (
                    <Cell key={d.name} fill={fill(d, i)} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={value => format(Number(value))}
                  contentStyle={ChartStyle.tooltip}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className={s.legend}>
            {data.map((d, i) => (
              <div key={d.name} className={s.legendRow}>
                <span className={s.swatch} style={{ background: fill(d, i) }} />
                {d.name}
                <strong>{format(d.value)}</strong>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}

export function TargetCard({ value, target }: { value: number; target: number }) {
  const percent = getPercentage(value, target);

  return (
    <Panel title="Target" description="Income target progress">
      <div className={s.chart} role="img" aria-label={`${percent}% of income target`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={[{ value: Math.min(100, percent) }, { value: Math.max(0, 100 - percent) }]}
              dataKey="value"
              startAngle={180}
              endAngle={0}
              innerRadius="65%"
              outerRadius="90%"
              cy="75%"
              stroke="none"
            >
              <Cell fill={Colors.chart.used} />
              <Cell fill="var(--border)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className={s.metricValue}>{percent}%</div>
      <p className={s.muted}>
        {money(value)} of {money(target)}
      </p>
    </Panel>
  );
}
