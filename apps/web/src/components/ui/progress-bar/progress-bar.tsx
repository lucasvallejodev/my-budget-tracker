import './progress-bar.scss';

import { CSSProperties } from 'react';

import { cn } from '@/lib/styles';
import { PERCENT_SCALE } from '@coinkeeper/shared/constants/money';

export type ProgressTone = 'brand' | 'danger' | 'positive' | 'warning';

export type ProgressSize = 'default' | 'large';

const ToneClassNames: Record<ProgressTone, string> = {
  brand: '',
  danger: 'progress-bar--danger',
  positive: 'progress-bar--positive',
  warning: 'progress-bar--warning',
};

const SizeClassNames: Record<ProgressSize, string> = {
  default: '',
  large: 'progress-bar--large',
};

const LabelEdgePercent = 15;

const labelPlacement = (percent: number) => {
  if (percent > PERCENT_SCALE - LabelEdgePercent) return 'progress-bar__marker-label--end';
  if (percent < LabelEdgePercent) return 'progress-bar__marker-label--start';

  return '';
};

const clampedPercent = (value: number, max: number) =>
  Math.min(PERCENT_SCALE, Math.max(0, (value / max) * PERCENT_SCALE));

function ProgressMarker({ label, percent }: { label?: string; percent: number }) {
  const style = { insetInlineStart: `${percent}%` };

  return (
    <>
      <span className="progress-bar__marker" aria-hidden="true" style={style} />
      {label && (
        <span
          className={cn('progress-bar__marker-label', labelPlacement(percent))}
          aria-hidden="true"
          style={style}
        >
          {label}
        </span>
      )}
    </>
  );
}

export function ProgressBar({
  color,
  label,
  marker,
  markerLabel,
  max,
  size = 'default',
  tone = 'brand',
  value,
}: {
  color?: string;
  label: string;
  marker?: number;
  markerLabel?: string;
  max: number;
  size?: ProgressSize;
  tone?: ProgressTone;
  value: number;
}) {
  const showMarker = marker !== undefined && max > 0;

  return (
    <div
      className={cn('progress-bar', ToneClassNames[tone], SizeClassNames[size], {
        'progress-bar--labelled': showMarker && !!markerLabel,
      })}
      style={color ? ({ '--progress-bar-fill': color } as CSSProperties) : undefined}
    >
      <progress className="progress-bar__track" max={max} value={value} aria-label={label} />
      {showMarker && <ProgressMarker label={markerLabel} percent={clampedPercent(marker, max)} />}
    </div>
  );
}
