import './progress-bar.scss';

import { PERCENT_SCALE } from '@coinkeeper/shared/constants/money';

const clampedPercent = (value: number, max: number) =>
  Math.min(PERCENT_SCALE, Math.max(0, (value / max) * PERCENT_SCALE));

export function ProgressBar({
  label,
  marker,
  max,
  value,
}: {
  label: string;
  marker?: number;
  max: number;
  value: number;
}) {
  return (
    <div className="progress-bar">
      <progress className="progress-bar__track" max={max} value={value} aria-label={label} />
      {marker !== undefined && max > 0 && (
        <span
          className="progress-bar__marker"
          aria-hidden="true"
          style={{ insetInlineStart: `${clampedPercent(marker, max)}%` }}
        />
      )}
    </div>
  );
}
