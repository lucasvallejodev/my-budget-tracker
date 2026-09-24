import './progress-bar.scss';

export function ProgressBar({ label, max, value }: { label: string; max: number; value: number }) {
  return <progress className="progress-bar" max={max} value={value} aria-label={label} />;
}
