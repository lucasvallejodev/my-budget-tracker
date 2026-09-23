'use client';

import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

import { MetricValue, Panel, Text } from '@/components/ui';
import { PERCENT_SCALE } from '@/constants/money';
import { getPercentage } from '@/lib/math';
import { formatMajorAmount } from '@/lib/money';
import { Colors } from '@/styles/theme';

import { ChartFrame } from '../chart-frame';

const GaugeStartAngle = 180;
const GaugeEndAngle = 0;

export function TargetCard({ target, value }: { target: number; value: number }) {
  const percent = getPercentage(value, target);

  return (
    <Panel title="Target" description="Income target progress">
      <ChartFrame label={`${percent}% of income target`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={[
                { value: Math.min(PERCENT_SCALE, percent) },
                { value: Math.max(0, PERCENT_SCALE - percent) },
              ]}
              dataKey="value"
              startAngle={GaugeStartAngle}
              endAngle={GaugeEndAngle}
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
      </ChartFrame>
      <MetricValue>{percent}%</MetricValue>
      <Text tone="muted">
        {formatMajorAmount(value)} of {formatMajorAmount(target)}
      </Text>
    </Panel>
  );
}
