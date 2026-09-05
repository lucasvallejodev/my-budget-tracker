'use client';
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
export type CashPoint = { label: string; income: number; expense: number };
export type Segment = { name: string; value: number };
const colors = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#e5e7eb'];
export function CashFlowChart({ data, action }: { data: CashPoint[]; action?: React.ReactNode }) {
  const id = useId().replace(/:/g, '');
  return (
    <Panel title="Cash Flow" description="Income vs Expenses" action={action}>
      <div className={s.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} accessibilityLayer>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--muted)', fontSize: 11 }}
            />
            <YAxis
              width={50}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--muted)', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--surface)',
                color: 'var(--ink)',
                border: '1px solid var(--border)',
                borderRadius: 10,
              }}
            />
            <Area
              type="monotone"
              name="Income"
              dataKey="income"
              stroke="#8b5cf6"
              strokeWidth={3}
              fill={`url(#${id})`}
            />
            <Area
              type="monotone"
              name="Expenses"
              dataKey="expense"
              stroke="#9ca3af"
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
}: {
  title?: string;
  data: Segment[];
  action?: React.ReactNode;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <Panel title={title} action={action}>
      {total <= 0 ? (
        <EmptyState title="No activity yet" />
      ) : (
        <>
          <div
            className={s.chart}
            role="img"
            aria-label={data.map(d => `${d.name}: ${money(d.value)}`).join(', ')}
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
                    <Cell key={d.name} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className={s.legend}>
            {data.map((d, i) => (
              <div key={d.name} className={s.legendRow}>
                <span className={s.swatch} style={{ background: colors[i % colors.length] }} />
                {d.name}
                <strong>{money(d.value)}</strong>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}
export function TargetCard({ value, target }: { value: number; target: number }) {
  const percent = target > 0 ? Math.round((value / target) * 100) : 0;
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
              <Cell fill="#8b5cf6" />
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
