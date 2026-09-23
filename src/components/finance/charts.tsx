'use client';

import { useId } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { PERCENT_SCALE } from '@/constants/money';
import { getPercentage } from '@/lib/math';
import { Patterns } from '@/lib/patterns';
import { ChartStyle, Colors } from '@/styles/theme';

import { EmptyState, money, Panel } from './blocks';
import styles from './finance.module.scss';

export type CashPoint = {
  expense: number;
  income: number;
  label: string;
};
export type Segment = {
  color?: string;
  name: string;
  value: number;
};

export function CashFlowChart({
  action,
  data,
  description = 'Income vs Expenses',
  format = money,
}: {
  action?: React.ReactNode;
  data: CashPoint[];
  description?: string;
  format?: (value: number) => string;
}) {
  const id = useId().replace(Patterns.reactIdColon, '');

  return (
    <Panel title="Cash Flow" description={description} action={action}>
      <div className={styles.chart}>
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
      <p className={styles.muted}>Purple: income · Dashed: expenses</p>
    </Panel>
  );
}

export function DistributionChart({
  action,
  data,
  format = money,
  title = 'Top Expenses',
}: {
  action?: React.ReactNode;
  data: Segment[];
  format?: (value: number) => string;
  title?: string;
}) {
  const total = data.reduce((sum, segment) => sum + segment.value, 0);

  const fill = (segment: Segment, index: number) =>
    segment.color ?? Colors.chart.series[index % Colors.chart.series.length];

  return (
    <Panel title={title} action={action}>
      {total <= 0 ? (
        <EmptyState title="No activity yet" />
      ) : (
        <>
          <div
            className={styles.chart}
            role="img"
            aria-label={data.map(segment => `${segment.name}: ${format(segment.value)}`).join(', ')}
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
                  {data.map((segment, index) => (
                    <Cell key={segment.name} fill={fill(segment, index)} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={value => format(Number(value))}
                  contentStyle={ChartStyle.tooltip}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.legend}>
            {data.map((segment, index) => (
              <div key={segment.name} className={styles.legendRow}>
                <span className={styles.swatch} style={{ background: fill(segment, index) }} />
                {segment.name}
                <strong>{format(segment.value)}</strong>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}

export function TargetCard({ target, value }: { target: number; value: number }) {
  const percent = getPercentage(value, target);

  return (
    <Panel title="Target" description="Income target progress">
      <div className={styles.chart} role="img" aria-label={`${percent}% of income target`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={[
                { value: Math.min(PERCENT_SCALE, percent) },
                { value: Math.max(0, PERCENT_SCALE - percent) },
              ]}
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
      <div className={styles.metricValue}>{percent}%</div>
      <p className={styles.muted}>
        {money(value)} of {money(target)}
      </p>
    </Panel>
  );
}
