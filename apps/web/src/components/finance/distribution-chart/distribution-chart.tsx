'use client';

import './distribution-chart.scss';

import { ReactNode } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { ColorSwatch, EmptyState, Panel } from '@/components/ui';
import { ChartStyle, Colors } from '@/styles/theme';
import { formatMajorAmount } from '@coinkeeper/shared/lib/money';

import { ChartFrame } from '../chart-frame';

const SegmentGap = 3;
const SegmentCornerRadius = 6;

export type Segment = {
  color?: string;
  name: string;
  value: number;
};

export function DistributionChart({
  action,
  data,
  format = formatMajorAmount,
  title = 'Top Expenses',
}: {
  action?: ReactNode;
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
          <ChartFrame
            label={data.map(segment => `${segment.name}: ${format(segment.value)}`).join(', ')}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="68%"
                  outerRadius="92%"
                  paddingAngle={SegmentGap}
                  cornerRadius={SegmentCornerRadius}
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
          </ChartFrame>
          <div className="distribution-chart__legend">
            {data.map((segment, index) => (
              <div key={segment.name} className="distribution-chart__legend-row">
                <ColorSwatch color={fill(segment, index)} />
                {segment.name}
                <strong className="distribution-chart__legend-value">
                  {format(segment.value)}
                </strong>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}
