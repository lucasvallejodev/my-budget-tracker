import './sparkline.scss';

import { CSSProperties } from 'react';

const Width = 100;
const Height = 32;
const Padding = 2;
const CoordinateDecimals = 2;
const MinimumPoints = 2;
const Edges = 2;

export const sparklinePath = (points: number[]): string => {
  if (points.length < MinimumPoints) return '';

  const low = Math.min(...points);
  const span = Math.max(...points) - low || 1;
  const step = Width / (points.length - 1);

  return points
    .map((point, index) => {
      const across = index * step;
      const down = Height - Padding - ((point - low) / span) * (Height - Padding * Edges);

      return `${index ? 'L' : 'M'}${across.toFixed(CoordinateDecimals)} ${down.toFixed(CoordinateDecimals)}`;
    })
    .join(' ');
};

export function Sparkline({
  color = 'var(--color-brand)',
  label,
  points,
}: {
  color?: string;
  label: string;
  points: number[];
}) {
  const path = sparklinePath(points);

  if (!path) return null;

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${Width} ${Height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      style={{ '--sparkline-color': color } as CSSProperties}
    >
      <path className="sparkline__line" d={path} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
